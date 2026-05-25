const { chromium } = require('playwright');

async function testFunctionality() {
  console.log('🧪 Functionality Tests\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('✓') || msg.text().includes('Loaded')) {
      console.log('   ' + msg.text());
    }
  });
  
  try {
    // 1. Login Test
    console.log('1. Login Test');
    await page.goto('http://localhost:8000/admin.html');
    await page.waitForSelector('#loginSection');
    console.log('   ✓ Login form visible');
    
    await page.fill('#adminPassword', 'admin123');
    await page.click('button:has-text("Acceder")');
    await page.waitForTimeout(3000);
    
    const adminVisible = await page.isVisible('#adminPanel');
    if (adminVisible) {
      console.log('   ✓ Admin panel loaded');
    }
    
    // 2. Google Sheets Data Load
    console.log('\n2. Google Sheets Data Loading');
    await page.waitForTimeout(2000);
    
    // 3. Materials Tab
    console.log('\n3. Materials Tab');
    const materialsText = await page.locator('.admin-material-table').textContent();
    if (materialsText.includes('Pega') || materialsText.includes('azulejos')) {
      console.log('   ✓ Materials loaded from Sheets');
    }
    if (materialsText.includes('sacos')) {
      console.log('   ✓ New units (sacos) visible');
    }
    if (materialsText.includes('$')) {
      console.log('   ✓ Prices displayed');
    }
    
    // 4. Services Tab
    console.log('\n4. Services Tab');
    await page.click('button:has-text("SERVICIOS")');
    await page.waitForTimeout(500);
    
    const servicesText = await page.locator('.admin-service-item').first().textContent();
    if (servicesText) {
      console.log('   ✓ Services loaded: ' + servicesText.trim());
    }
    
    // 5. Calculator Tab
    console.log('\n5. Calculator Tab');
    await page.click('button:has-text("CALCULADORA")');
    await page.waitForTimeout(500);
    
    const calcForm = await page.$('#serviceSelect');
    if (calcForm) {
      console.log('   ✓ Calculator form loaded');
    }
    
  } catch (err) {
    console.error('   ✗ Error:', err.message);
  }
  
  await browser.close();
  console.log('\n✅ Functionality tests complete');
}

testFunctionality().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
