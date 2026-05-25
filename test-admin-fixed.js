const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  
  try {
    await page.goto('http://localhost:8000/admin.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Get sidebar HTML directly
    const sidebarHTML = await page.evaluate(() => {
      const sidebar = document.getElementById('servicesSidebar');
      return sidebar ? {
        length: sidebar.innerHTML.length,
        hasItems: sidebar.innerHTML.includes('admin-service-item'),
        preview: sidebar.innerHTML.substring(0, 200)
      } : { error: 'NOT FOUND' };
    });
    
    console.log('Sidebar:', sidebarHTML);
    
    // Get page title and check which tab is active
    const activeTab = await page.evaluate(() => {
      const btn = document.querySelector('.admin-tab-btn.active');
      return btn ? btn.textContent : 'NONE';
    });
    
    console.log('Active tab:', activeTab);
    
    // Check if servicios object exists and has data
    const serviciosData = await page.evaluate(() => {
      if (typeof servicios === 'undefined') return 'servicios is undefined';
      return { keys: Object.keys(servicios).length, type: typeof servicios };
    }).catch(e => ({ error: e.message }));
    
    console.log('servicios object:', serviciosData);
    
    console.log('\nData loading logs:');
    logs.filter(l => l.includes('Servicios')).forEach(l => console.log('  ' + l));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
