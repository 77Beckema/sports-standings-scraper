const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors());



async function scrapeL1BCWStandings() {
  const leagueName = 'League1 British Columbia';
  const url = 'https://league1bc.ca/competition/league1-womens/';

  try {
    console.log("Navigating to League1 BC standings page...");

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

    // Accept cookies if shown
    try {
      await page.waitForSelector('button.css-47sehv', { timeout: 120000 });
      await page.click('button.css-47sehv');
      console.log("✅ Accepted cookies.");
    } catch {
      console.log("No cookie popup shown.");
    }

    // Click the STANDINGS tab
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const standingsBtn = buttons.find(btn => btn.textContent.trim().toUpperCase() === 'STANDINGS');
      if (standingsBtn) {
        standingsBtn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log("✅ Clicked STANDINGS tab.");
    } else {
      throw new Error("STANDINGS tab not found.");
    }

    // Wait for the table to load after tab click
    await page.waitForSelector('table tbody tr', { timeout: 150000 });

    // Extract the team rows
    const teams = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const data = [];

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) return;

        data.push({
          name: cells[1].innerText.trim(),
          GP: parseInt(cells[2].innerText.trim(), 10),
          W: parseInt(cells[3].innerText.trim(), 10),
          L: parseInt(cells[4].innerText.trim(), 10),
          T: parseInt(cells[5].innerText.trim(), 10),
          PTS: parseInt(cells[6].innerText.trim(), 10),
          GF: parseInt(cells[7].innerText.trim(), 10),
          GA: parseInt(cells[8].innerText.trim(), 10),
          GD: parseInt(cells[9].innerText.trim(), 10),
        });
      });

      return data;
    });

    await browser.close();

    return {
      league: leagueName,
      source: "live_scrape",
      divisions: [{
        name: "2025 Women BC Division",
        teams
      }]
    };
  } catch (err) {
    console.error('❌ League1 BC W scrape failed: ${err.message}');
    return { league: leagueName, error: err.message, divisions: [] };
  }
}

module.exports = scrapeL1BCWStandings;