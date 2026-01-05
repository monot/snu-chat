import * as cheerio from 'cheerio';

async function inspect() {
    const url = 'https://www.snu.or.kr/new/?page_id=2736'; // Tax benefits page
    console.log(`Fetching ${url}...`);

    try {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html);

        // Try to find potential content containers
        const candidates = ['#content', '.content', 'main', '#main', '.entry-content', 'article', '.container'];

        for (const selector of candidates) {
            if ($(selector).length > 0) {
                console.log(`Found selector: ${selector}, length: ${$(selector).length}`);
                console.log(`Text preview: ${$(selector).text().trim().substring(0, 200)}...`);
            }
        }

        // Also print body direct children classes/ids
        console.log('Body children:');
        $('body').children().each((i, el) => {
            const tag = el.tagName;
            const id = $(el).attr('id');
            const cls = $(el).attr('class');
            console.log(`- ${tag} id=${id} class=${cls}`);
        });

    } catch (error) {
        console.error('Error fetching page:', error);
    }
}

inspect();
