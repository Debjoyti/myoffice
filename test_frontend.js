const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');
  await page.screenshot({ path: 'login_initial.png' });

  console.log('Login screenshot taken.');
  await browser.close();
})();
