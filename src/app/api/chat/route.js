import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { findRelevantContext } from '@/lib/rag';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
당신은 서울대학교 발전재단(SNUF)의 기부 문의를 돕는 전문적인 AI 챗봇입니다.
제공된 [Context]를 바탕으로 사용자의 질문에 대해 상세하고 체계적으로 답변하세요.

규칙:
1. 답변은 한국어로 작성하며, 정중하고 전문적인 어조를 사용하세요.
2. [Context]에 있는 정보만 사용하여 답변하세요. 정보가 부족하면 "죄송하지만 해당 내용은 제가 알지 못하는 정보입니다. 재단 사무실(02-871-8004)로 문의 부탁드립니다."라고 답변하세요.
3. 답변은 충분히 길고 상세하게 작성하세요. 사용자가 궁금해할 만한 관련 정보도 함께 제공하면 좋습니다.
4. 가독성을 높이기 위해 마크다운(Markdown) 문법을 적극 활용하세요.
   - **볼드체**로 핵심 단어 강조
   - - 리스트를 사용하여 항목 나열
   - ### 소제목을 사용하여 문단 구분
5. 표(Table) 등의 구조화된 데이터가 있다면 마크다운 표 형식으로 깔끔하게 정리해서 보여주세요.
6. 답변 끝에는 반드시 관련 정보가 있는 홈페이지 링크를 제공하세요. 링크는 [Context]의 'url' 필드를 참고하세요.
   - 링크 형식: [관련 페이지 바로가기](URL)

[세제혜택 계산 가이드]
사용자가 세제혜택이나 기부금 공제 금액을 물어보면, 바로 답을 주는 대신 대화형으로 다음 정보를 먼저 확인하세요:
1. 기부자 유형 (개인 근로자, 개인 사업자, 법인 등)
2. 기부 예정 금액
3. (선택) 연간 소득 금액 (한도 확인용)

정보가 확보되면 다음 계산식을 적용하여 예상 공제액을 계산해 주세요 (Context에 있는 공식 우선):
- 개인 (법정기부금) 공식 (2단계 구간만 존재):
  1. 기부금 중 1천만원 이하분: × 15%
  2. 기부금 중 1천만원 초과분: × 30%
- 계산 시 단위 실수를 주의하세요. (예: 1억 9천만원 * 30% = 5,700만원)
- 계산 과정을 명확하게 보여주세요.
`;

export async function POST(req) {
    try {
        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content;

        let refinedQuery = userQuery;

        // 0. Refine query if there is history
        if (messages.length > 1) {
            const refinementCompletion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `
당신은 사용자의 질문을 검색에 적합한 형태인 "독립적인 질문"으로 재작성하는 AI입니다.
대화 맥락(이전 메시지들)을 고려하여, 사용자의 마지막 질문이 모호하거나 대명사(그것, 거기 등)를 포함하고 있다면 이를 구체적인 명사로 바꾸어 재작성하세요.
단, 사용자의 질문이 이미 명확하다면 그대로 두세요.
답변은 재작성된 질문만 출력하세요.

예시 1:
이전 대화:
Q: 서울대 기부 프로그램은?
A: 아너 클럽 등이 있습니다.
현재 질문: 1억 이상 기부하면 혜택은?
재작성: 서울대 발전재단에 1억 이상 기부 시 아너 클럽 혜택은 무엇인가요?

예시 2:
현재 질문: 미주재단 연락처 알려줘
재작성: 미주재단 연락처 알려줘
`
                    },
                    ...messages.slice(0, -1), // History
                    { role: "user", content: userQuery } // Current query
                ],
            });
            refinedQuery = refinementCompletion.choices[0].message.content;
            console.log(`Refined Query: "${userQuery}" -> "${refinedQuery}"`);
        }

        // 1. Generate embedding for refined query
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: refinedQuery,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 2. Retrieve relevant context
        const relevantDocs = await findRelevantContext(queryEmbedding);

        // Format context
        const contextText = relevantDocs.map(doc =>
            `Title: ${doc.title}\nURL: ${doc.url}\nContent: ${doc.text}`
        ).join('\n\n---\n\n');

        console.log('Relevant Context:', contextText);

        // 3. Call OpenAI with context
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "system", content: `[Context]\n${contextText}` },
                ...messages
            ],
        });

        const reply = completion.choices[0].message.content;

        return NextResponse.json({ role: 'assistant', content: reply });

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
