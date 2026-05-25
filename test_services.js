const { chromium } = require('playwright');

async function testServices() {
  console.log('🔍 Services Tab Debug\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000/admin.html');
    await page.waitForSelector('#loginSection');
    
    await page.fill('#adminPassword', 'admin123');
    await page.click('button:has-text("Acceder")');
    await page.waitForTimeout(3000);
    
    // Check Services Tab
    await page.click('button:has-text("SERVICIOS")');
    await page.waitForTimeout(1000);
    
    // Get all elements in sidebar
    const sidebarText = await page.locator('#servicesSidebar').textContent();
    console.log('Sidebar content:');
    console.log(sidebarText.substring(0, 200));
    
    if (sidebarText.includes('Vitropiso') || sidebarText.includes('Cementado')) {
      console.log('\n✓ Services are loaded');
    } else {
      console.log('\n✗ Services not visible');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await browser.close();
}

testServices().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
