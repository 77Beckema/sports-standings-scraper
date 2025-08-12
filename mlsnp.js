const puppeteer = require("puppeteer");

async function scrapeMLSNPstandings() {
  const leagueName = "Major League Soccer";

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://www.mlsnextpro.com/standings/2025/overall#season=MLS-SEA-0001K9&live=true", {
    waitUntil: "networkidle0",
    timeout: 0,
  });

  await page.waitForSelector("table.mls-o-table");

  const eastern = [];
  const western = [];

  const tables = await page.$$("table.mls-o-table");
  for (let i = 0; i < tables.length; i++) {
    const teams = await tables[i].$$eval("tbody tr", rows =>
      rows.map(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 11) return null;
        const [rank, team, PTS, GP, W, L, T] = Array.from(cells).map(cell => cell.innerText.trim());
        return {
          rank,
          name: team,
          W: parseInt(W),
          L: parseInt(L),
          T: parseInt(T),
          GP: parseInt(GP),
          PTS: parseInt(PTS)
        };
      }).filter(Boolean)
    );

    if (i === 0) eastern.push(...teams);
    else western.push(...teams);
  }

  await browser.close();

  const result = {
    league: leagueName,
    source: "mls.com",
    divisions: [
      { name: "Eastern Conference", teams: eastern },
      { name: "Western Conference", teams: western }
    ]
  };

  console.log("✅ MLS NP scrape returned", eastern.length + western.length, "teams");
  return result;
}

module.exports = scrapeMLSNPstandings;
