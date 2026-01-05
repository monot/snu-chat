import { findRelevantContext } from '../src/lib/rag.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function test(query) {
    console.log(`\nQuery: "${query}"`);

    // 1. Generate embedding
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Retrieve context
    const relevantDocs = await findRelevantContext(queryEmbedding);

    console.log('Top Contexts:');
    relevantDocs.forEach((doc, i) => {
        console.log(`\n[${i + 1}] ${doc.title} (${doc.url})`);
        console.log(`Score: ${doc.score.toFixed(4)}`);
        console.log(`snippet: ${doc.text.substring(0, 100)}...`);
    });
}

async function main() {
    await test("예우 프로그램에는 어떤 것이 있나요?");
    await test("기부금 세제 혜택은?");
    await test("미주재단 연락처는?");
}

main();
