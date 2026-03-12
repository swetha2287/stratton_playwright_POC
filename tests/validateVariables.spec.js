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
        urls = ['https://aem-dev.strattonfinance.com.au/stratton/au/en/personal/home-loans/variable-rate-home-loan.html',
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

                //validate if banner is present and if yes, then validate content is available in the banner especially to validate 
                // the test in CI environment where the page might not load completely due to various reasons and the test might give false positives. 
                // This is to ensure that the test is validating the content and not just the presence of the banner which might be empty due to loading issues.
                const bannerLocator = page.locator('.banner-landing');
                const bannerCount = await bannerLocator.count();
                console.log(`Banner count on ${url}: ${bannerCount}`, `Banner count: ${bannerCount}`);
                if (bannerCount > 0) {
                    const bannerText = await bannerLocator.innerText();
                    if (bannerText.trim() === '') {
                        failedPages.push({
                            url,
                            variables: ['Banner is present but contains no text content, indicating a potential loading issue.']
                        });
                        await expect(bannerLocator).toBeVisible({ timeout: 10000 }); // Ensure banner is visible
                        //await expect(bannerLocator).toHaveText(/.+/, { timeout: 10000 }); // Wait for banner to have some text content
                        await expect(bannerLocator).not.toBeEmpty({ timeout: 10000 }); // Ensure banner is not empty
                        console.log(`🚨 Banner is empty on ${url}`);
                        continue; // Skip variable check for this page as it indicates a loading issue
                    }
                }

                    const matches = bodyText.match(variableRegex) || [];
                    const uniqueVariables = [...new Set(matches)];

                    if (uniqueVariables.length > 0) {
                        failedPages.push({
                            url,
                            variables: uniqueVariables
                        });
                        // expect(uniqueVariables.length).toBe(0, `Found unresolved variables on ${url}: ${uniqueVariables.join(', ')}`);
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
            const filename = `failed-pages-results-${timestamp}.json`;
            fs.writeFileSync(
                filename,
                JSON.stringify(failedPages, null, 2)
            );
<<<<<<< HEAD
       //send email if there are failed pages
        if (failedPages.length > 0) {
            console.log(`📧 Sending email report...`);
            //await sendEmail(failedPages);
            console.log(`❌ ${failedPages.length} pages contain unprocessed variables`);
        }
=======
            //send email if there are failed pages
            if (failedPages.length > 0) {
                console.log(`📧 Sending email report...`);
                //await sendEmail(failedPages);
                console.log(`❌ ${failedPages.length} pages contain unprocessed variables`);
            }
>>>>>>> cf71f63 (5th fix:update config with tracing,update test with a component visiblity to avoid false positives on pipeline)

            console.log(`🎉 Among ${urls.length} pages, ${urls.length - failedPages.length} pages rendered correctly.`);
        });
});
