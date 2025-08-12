const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors());


async function scrapeCPLStandings() {
  const url = 'https://canpl.ca/standings';
  const leagueName = 'Canadian Premier League';

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    // Wait for a team name to load
    await page.waitForFunction(
      () => [...document.querySelectorAll('td')].some(el => el.textContent.includes('Atlético Ottawa')),
      { timeout: 120000 }
    );

    const teams = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));

      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        const name = row.querySelector('td:nth-child(2)')?.innerText?.trim() || 'Unknown';

        const getNumber = (i) => parseInt(cells[i]?.innerText?.trim() || '0', 10);

        return {
          name,
          PTS: getNumber(2),
          GP: getNumber(3),
          W: getNumber(4),
          L: getNumber(5),
          T: getNumber(6),
          GF: getNumber(7),
          GA: getNumber(8),
        };
      }).filter(team => team.name !== 'Unknown');
    });

    await browser.close();

    return {
      league: leagueName,
      divisions: [{ name: '2025 Overall', teams }],
    };
  } catch (err) {
    console.error(`❌ Failed to scrape CPL: ${err.message}`);
    return {
      league: leagueName,
      error: 'Failed to load CPL standings.',
      divisions: [{ name: 'CPL 2025 Overall', teams: [] }],
    };
  }
}

module.exports = scrapeCPLStandings;
