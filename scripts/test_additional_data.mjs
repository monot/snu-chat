import { findRelevantContext } from '../src/lib/rag.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function testRetrieval(query, expectedUrlPart) {
    console.log(`\nQuery: "${query}"`);

    // 1. Generate embedding
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Retrieve context
    const relevantDocs = await findRelevantContext(queryEmbedding, 5);

    console.log('Top Contexts:');
    let found = false;
    relevantDocs.forEach((doc, i) => {
        console.log(`\n[${i + 1}] ${doc.title} (${doc.url})`);
        console.log(`Score: ${doc.score.toFixed(4)}`);
        if (doc.url.includes(expectedUrlPart)) {
            found = true;
            console.log("--> FOUND TARGET URL!");
        }
    });

    if (!found) {
        console.log(`--> WARNING: Target URL containing "${expectedUrlPart}" not found in top results.`);
    }
}

async function main() {
    await testRetrieval("단과대학 기부하고 싶어", "9897");
    await testRetrieval("기부 3관왕이 뭐야?", "shineclub");
    await testRetrieval("핵심 모금 캠페인 알려줘", "1686");
}

main();
