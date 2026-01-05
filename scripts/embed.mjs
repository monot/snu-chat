import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbeddings() {
    const dataPath = path.join(process.cwd(), 'data', 'knowledge.json');
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const pages = JSON.parse(rawData);

    const chunks = [];

    for (const page of pages) {
        // Simple chunking by splitting by newlines or length
        // For now, let's just split by paragraphs (double newline) and then merge if too small
        const paragraphs = page.content.split(/\n\s*\n/);

        for (const para of paragraphs) {
            if (para.length < 50) continue; // Skip very short chunks

            // If paragraph is too long, split it (naive approach)
            const subChunks = para.match(/.{1,1000}/g) || [para];

            for (const chunkText of subChunks) {
                chunks.push({
                    url: page.url,
                    title: page.title,
                    text: chunkText,
                });
            }
        }
    }

    console.log(`Generated ${chunks.length} chunks. Creating embeddings...`);

    const embeddings = [];

    // Batch processing to avoid rate limits
    const BATCH_SIZE = 20;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);

        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: batch.map(c => c.text),
            });

            response.data.forEach((item, index) => {
                embeddings.push({
                    ...batch[index],
                    embedding: item.embedding
                });
            });
        } catch (error) {
            console.error('Error generating embeddings:', error);
        }
    }

    const outputPath = path.join(process.cwd(), 'data', 'embeddings.json');
    await fs.writeFile(outputPath, JSON.stringify(embeddings, null, 2));
    console.log(`Saved ${embeddings.length} embeddings to ${outputPath}`);
}

generateEmbeddings();
