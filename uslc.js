const puppeteer = require("puppeteer");

async function scrapeUSLChampionshipStandings() {
  const leagueName = "USL Championship";
  const url = "https://www.uslchampionship.com/league-standings";
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 1024 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("table")).some((t) =>
          /Pos\./i.test(t.innerText)
        ),
      { timeout: 60000 }
    );

    const { eastern, western } = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll("table")).filter((t) =>
        /Pos\./i.test(t.innerText)
      );

      const parseTable = (tbl) => {
        const rows = Array.from(tbl.querySelectorAll("tbody tr"));
        const teams = [];

        rows.forEach((row) => {
          const cols = row.querySelectorAll("td");
          if (cols.length < 8) return;

          const rawName = cols[1]?.innerText?.trim() || "";
          if (!rawName) return;

          const name = rawName.replace(/\s+/g, " ").trim();
          const rank = cols[0]?.innerText?.trim() || "";
          const GP = parseInt(cols[2]?.innerText?.trim(), 10) || 0;
          const W = parseInt(cols[3]?.innerText?.trim(), 10) || 0;
          const L = parseInt(cols[4]?.innerText?.trim(), 10) || 0;
          const T = parseInt(cols[5]?.innerText?.trim(), 10) || 0;
          const PTS = parseInt(cols[7]?.innerText?.trim(), 10) || 0;

          teams.push({ rank, name, GP, W, L, T, PTS });
        });

        return teams;
      };

      const eastern = tables[0] ? parseTable(tables[0]) : [];
      const western = tables[1] ? parseTable(tables[1]) : [];

      return { eastern, western };
    });

    console.log(`✅ Eastern scraped: ${eastern.length} teams`);
    console.log(`✅ Western scraped: ${western.length} teams`);

    const allTeams = [...eastern, ...western];
    allTeams.sort((a, b) => b.PTS - a.PTS);

    const result = {
      league: leagueName,
      source: "uslchampionship.com",
      divisions: [
        {
          name: "All",
          teams: allTeams,
        },
      ],
    };

    console.log(`✅ USL Championship scrape returned ${allTeams.length} teams total`);
    await browser.close();
    return result;

  } catch (err) {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }

    console.error("❌ USL Championship standings scrape failed:", err.message);

    return {
      league: leagueName,
      error: err.message,
      divisions: [
        {
          name: "All",
          teams: [],
        },
      ],
    };
  }
}

module.exports = scrapeUSLChampionshipStandings;
