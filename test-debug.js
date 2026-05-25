const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  
  try {
    await page.goto('http://localhost:8000/admin.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    
    console.log('All console logs:');
    logs.forEach((l, i) => console.log(`${i}: ${l}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
