const { test, expect } = require('@playwright/test');
const { getUrlsFromSitemap } = require('../utils/getUrls');
const nodemailer = require('nodemailer');
require('dotenv').config();
const fs = require('fs');

import { sendEmail } from '../utils/sendemail';
test.describe('Validate variables in URLs', () => {
    let urls = [];
    const baseURL = 'https://aem-dev.strattonfinance.com.au';

    test.beforeAll(async () => {
       // urls = await getUrlsFromSitemap(baseURL);
         urls = [ 'https://aem-dev.strattonfinance.com.au/stratton/au/en/personal/home-loans/variable-rate-home-loan.html',
        'https://aem-dev.strattonfinance.com.au/get-a-quote',
        'https://aem-dev.strattonfinance.com.au/boat-finance/used-boat-finance',
        'https://aem-dev.strattonfinance.com.au/car-finance/car-loan-refinance',
'https://aem-dev.strattonfinance.com.au/car-finance/green-car-loan'
         ]
        console.log(`Total URl's count: ${urls.length}`);
    });

    test('URLs should not contain unresolved variables', async ({ browser, page }) => {
        test.setTimeout(720000); //  minutes timeout for this test

        const failedPages = [];
        const variableRegex = /\$\{[\w-]+\}|\${\{[\w-]+\}\}|\$\{[\w-]+\}/g;
        // Parse XML and extract URLs
        for (const url of urls) {

            try {
                const response = await page.goto(url, { waitUntil: 'networkidle' });
                const status = response ? response.status() : 'No response';
                const html = await page.content();

                console.log(`Checking: ${url}`);
                await page.evaluate(() => {
                    document.querySelectorAll('script, style, noscript, template')
                        .forEach(el => el.remove());
                });
                const bodyText = await page.locator('body').innerText();

                const matches = bodyText.match(variableRegex) || [];
                const uniqueVariables = [...new Set(matches)];
                if (uniqueVariables.length > 0) {
                    failedPages.push({
                        url,
                        variables: uniqueVariables
                    });

                    console.log(`❌ Found: ${uniqueVariables.join(', ')}`);
                } else {
                    console.log('✅ No issues');
                }
            }
            catch (error) {
                failedPages.push({
                    url,
                    variables: [`Navigation error: ${error.message}`]
                });

                console.log(`🚨 Error on ${url}`);
            }
            


        }
        const timestamp = new Date().toLocaleString('en-AU', { 
            timeZone: 'Australia/Sydney',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(/\//g, '-').replace(/,\s*/g, '').replace(/:/g, '-');
        const filename = `failed-pages-${timestamp}.json`;
            fs.writeFileSync(
                filename,
                JSON.stringify(failedPages, null, 2)
            );
       //send email if there are failed pages
        if (failedPages.length > 0) {
            console.log(`📧 Sending email report...`);
            //await sendEmail(failedPages);
            console.log(`❌ ${failedPages.length} pages contain unprocessed variables`);
        }

        console.log(`🎉 Among ${urls.length} pages, ${urls.length - failedPages.length} pages rendered correctly.`);
    });
});
