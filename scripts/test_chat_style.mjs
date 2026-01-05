import { findRelevantContext } from '../src/lib/rag.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

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
`;

async function testChat(query) {
    console.log(`\n\nQuery: "${query}"`);
    console.log('--- Generating Response ---');

    // 1. Generate embedding
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Retrieve context
    const relevantDocs = await findRelevantContext(queryEmbedding);
    const contextText = relevantDocs.map(doc =>
        `Title: ${doc.title}\nURL: ${doc.url}\nContent: ${doc.text}`
    ).join('\n\n---\n\n');

    // 3. Call OpenAI
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "system", content: `[Context]\n${contextText}` },
            { role: "user", content: query }
        ],
    });

    console.log(completion.choices[0].message.content);
}

async function main() {
    await testChat("기부자 예우 프로그램에 대해 자세히 알려줘.");
}

main();
