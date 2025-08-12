const puppeteer = require("puppeteer");

async function scrapeOPDLU17() {
  const leagueName = "OPDL U17 Boys";
  const url = "https://www.theopdl.com/Games.aspx";

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  // ✅ Scroll to checkboxes and click them
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForSelector("input[type='checkbox']", { timeout: 10000 });

  await page.evaluate(() => {
    const checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
    for (const box of checkboxes) {
      const label = box.nextSibling?.textContent || "";
      if (label.includes("Boys U17 Premier") || label.includes("Boys U17 Trillium")) {
        box.checked = true;
      }
    }
  });

  // ✅ Click submit button
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("input[type='submit']"))
      .find(el => el.value === "Submit");
    if (btn) btn.click();
  });

  // ✅ Wait for standings table to load
  await page.waitForSelector("#pnlStandings table.listtable", { timeout: 10000 });

  // ✅ Scrape all teams into a single array
  const teams = await page.evaluate(() => {
    const panel = document.querySelector("#pnlStandings");
    const tables = panel.querySelectorAll("table.listtable");
    const results = [];

    tables.forEach(table => {
      const rows = table.querySelectorAll("tbody tr");

      rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 9) return;

        const name = cells[1].textContent.trim();
        if (name === "Team") return; // skip placeholder

        results.push({
          name,
          GP: parseInt(cells[2].textContent.trim()) || 0,
          W: parseInt(cells[3].textContent.trim()) || 0,
          T: parseInt(cells[4].textContent.trim()) || 0,
          L: parseInt(cells[5].textContent.trim()) || 0,
          GF: parseInt(cells[6].textContent.trim()) || 0,
          GA: parseInt(cells[7].textContent.trim()) || 0,
          PTS: parseInt(cells[9].textContent.trim()) || 0,
        });
      });
    });

    return results;
  });

  await browser.close();

  if (teams.length === 0) {
    throw new Error("❌ No standings data found");
  }

  console.log("✅ OPDL U17 standings scrape complete:", teams.length, "teams");

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

scrapeOPDLU17();

module.exports = scrapeOPDLU17;
