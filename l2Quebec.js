const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors());


async function scrapeL2QuebecStandings() {
  const url = 'https://page.spordle.com/fr/ligue2-quebec/schedule-stats-standings/dde108d6-7545-4e87-9e6f-f7a9b64028e7?tab=standings&scheduleId=176516';
  const leagueName = 'Ligue2 Québec';

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

    // Wait for the standings table rows to appear
    await page.waitForSelector('table tbody tr', { timeout: 120000 });

    const teams = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));

      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[1]?.innerText?.trim() || 'Unknown';

        const parse = (index) => parseInt(cells[index]?.innerText.trim() || '0', 10);

        return {
          name,
          GP: parse(2),   // MJ
          W: parse(3),    // V
          L: parse(4),    // D
          T: parse(5),    // N
          PTS: parse(6),  // PTS
        };
      }).filter(team => team.name !== 'Unknown');
    });

    await browser.close();

    return {
      league: leagueName,
      source: 'live_scrape',
      divisions: [
        {
          name: '2025 Men Québec L2 Division',
          teams
        }
      ]
    };
  } catch (err) {
    console.error(`❌ Failed to scrape Ligue2 Québec: ${err.message}`);
    return {
      league: leagueName,
      error: err.message,
      divisions: []
    };
  }
}

module.exports = scrapeL2QuebecStandings;