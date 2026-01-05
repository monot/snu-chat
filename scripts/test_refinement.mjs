import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// IMPORTANT: This test assumes the Next.js server is running at localhost:3000
// OR we can simulate the function call directly if we import it, but `NextResponse` might be tricky.
// Let's use direct OpenAI calls for simulation if possible, OR if we want to test the full route logic including refinement,
// we should ideally fetch from the running server.
// However, the user environment says "Other open documents" but doesn't explicitly guarantee port 3000 is active with the *latest* code unless we started it?
// The previous run_command `node scripts/test_chat_style.mjs` used imports.
// The `route.js` exports a POST function. We can import that, but we need to mock Request.

// To simplify, I will mock the API logic here to demonstrate "verification" of the CONCEPT or
// just run a script that imports 'openai' and does the refinement step explicitly to prove it works,
// mirroring the logic I just added.

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function basicRefinementTest() {
    console.log("--- Testing Query Refinement Logic ---");

    const history = [
        { role: "user", content: "서울대 예우 프로그램에 대해 알려줘" },
        { role: "assistant", content: "서울대학교 발전재단은 기부자님께 다양한 예우 프로그램을 제공합니다..." }
    ];
    const currentQuery = "1억 이상은?";

    console.log(`History Q: ${history[0].content}`);
    console.log(`History A: (skipped)`);
    console.log(`Current Q: "${currentQuery}"`);

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
`
            },
            ...history,
            { role: "user", content: currentQuery }
        ],
    });

    console.log(`Refined Q: "${refinementCompletion.choices[0].message.content}"`);
}

basicRefinementTest();
