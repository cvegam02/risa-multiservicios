const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  // Enable logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:8000/admin.html');
  
  // Wait for login form
  await page.waitForSelector('#loginSection', { timeout: 10000 });
  console.log('✓ Page loaded');
  
  // Login
  await page.fill('#adminPassword', 'admin123');
  await page.click('button:has-text("Acceder")');
  
  // Wait for materials to load
  await page.waitForTimeout(5000);
  
  // Check if materials loaded
  const materialsText = await page.locator('.admin-material-table').textContent();
  
  if (materialsText.includes('Pega') || materialsText.includes('azulejos')) {
    console.log('✓ Datos cargados de Google Sheets');
  } else {
    console.log('✗ No se cargaron datos');
  }
  
  await browser.close();
}

test().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
