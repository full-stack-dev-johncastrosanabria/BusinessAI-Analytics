#!/usr/bin/env node

/**
 * BusinessAI-Analytics Platform - Interactive Browser Demo
 * Automated 2-3 minute demo showcasing all features
 * Uses Playwright for reliable browser automation
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

const FRONTEND_URL = 'http://localhost:5173';
const DEMO_TIMEOUT = 180000; // 3 minutes in ms

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color: string, message: string): void {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title: string): void {
  console.log('');
  log(colors.purple, '╔════════════════════════════════════════════════════════════╗');
  log(colors.purple, `║ ${title.padEnd(60)} ║`);
  log(colors.purple, '╚════════════════════════════════════════════════════════════╝');
  console.log('');
}

function step(title: string): void {
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.cyan, `📋 ${title}`);
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

function action(message: string): void {
  log(colors.green, `  ▶ ${message}`);
}

async function wait(seconds: number, message: string = 'Waiting'): Promise<void> {
  log(colors.yellow, `⏳ ${message} (${seconds}s)`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  log(colors.green, '   ✓ Ready!');
}

async function createProduct(page: Page): Promise<boolean> {
  try {
    log(colors.red, '🔴🔴🔴 CRUD OPERATION: CREATE PRODUCT 🔴🔴🔴');
    action('🔴 CREATING NEW PRODUCT - Watch the form appear');
    
    const createSelectors = [
      'button:has-text("Add Product")',
      'button:has-text("Create Product")',
      'button:has-text("New Product")',
      'button:has-text("Add")',
      'button:has-text("Create")',
      '.btn-primary:has-text("Add")',
      '[data-testid="add-product"]'
    ];

    for (const selector of createSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          log(colors.red, '🔴 FOUND: Add Product Button');
          await wait(2, '🔴 Button found - clicking now');
          await btn.click();
          log(colors.red, '🔴 CLICKED: Add Product Button');
          await page.waitForTimeout(800);
          
          // Try to fill in form fields
          const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"], input[type="text"]').first();
          if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            log(colors.red, '🔴 FOUND: Product Name Input');
            await nameInput.fill('Demo Product ' + Date.now());
            log(colors.red, '🔴 FILLED: Product Name');
            await wait(1, '✓ Product name entered');
            
            // Look for save button
            const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
            if (await saveBtn.isVisible({ timeout: 500 }).catch(() => false)) {
              log(colors.red, '🔴 FOUND: Save Button');
              await wait(1, '🔴 Clicking Save button');
              await saveBtn.click();
              log(colors.red, '🔴 CLICKED: Save Button');
              await page.waitForTimeout(1500);
              log(colors.green, '✅✅✅ PRODUCT CREATED SUCCESSFULLY ✅✅✅');
              return true;
            }
          }
          
          await page.press('body', 'Escape');
          return false;
        }
      } catch (e) {}
    }
    
    log(colors.yellow, '⚠️  Could not find create product button');
    return false;
  } catch (error) {
    log(colors.yellow, `⚠️  Error creating product: ${error}`);
    return false;
  }
}

async function createCustomer(page: Page): Promise<boolean> {
  try {
    log(colors.red, '🔴🔴🔴 CRUD OPERATION: CREATE CUSTOMER 🔴🔴🔴');
    action('🔴 CREATING NEW CUSTOMER - Watch the form appear');
    
    const createSelectors = [
      'button:has-text("Add Customer")',
      'button:has-text("Create Customer")',
      'button:has-text("New Customer")',
      'button:has-text("Add")',
      'button:has-text("Create")',
      '.btn-primary:has-text("Add")',
      '[data-testid="add-customer"]'
    ];

    for (const selector of createSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          log(colors.red, '🔴 FOUND: Add Customer Button');
          await wait(2, '🔴 Button found - clicking now');
          await btn.click();
          log(colors.red, '🔴 CLICKED: Add Customer Button');
          await page.waitForTimeout(800);
          
          // Try to fill in form fields
          const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"], input[type="text"]').first();
          if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            log(colors.red, '🔴 FOUND: Customer Name Input');
            await nameInput.fill('Demo Customer ' + Date.now());
            log(colors.red, '🔴 FILLED: Customer Name');
            await wait(1, '✓ Customer name entered');
            
            // Look for save button
            const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
            if (await saveBtn.isVisible({ timeout: 500 }).catch(() => false)) {
              log(colors.red, '🔴 FOUND: Save Button');
              await wait(1, '🔴 Clicking Save button');
              await saveBtn.click();
              log(colors.red, '🔴 CLICKED: Save Button');
              await page.waitForTimeout(1500);
              log(colors.green, '✅✅✅ CUSTOMER CREATED SUCCESSFULLY ✅✅✅');
              return true;
            }
          }
          
          await page.press('body', 'Escape');
          return false;
        }
      } catch (e) {}
    }
    
    log(colors.yellow, '⚠️  Could not find create customer button');
    return false;
  } catch (error) {
    log(colors.yellow, `⚠️  Error creating customer: ${error}`);
    return false;
  }
}

async function navigateToTab(page: Page, tabName: string, url: string): Promise<boolean> {
  try {
    action(`📍 Navigating to ${tabName} tab`);
    
    // Try clicking the tab first
    const selectors = [
      `text=${tabName}`,
      `a:has-text("${tabName}")`,
      `button:has-text("${tabName}")`,
      `[role="tab"]:has-text("${tabName}")`,
    ];

    let found = false;
    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
          await element.click();
          await page.waitForTimeout(800);
          found = true;
          break;
        }
      } catch (e) {}
    }

    // If tab click didn't work, navigate directly
    if (!found) {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    }

    // Scroll to top-left and fix positioning - CRITICAL
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      
      // Remove all margins and padding
      document.documentElement.style.margin = '0 !important';
      document.documentElement.style.padding = '0 !important';
      document.documentElement.style.border = '0 !important';
      document.documentElement.style.width = '100vw !important';
      document.documentElement.style.height = '100vh !important';
      
      document.body.style.margin = '0 !important';
      document.body.style.padding = '0 !important';
      document.body.style.border = '0 !important';
      document.body.style.width = '100vw !important';
      document.body.style.height = '100vh !important';
      
      // Remove existing override if present
      const existingStyle = document.getElementById('fullscreen-override');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Minimal reset - let app styles work
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);

    return true;
  } catch (error) {
    log(colors.yellow, `⚠️  Could not navigate to ${tabName}`);
    return false;
  }
}

async function runDemo(): Promise<void> {
  let browser: Browser | null = null;
  const startTime = Date.now();

  try {
    header('🎬 BusinessAI-Analytics Platform - Interactive Demo');

    // ====================================================================
    // STEP 0: FULLSCREEN MODE - FIRST PRIORITY
    // ====================================================================

    step('STEP 0: ENTERING FULLSCREEN MODE');

    log(colors.blue, '🌐 Launching browser in fullscreen...');
    browser = await chromium.launch({ 
      headless: false,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-sync',
        '--disable-infobars',
        '--disable-popup-blocking',
        '--disable-dev-shm-usage'
      ]
    });
    
    log(colors.blue, '📱 Creating browser context with 1920x1080 viewport...');
    const context: BrowserContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      deviceScaleFactor: 1,
    });
    
    const page: Page = await context.newPage();
    
    log(colors.blue, '🖥️ Maximizing window and removing margins...');
    // Minimal CSS reset for fullscreen - let the app's own styles work
    await page.evaluate(() => {
      // Reset HTML element
      document.documentElement.style.cssText = `
        margin: 0 !important;
        padding: 0 !important;
      `;
      
      // Reset body element
      document.body.style.cssText = `
        margin: 0 !important;
        padding: 0 !important;
      `;
      
      // Scroll to top-left
      window.scrollTo(0, 0);
    });
    
    await page.waitForTimeout(1500);
    
    log(colors.green, `✅✅✅ FULLSCREEN MODE ACTIVE ✅✅✅`);
    
    // Verify fullscreen is actually working
    const isFullscreenWorking = await page.evaluate(() => {
      const body = document.body;
      const rect = body.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        bodyMargin: window.getComputedStyle(body).margin,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      };
    });
    
    log(colors.blue, `📊 Fullscreen verification:`);
    log(colors.blue, `   Position: (${isFullscreenWorking.left}, ${isFullscreenWorking.top})`);
    log(colors.blue, `   Size: ${isFullscreenWorking.width}x${isFullscreenWorking.height}`);
    log(colors.blue, `   Window: ${isFullscreenWorking.windowWidth}x${isFullscreenWorking.windowHeight}`);
    log(colors.blue, `   Body margin: ${isFullscreenWorking.bodyMargin}`);
    
    if (isFullscreenWorking.windowWidth < 1920) {
      log(colors.red, `❌ WARNING: Window width is ${isFullscreenWorking.windowWidth}px, expected 1920px`);
      log(colors.yellow, `⚠️  Navigation tabs may not all be visible`);
    }
    
    if (isFullscreenWorking.left !== 0 || isFullscreenWorking.top !== 0) {
      log(colors.red, `❌ CRITICAL: Content is shifted! Position: (${isFullscreenWorking.left}, ${isFullscreenWorking.top})`);
      log(colors.red, `❌ ABORTING DEMO - Fullscreen not working correctly`);
      await browser.close();
      process.exit(1);
    }
    
    log(colors.green, `✅ Fullscreen verified - content properly positioned`);
    await wait(2, 'Browser ready in fullscreen');

    // ====================================================================
    // STEP 1: DASHBOARD
    // ====================================================================

    step('STEP 1: DASHBOARD - Real-time Business Metrics');

    log(colors.blue, `Opening: ${FRONTEND_URL}`);
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 15000 });
    
    // Ensure we're at top-left corner - minimal CSS
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      
      // Remove existing override if present
      const existingStyle = document.getElementById('fullscreen-override');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Minimal reset - let app styles work
      document.documentElement.style.cssText = `
        margin: 0 !important;
        padding: 0 !important;
      `;
      
      document.body.style.cssText = `
        margin: 0 !important;
        padding: 0 !important;
      `;
    });
    await page.waitForTimeout(500);
    
    action('📊 Viewing dashboard overview');
    await wait(3, 'Dashboard loading and rendering');
    
    action('📊 Scrolling to see all metrics');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(3, 'Viewing dashboard content - viewers can see all metrics');

    // ====================================================================
    // STEP 2: ANALYTICS & FORECASTING
    // ====================================================================

    step('STEP 2: ANALYTICS & FORECASTING - AI-Powered Predictions');

    await navigateToTab(page, 'Analytics', `${FRONTEND_URL}/analytics`);
    await wait(3, 'Analytics page loading');
    
    action('📈 Viewing AI-powered forecast charts');
    await wait(2, 'Page rendering');
    
    // Scroll to top first
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1, 'Positioned at top');
    
    // Scroll down to see forecasts - multiple scrolls for visibility
    action('📈 Scrolling to reveal forecast charts');
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(3, 'Forecasts visible - viewers can see predictions');
    
    action('📈 Scrolling more to see all forecast details');
    await page.evaluate(() => window.scrollBy(0, 600));
    await wait(3, 'Viewing detailed forecasts - viewers can see all data');
    
    action('📈 Scrolling to see bottom of forecasts');
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(2, 'All forecast data visible');

    // ====================================================================
    // STEP 3: CHATBOT - Business Intelligence Questions
    // ====================================================================

    step('STEP 3: AI CHATBOT - Bilingual Business Intelligence');

    await navigateToTab(page, 'Chatbot', `${FRONTEND_URL}/chatbot`);
    await wait(2, 'Chatbot page loading');

    action('🤖 Demonstrating bilingual AI queries');
    await wait(1, 'Ready to ask questions');

    // Spanish business questions
    const queries = [
      '¿Cuál fue el mes con peor utilidad?',
      '¿Qué mes estuvo más cerca de pérdida?',
      '¿Cuánto se facturó este mes?',
      '¿Cuál fue la factura o venta más alta?',
      '¿Qué producto se facturó más?',
      '¿Qué día tuvimos más ventas?'
    ];

    // Find and interact with chatbot
    const inputSelectors = [
      'input[placeholder*="Ask"]',
      'textarea[placeholder*="Ask"]',
      'input[type="text"]',
      'textarea',
      '.chat-input input',
      '.message-input',
      '#chat-input'
    ];

    let chatInput = null;
    for (const selector of inputSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
          chatInput = element;
          break;
        }
      } catch (e) {}
    }

    if (chatInput) {
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        action(`🤖 QUESTION ${i + 1}/6: ${query}`);
        
        try {
          await chatInput.clear();
          await chatInput.fill(query);
          await wait(2, '⏳ Question typed - waiting to submit');

          // Find and click send button
          const sendSelectors = [
            'button:has-text("Send")',
            'button:has-text("Enviar")',
            'button[type="submit"]',
            '.send-button',
            'button:has([data-icon="send"])'
          ];

          let sent = false;
          for (const selector of sendSelectors) {
            try {
              const sendBtn = page.locator(selector).first();
              if (await sendBtn.isVisible({ timeout: 500 }).catch(() => false)) {
                await wait(1, '🔵 Send button found - clicking');
                await sendBtn.click();
                sent = true;
                break;
              }
            } catch (e) {}
          }

          if (!sent) {
            await chatInput.press('Enter');
          }

          await wait(3, '⏳ AI processing response - watch for answer');
          await wait(2, '✓ Answer displayed - viewers can read it');
        } catch (e) {
          log(colors.yellow, `⚠️  Error with query ${i + 1}`);
        }
      }
    } else {
      log(colors.yellow, '⚠️  Chat input not found');
    }

    await wait(2, '✓ Chatbot demo complete');

    // ====================================================================
    // STEP 4: PRODUCTS - CRUD Operations
    // ====================================================================

    step('STEP 4: PRODUCTS - Inventory Management (CRUD)');

    await navigateToTab(page, 'Products', `${FRONTEND_URL}/products`);
    await wait(2, 'Products page loading');
    
    action('📦 Viewing product catalog');
    await wait(2, 'Observing products');
    
    // Try to create a product
    await createProduct(page);
    await wait(3, '✓ Product creation complete - viewers can see the new product');
    
    action('📦 Scrolling through product list');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(3, 'Viewing product details - viewers can see products');

    // Try to interact with product actions
    try {
      const editSelectors = [
        'button:has-text("Edit")',
        'button:has-text("View")',
        '[data-testid="edit-product"]',
        '.btn-sm'
      ];

      for (const selector of editSelectors) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
            action('🔴 Clicking product action button');
            await wait(1, '🔴 Button found');
            await btn.click();
            await wait(3, 'Product details displayed - viewers can see the data');
            
            // Close by pressing Escape
            await page.press('body', 'Escape');
            await wait(1, 'Details closed');
            break;
          }
        } catch (e) {}
      }
    } catch (e) {
      log(colors.yellow, '⚠️  Could not perform product operations');
    }

    action('📦 Scrolling to see more products');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2, 'Viewing more products');

    // ====================================================================
    // STEP 5: CUSTOMERS - Customer Management
    // ====================================================================

    step('STEP 5: CUSTOMERS - Customer Segments');

    await navigateToTab(page, 'Customers', `${FRONTEND_URL}/customers`);
    await wait(2, 'Customers page loading');
    
    action('👥 Viewing customer segments');
    await wait(2, 'Observing customer data');
    
    // Try to create a customer
    await createCustomer(page);
    await wait(3, '✓ Customer creation complete - viewers can see the new customer');
    
    action('👥 Scrolling through customer list');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(3, 'Viewing customer details - viewers can see customers');

    // Try to interact with customer actions
    try {
      const editSelectors = [
        'button:has-text("Edit")',
        'button:has-text("View")',
        '[data-testid="edit-customer"]',
        '.btn-sm'
      ];

      for (const selector of editSelectors) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
            action('🔴 Clicking customer action button');
            await wait(1, '🔴 Button found');
            await btn.click();
            await wait(3, 'Customer details displayed - viewers can see the data');
            
            // Close by pressing Escape
            await page.press('body', 'Escape');
            await wait(1, 'Details closed');
            break;
          }
        } catch (e) {}
      }
    } catch (e) {
      log(colors.yellow, '⚠️  Could not perform customer operations');
    }

    action('👥 Scrolling to see more customers');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2, 'Viewing more customers');

    // ====================================================================
    // STEP 6: SALES - Transaction History (Infinite Scroll)
    // ====================================================================

    step('STEP 6: SALES - Transaction History (Infinite Scroll)');

    await navigateToTab(page, 'Sales', `${FRONTEND_URL}/sales-infinite`);
    await wait(2, 'Sales page loading');
    
    action('💰 Viewing transaction history');
    await wait(2, 'Observing sales data');
    
    action('💰 Scrolling through transactions');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(3, 'Viewing transaction details - viewers can see the sales');

    // Try to interact with sales actions
    try {
      const actionSelectors = [
        'button:has-text("View")',
        'button:has-text("Details")',
        '[data-testid="view-sale"]',
        '.btn-info'
      ];

      for (const selector of actionSelectors) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
            action('🔴 Clicking sale details button');
            await wait(1, '🔴 Button found');
            await btn.click();
            await wait(3, 'Sale details displayed - viewers can see the transaction');
            
            // Close by pressing Escape
            await page.press('body', 'Escape');
            await wait(1, 'Details closed');
            break;
          }
        } catch (e) {}
      }
    } catch (e) {
      log(colors.yellow, '⚠️  Could not perform sales operations');
    }

    action('💰 Scrolling to see more transactions');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2, 'Viewing more transactions');

    // ====================================================================
    // STEP 7: DOCUMENTS - Document Management
    // ====================================================================

    step('STEP 7: DOCUMENTS - Document Management');

    await navigateToTab(page, 'Documents', `${FRONTEND_URL}/documents`);
    await wait(2, 'Documents page loading');
    
    action('📄 Viewing document uploads');
    await wait(2, 'Observing documents');
    
    action('📄 Scrolling through document list');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2, 'Viewing document details - viewers can see the documents');

    // ====================================================================
    // DEMO COMPLETE
    // ====================================================================

    step('🎉 DEMO COMPLETE 🎉');

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    log(colors.green, `✨✨✨ Demo finished successfully in ${elapsedSeconds} seconds! ✨✨✨`);
    
    action('Closing browser');
    await wait(3, 'Final showcase - viewers can see the complete demo');

    await browser.close();

    header('🎬 DEMO FINISHED SUCCESSFULLY! 🎬');

    log(colors.green, '✅✅✅ ALL FEATURES DEMONSTRATED SUCCESSFULLY ✅✅✅');
    action('✓ Real-time business analytics dashboard');
    action('✓ AI-powered forecasting with PyTorch');
    action('✓ Bilingual conversational AI (6 business questions)');
    action('✓ Product inventory management (CRUD)');
    action('✓ Customer segment analysis (CRUD)');
    action('✓ Sales transaction tracking');
    action('✓ Document management system');
    console.log('');
    log(colors.yellow, '🚀🚀🚀 READY FOR YOUTUBE UPLOAD! 🚀🚀🚀');
    console.log('');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(colors.red, `❌ Error: ${errorMessage}`);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Run demo with timeout
const timeoutHandle = setTimeout(() => {
  log(colors.red, '❌ Demo timeout - exceeded 3 minutes');
  process.exit(1);
}, DEMO_TIMEOUT);

runDemo()
  .then(() => {
    clearTimeout(timeoutHandle);
    process.exit(0);
  })
  .catch(error => {
    clearTimeout(timeoutHandle);
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(colors.red, `Fatal error: ${errorMessage}`);
    process.exit(1);
  });
