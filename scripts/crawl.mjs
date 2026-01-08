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

async function crawl() {
    // Explicitly add start URLs
    const startUrls = [
        'https://www.snu.or.kr/new',
        'https://www.snu.or.kr/new/?page_id=7942', // Manmanhan
        'https://www.snu.or.kr/snushine', // Shine
        'https://www.snu.or.kr/shineclub', // Shine Club (Triple Crown)
        'https://www.snu.or.kr/new/?page_id=9897', // College/Institution
        'https://www.snu.or.kr/new/?page_id=1686' // Core Campaigns
    ];

    const queue = [...startUrls];

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

        // Specific overrides for known image-only pages or generic titles
        if (url.includes('page_id=7942')) {
            title = "만만한 기부 | 서울대학교발전재단";
            // More semantic description to boost RAG score
            $content.prepend(`
만만한 기부 (Manmanhan Donation) 캠페인 상세 안내입니다.
서울대학교 만만한 기부는 누구나 부담 없이 참여할 수 있는 소액 정기 기부 캠페인입니다.
1인 1계좌 월 1만원의 기부로 서울대학교의 큰 변화를 만듭니다.
아래에서 참여 신청서 작성 및 온라인 참여 방법을 확인하실 수 있습니다.
`);
        } else if (url.includes('page_id=1686')) {
            title = "모금캠페인 소개 | 서울대학교발전재단";
            $content.prepend(`
서울대학교 발전재단의 주요 모금 캠페인을 소개하는 페이지입니다.
만만한 기부, 샤인 기부, 천원의 식샤, 단과대학 및 기관 모금사업 등 다양한 기부 캠페인 정보를 확인하실 수 있습니다.
`);
        } else if (url.includes('page_id=9897')) {
            title = "단과대학 및 기관 모금사업 | 서울대학교발전재단";
            $content.prepend(`
서울대학교 각 단과대학, 대학원 및 주요 기관별 모금 사업을 안내하는 페이지입니다.
원하는 단과대학이나 기관을 선택하여 해당 조직의 발전기금으로 직접 기부하실 수 있습니다.
`);
        } else if (url.includes('shineclub')) {
            title = "기부 3관왕 SHINE CLUB | 서울대학교발전재단";
            $content.prepend(`
기부 3관왕 SHINE CLUB (샤인클럽) 안내 페이지입니다.
만만한 기부, 샤인 기부, 천원의 식샤 3가지 캠페인에 모두 참여하신 기부자님을 위한 클럽입니다.
기부 3관왕에게는 감사의 의미로 특별한 예우를 제공합니다.
`);
        }

        // Preserve structure
        $content.find('br').replaceWith('\n');
        $content.find('p').after('\n\n');
        $content.find('div').after('\n');
        $content.find('h1, h2, h3, h4, h5, h6').before('\n\n').after('\n');
        $content.find('li').before('\n- ');

        // Extract text from images and area map for image-heavy pages
        $content.find('img').each((i, el) => {
            const alt = $(el).attr('alt');
            if (alt) $(el).after(`\n[이미지: ${alt}]\n`);
        });
        $content.find('area').each((i, el) => {
            const alt = $(el).attr('alt');
            if (alt) $(el).after(`\n[링크: ${alt}]\n`);
        });

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

            // Allow BASE_URL (/new), /snushine, or /shineclub
            const isTargetScope = href.startsWith(BASE_URL) ||
                href.startsWith('https://www.snu.or.kr/snushine') ||
                href.startsWith('https://www.snu.or.kr/shineclub');

            if (isTargetScope && !visited.has(href)) {
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
    await crawl();

    const outputPath = path.join(process.cwd(), 'data', 'knowledge.json');
    await fs.writeFile(outputPath, JSON.stringify(knowledgeData, null, 2));

    console.log(`Crawling complete. Saved ${knowledgeData.length} pages to ${outputPath}`);
}

main();
