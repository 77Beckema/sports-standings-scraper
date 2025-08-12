const puppeteer = require("puppeteer");

async function scrapeNSLStandings() {
  const leagueName = "Northern Super League (W)";
  const url = "https://nsl.ca/standings";

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  // ✅ Handle cookie popup
  try {
    await page.waitForSelector('button:has-text("Accept all")', { timeout: 5000 });
    await page.click('button:has-text("Accept all")');
    console.log("✅ Cookie popup accepted");
  } catch {
    console.log("❗ Cookie popup not found or already handled");
  }

  // ✅ Handle newsletter popup
  try {
    await page.waitForSelector('button[aria-label="Close"]', { timeout: 8000 });
    await page.click('button[aria-label="Close"]');
    console.log("✅ Newsletter popup closed");
  } catch {
    console.log("❗ Newsletter popup not found or already closed");
  }

  // ✅ Scroll to standings
  await page.evaluate(() => {
    window.scrollBy(0, 600);
  });
  await new Promise(res => setTimeout(res, 3000));

  // ✅ Scrape standings
 const teams = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll("table tr"));
  const results = [];

  rows.forEach((row) => {
    const cols = row.querySelectorAll("td");
    if (cols.length >= 7) {
      const rawTeamCell = cols[1].textContent.trim();
      const lines = rawTeamCell.split('\n').map(l => l.trim()).filter(Boolean);
      const teamName = lines[lines.length - 1];  // grabs "AFC Toronto", "Montreal Roses FC", etc.

      results.push({
        rank: cols[0].innerText.trim(),
        name: teamName,
        PTS: parseInt(cols[2].innerText.trim()),
        GP: parseInt(cols[3].innerText.trim()),
        W: parseInt(cols[4].innerText.trim()),
        L: parseInt(cols[5].innerText.trim()),
        T: parseInt(cols[6].innerText.trim()),
      });
    }
  });

  return results;
});


  await browser.close();

  if (teams.length === 0) {
    throw new Error("❌ No standings data found");
  }

  console.log("✅ NSL standings scrape complete:", teams.length, "teams");
  return {
  league: leagueName,
  season: "2025",
  divisions: [
    {
      name: "Standings",
      teams,
    },
  ],
};

}

module.exports = scrapeNSLStandings;
