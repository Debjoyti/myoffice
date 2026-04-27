const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  page.on('response', response => console.log('RESPONSE:', response.url(), response.status()));

  await page.goto('http://localhost:3000/login');

  await page.fill('input[type="email"]', 'superadmin@demo.com');
  await page.fill('input[type="password"]', 'password123');

  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);

  await browser.close();
})();
