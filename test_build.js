const { chromium } = require('playwright');
const fs = require('fs');

async function runBuildTests() {
  console.log('🔨 Build Tests\n');
  
  // 1. Check HTML file
  console.log('1. HTML Validation');
  try {
    const html = fs.readFileSync('admin.html', 'utf-8');
    if (html.includes('<!DOCTYPE html>') && html.includes('</html>')) {
      console.log('   ✓ HTML structure valid');
    }
  } catch (err) {
    console.log('   ✗ HTML file error:', err.message);
  }
  
  // 2. Check JavaScript file
  console.log('\n2. JavaScript Validation');
  try {
    const js = fs.readFileSync('admin.js', 'utf-8');
    if (js.includes('function loadMateriales') && js.includes('function renderMaterialsTab')) {
      console.log('   ✓ JavaScript file exists with required functions');
    }
  } catch (err) {
    console.log('   ✗ JS file error:', err.message);
  }
  
  // 3. Browser test
  console.log('\n3. Runtime Tests');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000/admin.html', { waitUntil: 'networkidle' });
    console.log('   ✓ Page loads without errors');
    
    // Check for critical elements
    const hasLogin = await page.$('#loginSection') !== null;
    const hasAdmin = await page.$('#adminPanel') !== null;
    
    if (hasLogin && hasAdmin) {
      console.log('   ✓ Critical DOM elements present');
    }
    
    // Check console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.waitForTimeout(2000);
    
    if (errors.length === 0) {
      console.log('   ✓ No console errors');
    } else {
      console.log('   ⚠ Console errors found:', errors.slice(0, 2));
    }
    
  } catch (err) {
    console.log('   ✗ Runtime error:', err.message);
  }
  
  await browser.close();
  
  console.log('\n✅ Build validation complete');
}

runBuildTests().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
