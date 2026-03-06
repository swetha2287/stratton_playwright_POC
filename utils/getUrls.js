const axios = require('axios');
const xml2js = require('xml2js');

async function getUrlsFromSitemap(baseURL) {
  const sitemapUrl = `${baseURL}/sitemap.xml`;
  const response = await axios.get(sitemapUrl);

  const parser = new xml2js.Parser();
  try {
    const result = await parser.parseStringPromise(response.data);
    return result.urlset.url.map(u => u.loc[0]);
  } catch (error) {
    console.error(`Failed to parse sitemap XML from ${sitemapUrl}`);
    console.error(`Error: ${error.message}`);
    console.error(`Raw sitemap preview: ${response.data.substring(0, 500)}`);
    throw error;
  }
}

module.exports = { getUrlsFromSitemap };