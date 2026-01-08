import fs from 'fs/promises';
import path from 'path';

async function main() {
    const dataPath = path.join(process.cwd(), 'data', 'knowledge.json');
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const pages = JSON.parse(rawData);

    const target = pages.find(p => p.url.includes('7942'));
    if (target) {
        console.log('--- Content for 7942 ---');
        console.log(`Title: ${target.title}`);
        console.log(`Content Preview: ${target.content.substring(0, 500)}`);
    } else {
        console.log('Page 7942 not found.');
    }

    const shine = pages.find(p => p.url.includes('snushine'));
    if (shine) {
        console.log('\n--- Content for Shine ---');
        console.log(`Title: ${shine.title}`);
        console.log(`Content Preview: ${shine.content.substring(0, 200)}`);
    }
}

main();
