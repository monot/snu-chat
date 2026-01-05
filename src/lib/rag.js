import fs from 'fs/promises';
import path from 'path';

let embeddingsCache = null;

async function loadEmbeddings() {
    if (embeddingsCache) return embeddingsCache;

    const filePath = path.join(process.cwd(), 'data', 'embeddings.json');
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        embeddingsCache = JSON.parse(data);
        return embeddingsCache;
    } catch (error) {
        console.error('Error loading embeddings:', error);
        return [];
    }
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findRelevantContext(queryEmbedding, limit = 3) {
    const embeddings = await loadEmbeddings();

    const scored = embeddings.map(item => ({
        ...item,
        score: cosineSimilarity(queryEmbedding, item.embedding)
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
}
