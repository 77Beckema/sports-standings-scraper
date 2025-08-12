const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeNCAAMensStandings() {
  const leagueName = 'NCAA Division I Men';
  const url = 'https://www.ncaa.com/rankings/soccer-men/d1/ncaa-mens-soccer-rpi';

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Scroll to bottom to trigger hydration
    await autoScroll(page);
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Get full page text
    const rawText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('ncaa_text.txt', rawText); // for debug

    // Parse lines
    const lines = rawText.split('\n');
    const teams = [];

lines.forEach(line => {
  const parts = line.trim().split('\t');
  console.log("DEBUG line:", parts); // 👈 add this
  if (parts.length === 8 && /^\d{1,3}$/.test(parts[0])) {
    const [W, L, T] = parts[3].split('-').map(Number);
    const GP = W + L + T;
    const PTS = W * 3 + T;

    teams.push({
      rank: parts[0],
      name: parts[1],
      conference: parts[2],
      record: parts[3],
      road: parts[4],
      neutral: parts[5],
      home: parts[6],
      nonDiv1: parts[7],
      W,
      L,
      T,
      GP,
      PTS
    });
  }
});


    await page.screenshot({ path: 'ncaa_debug.png', fullPage: true });
    await browser.close();

    if (teams.length === 0) {
      throw new Error('❌ Could not extract any standings rows.');
    }

    console.log("✅ NCAA scrape returned", teams.length, "teams");
    return {
      league: leagueName,
      source: 'text_parse',
      divisions: [{
        name: '2024 RPI Rankings',
        teams
      }]
    };

  } catch (err) {
    console.error(`❌ NCAA standings scrape failed: ${err.message}`);
    return { league: leagueName, error: err.message, divisions: [] };
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

module.exports = scrapeNCAAMensStandings;
