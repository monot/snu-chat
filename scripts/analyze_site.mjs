import * as cheerio from 'cheerio';

async function analyze() {
  const baseUrl = 'https://www.snu.or.kr/new/';
  console.log(`Fetching ${baseUrl}...`);
  
  try {
    const res = await fetch(baseUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text) {
        links.push({ text, href });
      }
    });

    console.log('Found links:', links);
  } catch (error) {
    console.error('Error fetching page:', error);
  }
}

analyze();
