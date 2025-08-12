const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors());

async function scrapeUSportsWStandings() {
  const url = 'https://en.usports.ca/sports/wsoc/2024-25/standings';
  const leagueName = 'U SPORTS (W)';
  const rowSelector = 'table tbody tr';

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
    await page.waitForSelector(rowSelector);

    const teams = await page.evaluate((rowSel) => {
      const rows = Array.from(document.querySelectorAll(rowSel));
      return rows.map((row) => {
        const name =
          row.querySelector('th[scope="row"] .team-name')?.innerText.trim() ||
          row.querySelector('th[scope="row"]')?.innerText.trim() || '-';

        const cells = Array.from(row.querySelectorAll('td'));

        return {
          name,
          GP: parseInt(cells[0]?.innerText.trim() || '0', 10),
          W: parseInt(cells[1]?.innerText.trim() || '0', 10),
          L: parseInt(cells[2]?.innerText.trim() || '0', 10),
          T: parseInt(cells[3]?.innerText.trim() || '0', 10),
          GD: parseInt(cells[5]?.innerText.trim() || '0', 10),
          PTS: parseInt(cells[6]?.innerText.trim() || '0', 10),
        };
      }).filter(team => team.name && team.name !== '-');
    }, rowSelector);

    await browser.close();

    return {
      league: leagueName,
      divisions: [{ name: '2024–25 Overall', teams }],
    };
  } catch (err) {
    console.error(`❌ Failed to scrape U SPORTS: ${err.message}`);
    return { league: leagueName, error: 'Failed to load U SPORTS standings.' };
  }
}


module.exports = scrapeUSportsWStandings;