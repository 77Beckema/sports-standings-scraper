const fs = require('fs');
const path = require('path');

// Import all scraper functions
const {
  scrapeUSportsStandings,
  scrapeUSportsWStandings,
  scrapeCPLStandings,
  scrapeL1OPremierStandings,
  scrapeL1OChampionshipStandings,
  scrapeL2OSouthwestStandings,
  scrapeL2ONortheastStandings,
  scrapeL2OCentralStandings,
  scrapeL1AlbertaStandings,
  scrapeL1BCStandings,
  scrapeL1QuebecStandings,
  scrapeL2QuebecStandings,
  scrapeL3QuebecStandings,
  scrapeL1AlbertaWStandings,
  scrapeL1BCWStandings,
  scrapeL1OChampionshipWStandings,
  scrapeL1OPremierWStandings,
  scrapeL2OSouthwestWStandings,
  scrapeL2ONortheastWStandings,
  scrapeL1QuebecWStandings,
  scrapeL2QuebecWStandings,
  scrapeNCAAMensStandings,
  scrapeNCAAWomensStandings,
  scrapeMLSstandings,
  scrapeMLSNPstandings,
  scrapeNSLStandings,
  scrapeUSLChampionshipStandings,
  scrapeUSL1Standings,
  scrapeOPDLU17Boys,
  scrapeOPDLU17Girls,
  scrapeOCAAMensStandings,
  scrapeOCAAWStandings
} = require('./allScrapers'); // <- adjust path if needed

const STANDINGS_DIR = path.join(__dirname, 'standings_data');

const SCRAPE_FUNCTIONS = {
  'usports': scrapeUSportsStandings,
  'uswports': scrapeUSportsWStandings,
  'cpl': scrapeCPLStandings,
  'l1o-premier': scrapeL1OPremierStandings,
  'l1o-championship': scrapeL1OChampionshipStandings,
  'l2o-southwest': scrapeL2OSouthwestStandings,
  'l2o-northeast': scrapeL2ONortheastStandings,
  'l2o-central': scrapeL2OCentralStandings,
  'l1ab': scrapeL1AlbertaStandings,
  'l1bc': scrapeL1BCStandings,
  'l1q': scrapeL1QuebecStandings,
  'l2q': scrapeL2QuebecStandings,
  'l3q': scrapeL3QuebecStandings,
  'l1abw': scrapeL1AlbertaWStandings,
  'l1bcw': scrapeL1BCWStandings,
  'l1o-championshipw': scrapeL1OChampionshipWStandings,
  'l1o-premierw': scrapeL1OPremierWStandings,
  'l2o-southwestw': scrapeL2OSouthwestWStandings,
  'l2o-northeastw': scrapeL2ONortheastWStandings,
  'l1qw': scrapeL1QuebecWStandings,
  'l2qw': scrapeL2QuebecWStandings,
  'ncaaw': scrapeNCAAWomensStandings,
  'ncaa': scrapeNCAAMensStandings,
  'mls': scrapeMLSstandings,
  'mlsnp': scrapeMLSNPstandings,
  'nsl': scrapeNSLStandings,
  'uslc': scrapeUSLChampionshipStandings,
  'usl1': scrapeUSL1Standings,
  'opdlb': scrapeOPDLU17Boys,
  'opdlw': scrapeOPDLU17Girls,
  'ocaa': scrapeOCAAMensStandings,
  'ocaaw': scrapeOCAAWStandings,
};

async function updateAll() {
  for (const [slug, scrapeFn] of Object.entries(SCRAPE_FUNCTIONS)) {
    try {
      console.log(`⏳ Scraping ${slug}...`);
      const data = await scrapeFn();
      const outPath = path.join(STANDINGS_DIR, `standings_${slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
      console.log(`✅ Saved standings_${slug}.json`);
    } catch (err) {
      console.error(`❌ Failed ${slug}:`, err.message);
    }
  }

  console.log('✅ All standings updated');
}

updateAll();
