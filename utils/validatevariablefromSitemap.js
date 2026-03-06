const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const pLimit = require('p-limit');
const cheerio = require('cheerio');

const BASE_URL = process.env.BASE_URL || 'https://aem-dev.strattonfinance.com.au';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
const CONCURRENCY = 10; // Adjust if needed
const VARIABLE_PATTERNS = [
  '{caravan-loan}',
  '{{variable-name}}',
  '${variable-name}'
  
];
// const urls = [
//    '/franchise/stratton-finance-brisbane-central',
//    '/caravan-rv-finance',
//   '/car-finance?ds=d',
//   '/commercial-finance'
// ].map(path => `${BASE_URL}${path}`);


const variableRegex = /\$\{[\w-]+\}|\${\{[\w-]+\}\}|\$\{[\w-]+\}/;
  // /\{[\w-]+\}|\{[\w-]+\}|\{\{[\w-]+\}\}/;

async function fetchSitemapUrls() {
   console.log(`Fetching sitemap: ${SITEMAP_URL}`);
  const response = await axios.get(SITEMAP_URL);
  
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(response.data);

  const urls = result.urlset.url.map(u => u.loc[0]);
  return urls;
}


async function validateUrls(urls) {
  const failedPages = [];
  //const limit = pLimit(CONCURRENCY);

  console.log(`\nValidating ${urls.length} URLs...\n`);
  const startTime = Date.now();

  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await axios.get(url, { timeout: 30000 });
const IGNORE_LIST = [' {width}', '{height}'];
        const html = response.data;

        // load HTML into cheerio
        const $ = cheerio.load(html);

          // extract only visible text
          const bodyText = $('body').text();

        const foundIssue = html.match(variableRegex) 
        const unprocessedVariables = foundIssue ? foundIssue.filter(v => !IGNORE_LIST.includes(v)) : [];
   
  
        if (foundIssue ) {
          failedPages.push({
            url,
            issue: `Unprocessed variable found: ${foundIssue}; Unprocessed variables: ${unprocessedVariables.join(', ')}`
          });
          console.log(`❌ ${url}- Unprocessed variable found: ${foundIssue}`);
        } else {
          console.log(`✅ ${url}`);
        }
      } catch (error) {
        failedPages.push({
          url,
          issue: `Request failed: ${error.message}`
        });
        console.log(`❌ ${url} - Request failed: ${error.message}`);
      }
    })
  );
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  return { failedPages, duration };
}

  
  

function generateReports(failedPages) {
  // JSON
  fs.writeFileSync(
    'failed-pages.json',
    JSON.stringify(failedPages, null, 2)
  );

  // CSV
  const csvContent =
    'URL,Issue\n' +
    failedPages.map(f => `${f.url},"${f.issue}"`).join('\n');

  fs.writeFileSync('failed-pages.csv', csvContent);
}

async function run() {
  try {
    const urls = await fetchSitemapUrls();
    const { failedPages, duration } = await validateUrls(urls);

    generateReports(failedPages);

    console.log('\n-----------------------------------');
    console.log(`Total URLs checked: ${urls.length}`);
    console.log(`Failed pages: ${failedPages.length}`);
    console.log(`Execution time: ${duration} seconds`);
    console.log('-----------------------------------\n');

    if (failedPages.length > 0) {
      process.exit(1); // Fail CI
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

run();