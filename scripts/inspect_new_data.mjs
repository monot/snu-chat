import fs from 'fs/promises';
import path from 'path';

async function main() {
    const dataPath = path.join(process.cwd(), 'data', 'knowledge.json');
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const pages = JSON.parse(rawData);

    const checklist = ['9897', 'shineclub', '1686'];

    checklist.forEach(id => {
        const found = pages.find(p => p.url.includes(id));
        console.log(`\n--- Inspecting ${id} ---`);
        if (found) {
            console.log(`Title: ${found.title}`);
            console.log(`Length: ${found.content.length}`);
            console.log(`Preview: ${found.content.substring(0, 300)}...`);
        } else {
            console.log("Not found in knowledge.json");
        }
    });
}

main();
