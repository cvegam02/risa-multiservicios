const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.goto('http://localhost:8000/admin.html');
  await page.waitForSelector('#loginSection');
  await page.fill('#adminPassword', 'admin123');
  await page.click('button:has-text("Acceder")');
  await page.waitForSelector('.admin-material-table');
  await page.waitForTimeout(300);
  
  // Get table content
  const table = await page.locator('.admin-material-table').textContent();
  console.log('Table content (first 500 chars):');
  console.log(table.substring(0, 500));
  
  await page.screenshot({ path: '/tmp/units_updated.png', fullPage: false });
  console.log('\n✓ Screenshot saved');
  
  await browser.close();
}

test().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
