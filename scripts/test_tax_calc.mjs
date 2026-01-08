import { findRelevantContext } from '../src/lib/rag.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function simulateTaxChat() {
    console.log("--- Tax Calculation Simulation ---");

    // 1. Initial Inquiry
    let messages = [{ role: "user", content: "2억 기부하면 세제혜택 얼마나 받아?" }];
    console.log(`\nUser: ${messages[0].content}`);

    // Mock Retrieval
    const embeddingResponse = await openai.embeddings.create({ model: "text-embedding-3-small", input: messages[0].content });
    const context = await findRelevantContext(embeddingResponse.data[0].embedding, 3);
    const contextText = context.map(d => d.text).join('\n\n');

    // System Prompt (Simplified for test script)
    const SYSTEM_PROMPT = `
[세제혜택 계산 가이드]
사용자가 세제혜택이나 기부금 공제 금액을 물어보면, 바로 답을 주는 대신 대화형으로 다음 정보를 먼저 확인하세요:
1. 기부자 유형 (개인 근로자, 개인 사업자, 법인 등)
2. 기부 예정 금액
3. (선택) 연간 소득 금액 (한도 확인용)

정보가 확보되면 다음 계산식을 적용하여 예상 공제액을 계산해 주세요 (Context에 있는 공식 우선):
- 개인 (법정기부금): 1천만원 이하 15%, 1천만원 초과분 30% 세액공제.
- 계산 과정을 명확하게 보여주세요.
`;

    // 2. Bot Response (Should ask for type/income)
    let completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "system", content: `[Context]\n${contextText}` },
            ...messages
        ]
    });
    let reply = completion.choices[0].message.content;
    console.log(`Bot: ${reply}`);
    messages.push({ role: "assistant", content: reply });

    // 3. User provides details
    const followUp = "개인 근로자이고 연봉은 3억이야.";
    console.log(`\nUser: ${followUp}`);
    messages.push({ role: "user", content: followUp });

    // 4. Bot Calculation (Should show 1.5m + 57m = 58.5m approx)
    // 200M total.
    // 10M * 15% = 1.5M
    // 190M * 30% = 57M
    // Total = 58.5M
    // Check limit: 100% of 300M > 200M. OK.
    completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "system", content: `[Context]\n${contextText}` },
            ...messages
        ]
    });
    reply = completion.choices[0].message.content;
    console.log(`Bot:\n${reply}`);
}

simulateTaxChat();
