import { findRelevantContext } from '../src/lib/rag.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function testRetrieval(query) {
    console.log(`\nQuery: "${query}"`);

    // 1. Generate embedding
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Retrieve context
    const relevantDocs = await findRelevantContext(queryEmbedding, 3);

    console.log('Top Contexts:');
    let found = false;
    relevantDocs.forEach((doc, i) => {
        console.log(`\n[${i + 1}] ${doc.title} (${doc.url})`);
        console.log(`Score: ${doc.score.toFixed(4)}`);
        if (doc.url.includes('7942') || doc.url.includes('snushine')) {
            found = true;
            console.log("--> FOUND TARGET URL!");
        }
    });

    if (!found) {
        console.log("--> WARNING: Target URL not found in top 3 results.");
    }
}

async function main() {
    await testRetrieval("샤인 기부가 뭐야?");
    await testRetrieval("만만한 기부에 대해 알려줘");
}

main();
