import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const PAGES = [
    { url: 'https://www.snu.or.kr/new/?page_id=1692', category: 'How to Give' },
    { url: 'https://www.snu.or.kr/new/?page_id=2736', category: 'Tax Benefits' },
    { url: 'https://www.snu.or.kr/new/?page_id=1690', category: 'Donor Recognition' },
    { url: 'https://www.snu.or.kr/new/usa/', category: 'USA Foundation' },
    { url: 'https://www.snu.or.kr/new/?page_id=3113', category: 'FAQ' },
    { url: 'https://www.snu.or.kr/new/?page_id=1686', category: 'Campaigns' },
];

async function scrape() {
    const knowledge = [];

    for (const page of PAGES) {
        console.log(`Scraping ${page.url}...`);
        try {
            const res = await fetch(page.url);
            const html = await res.text();
            const $ = cheerio.load(html);

            // Remove scripts, styles, and nav/footer if inside #main
            $('script').remove();
            $('style').remove();
            $('nav').remove();
            $('footer').remove();

            let content = $('#main').text().trim();

            // If #main is empty or not found, try body but cleaner
            if (!content) {
                content = $('body').text().trim();
            }

            // Clean up whitespace
            content = content.replace(/\s+/g, ' ').trim();

            knowledge.push({
                url: page.url,
                category: page.category,
                content: content,
                title: $('title').text().trim() || page.category
            });

        } catch (error) {
            console.error(`Error scraping ${page.url}:`, error);
        }
    }

    const outputPath = path.join(process.cwd(), 'data', 'knowledge.json');
    await fs.writeFile(outputPath, JSON.stringify(knowledge, null, 2));
    console.log(`Saved ${knowledge.length} pages to ${outputPath}`);
}

scrape();
