const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeOCAAWStandings() {
  const leagueName = "OCAA Women's Soccer";
  const url = 'https://ocaa.com/sports/msoc/2025-26/standings';

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    console.log('Navigating to OCAA W standings page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

    // Scroll to trigger hydration
    await autoScroll(page);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Wait for any table rows to load
    await page.waitForSelector('table tbody tr', { timeout: 20000 });

    const teams = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        const name = row.querySelector('th')?.innerText.trim();
        const GP = cells[0]?.innerText.trim();
        const record = cells[1]?.innerText.trim();
        const winPct = cells[2]?.innerText.trim();
        const GF = cells[3]?.innerText.trim();
        const GA = cells[4]?.innerText.trim();
        const last10 = cells[5]?.innerText.trim();
        const streak = cells[6]?.innerText.trim();
        const pts = cells[7]?.innerText.trim();

        return {
          name,
          GP,
          record,
          winPct,
          GF,
          GA,
          last10,
          streak,
          pts
        };
      });
    });

    await browser.close();

    if (!teams.length) throw new Error("❌ No rows extracted from standings table.");

    // Save to file
    const output = {
      league: leagueName,
      divisions: [{
        name: "2025–26 Regular Season",
        teams
      }]
    };
    fs.writeFileSync('standings_data/standings_ocaaw.json', JSON.stringify(output, null, 2));
    console.log(`✅ OCAA w standings scraped: ${teams.length} teams saved.`);
    return output; // This prevents undefined in the updater

  } catch (err) {
    console.error(`❌ OCAA w standings scrape failed: ${err.message}`);
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 200;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 250);
    });
  });
}

scrapeOCAAWStandings();

module.exports = scrapeOCAAWStandings;
