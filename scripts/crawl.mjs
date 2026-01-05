import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.snu.or.kr/new';
const DOMAIN = 'https://www.snu.or.kr';
const MAX_PAGES = 60;

const visited = new Set();
const knowledgeData = [];

async function fetchPage(url) {
    try {
        await new Promise(resolve => setTimeout(resolve, 50)); // Faster 50ms delay
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        return await response.text();
    } catch (error) {
        return null;
    }
}

async function crawl(rootUrl) {
    const queue = [rootUrl];

    while (queue.length > 0 && visited.size < MAX_PAGES) {
        const url = queue.shift();

        if (visited.has(url)) continue;
        visited.add(url);

        console.log(`[${visited.size}/${MAX_PAGES}] Crawling: ${url}`);

        const html = await fetchPage(url);
        if (!html) continue;

        const $ = cheerio.load(html);
        let title = $('title').text().trim();

        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('header').remove();
        $('footer').remove();
        $('.gnb').remove();
        $('.lnb').remove();
        $('.footer').remove();

        let $content = $('main');
        if ($content.length === 0) $content = $('#content');
        if ($content.length === 0) $content = $('body');

        // Preserve structure
        $content.find('br').replaceWith('\n');
        $content.find('p').after('\n\n');
        $content.find('div').after('\n');
        $content.find('h1, h2, h3, h4, h5, h6').before('\n\n').after('\n');
        $content.find('li').before('\n- ');

        const content = $content.text()
            .replace(/[ \t]+/g, ' ') // Collapse spaces/tabs but keep newlines
            .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines to double newline
            .trim();

        if (content.length > 50) {
            knowledgeData.push({
                url: url,
                title: title || url,
                category: 'General',
                content: content
            });
        }

        const links = $('a');
        links.each((i, el) => {
            let href = $(el).attr('href');
            if (!href) return;

            if (href.startsWith('/')) href = DOMAIN + href;
            else if (!href.startsWith('http')) return;

            href = href.split('#')[0];

            if (href.startsWith(BASE_URL) && !visited.has(href)) {
                const urlObj = new URL(href);
                const pageParam = urlObj.searchParams.get('page');
                if (pageParam && parseInt(pageParam) > 3) return;

                // Skip news archives deeper pagination or specific file types if needed
                if (href.match(/\.(pdf|jpg|png|zip)$/i)) return;

                if (!queue.includes(href)) queue.push(href);
            }
        });
    }
}

async function main() {
    console.log('Starting crawler...');
    await crawl(BASE_URL);

    const outputPath = path.join(process.cwd(), 'data', 'knowledge.json');
    await fs.writeFile(outputPath, JSON.stringify(knowledgeData, null, 2));

    console.log(`Crawling complete. Saved ${knowledgeData.length} pages to ${outputPath}`);
}

main();
