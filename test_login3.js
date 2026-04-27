const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');

  await page.fill('input[type="email"]', 'superadmin@demo.com');
  await page.fill('input[type="password"]', 'WRONGPASSWORD');

  await page.click('button[type="submit"]');

  await page.waitForTimeout(1000);

  const toastText = await page.locator('.go3958315181, [data-sonner-toast]').innerText().catch(() => '');
  console.log('TOAST:', toastText);

  await browser.close();
})();
