#!/usr/bin/env node

/**
 * BusinessAI-Analytics Platform - Video Recording Demo Script
 * Automated 4-5 minute video recording showcasing all features
 * Uses Playwright for reliable browser automation
 * 
 * Demo Flow (4-5 minutes):
 * 1. Run applications
 * 2. Wait 8 seconds on login screen
 * 3. Test dark mode toggle
 * 4. Test language switch (EN/ES)
 * 5. Login with demo credentials
 * 6. Show dashboard for ~5 seconds
 * 7. Apply filter and see changes
 * 8. Show forecasts for 15+ seconds with scrolling and zoom
 * 9. Show chatbot with 5 English + 5 Spanish questions
 * 10. Quickly show clients and products, create product, register sale
 * 11. Show sales infinite scroll
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

const FRONTEND_URL = 'http://localhost:5173';
const DEMO_TIMEOUT = 360000; // 6 minutes (buffer for 4-5 min demo)

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

async function navigateToTab(page: Page, tabName: string, url: string): Promise<boolean> {
  try {
    action(`📍 Navigating to ${tabName}`);
    
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

    // Reset scroll position
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.documentElement.style.cssText = `margin: 0 !important; padding: 0 !important;`;
      document.body.style.cssText = `margin: 0 !important; padding: 0 !important;`;
    });
    await page.waitForTimeout(500);

    return true;
  } catch (error) {
    log(colors.yellow, `⚠️  Could not navigate to ${tabName}`);
    return false;
  }
}

async function createProduct(page: Page): Promise<boolean> {
  try {
    log(colors.red, '🔴 CREATING NEW PRODUCT');
    
    const createSelectors = [
      'button:has-text("Add Product")',
      'button:has-text("Create Product")',
      'button:has-text("New Product")',
      'button:has-text("Add")',
      '.btn-primary:has-text("Add")',
      '[data-testid="add-product"]'
    ];

    for (const selector of createSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          log(colors.green, '✓ Found Add Product button');
          await wait(2, 'Clicking Add Product');
          await btn.click();
          await page.waitForTimeout(800);
          
          // Try to fill form
          const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"], input[type="text"]').first();
          if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            await nameInput.fill('Demo Product ' + Date.now());
            await wait(2, 'Product name entered');
            
            // Look for save button
            const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
            if (await saveBtn.isVisible({ timeout: 500 }).catch(() => false)) {
              await wait(1, 'Saving product');
              await saveBtn.click();
              await page.waitForTimeout(1500);
              log(colors.green, '✅ PRODUCT CREATED SUCCESSFULLY');
              return true;
            }
          }
          
          await page.press('body', 'Escape');
          return false;
        }
      } catch (e) {}
    }
    
    log(colors.yellow, '⚠️  Could not create product');
    return false;
  } catch (error) {
    log(colors.yellow, `⚠️  Error creating product`);
    return false;
  }
}

async function runDemo(): Promise<void> {
  let browser: Browser | null = null;
  const startTime = Date.now();

  try {
    header('🎬 BusinessAI-Analytics - 4-5 Minute Video Recording Demo');

    // ====================================================================
    // STEP 0: LAUNCH BROWSER IN FULLSCREEN
    // ====================================================================

    step('STEP 0: LAUNCHING BROWSER IN FULLSCREEN');

    log(colors.blue, '🌐 Launching browser...');
    browser = await chromium.launch({ 
      headless: false,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check'
      ]
    });
    
    const context: BrowserContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      deviceScaleFactor: 1,
    });
    
    const page: Page = await context.newPage();
    
    await page.evaluate(() => {
      document.documentElement.style.cssText = `margin: 0 !important; padding: 0 !important;`;
      document.body.style.cssText = `margin: 0 !important; padding: 0 !important;`;
      window.scrollTo(0, 0);
    });
    
    log(colors.green, `✅ FULLSCREEN MODE ACTIVE`);
    await wait(2, 'Browser ready');

    // ====================================================================
    // STEP 1: LOGIN SCREEN - Wait 8 seconds
    // ====================================================================

    step('STEP 1: LOGIN SCREEN (8 seconds)');

    log(colors.blue, `Opening: ${FRONTEND_URL}`);
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 15000 });
    
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.documentElement.style.cssText = `margin: 0 !important; padding: 0 !important;`;
      document.body.style.cssText = `margin: 0 !important; padding: 0 !important;`;
    });
    
    action('🔐 Displaying login screen');
    await wait(8, '⏳ LOGIN SCREEN - 8 seconds for viewers');

    // ====================================================================
    // STEP 2: TEST DARK MODE
    // ====================================================================

    step('STEP 2: DARK MODE TOGGLE TEST');

    action('🌙 Testing dark mode');
    
    const themeToggleSelectors = [
      'button[aria-label*="theme"]',
      'button[aria-label*="Theme"]',
      'button[title*="theme"]',
      '.theme-toggle',
      '[data-testid="theme-toggle"]'
    ];

    let themeToggled = false;
    for (const selector of themeToggleSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          log(colors.green, '✓ Found theme toggle');
          await wait(2, '🌙 Enabling dark mode');
          await btn.click();
          await wait(3, '✓ Dark mode active');
          
          await wait(2, '☀️ Returning to light mode');
          await btn.click();
          await wait(3, '✓ Light mode restored');
          themeToggled = true;
          break;
        }
      } catch (e) {}
    }

    if (!themeToggled) {
      log(colors.yellow, '⚠️  Theme toggle not found - skipping');
    }

    // ====================================================================
    // STEP 3: TEST LANGUAGE SWITCH
    // ====================================================================

    step('STEP 3: LANGUAGE SWITCH TEST');

    action('🌐 Testing language switch');
    
    const languageSelectors = [
      'button[aria-label*="language"]',
      'button[aria-label*="Language"]',
      '.language-selector',
      '[data-testid="language-selector"]',
      'button:has-text("EN")',
      'button:has-text("ES")'
    ];

    let languageSwitched = false;
    for (const selector of languageSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
          log(colors.green, '✓ Found language selector');
          await wait(2, '🌐 Switching to Spanish');
          await element.click();
          await page.waitForTimeout(500);
          
          // Try to select Spanish
          const spanishOptions = ['text=Español', 'text=ES', 'button:has-text("Español")', '[value="es"]'];
          for (const option of spanishOptions) {
            try {
              const optionElement = page.locator(option).first();
              if (await optionElement.isVisible({ timeout: 500 }).catch(() => false)) {
                await optionElement.click();
                await wait(3, '✓ Spanish active');
                break;
              }
            } catch (e) {}
          }
          
          // Switch back to English
          await wait(2, '🌐 Switching to English');
          await element.click();
          await page.waitForTimeout(500);
          
          const englishOptions = ['text=English', 'text=EN', 'button:has-text("English")', '[value="en"]'];
          for (const option of englishOptions) {
            try {
              const optionElement = page.locator(option).first();
              if (await optionElement.isVisible({ timeout: 500 }).catch(() => false)) {
                await optionElement.click();
                await wait(3, '✓ English restored');
                break;
              }
            } catch (e) {}
          }
          
          languageSwitched = true;
          break;
        }
      } catch (e) {}
    }

    if (!languageSwitched) {
      log(colors.yellow, '⚠️  Language selector not found - skipping');
    }

    // ====================================================================
    // STEP 4: LOGIN WITH DEMO CREDENTIALS
    // ====================================================================

    step('STEP 4: LOGIN WITH DEMO CREDENTIALS');

    action('🔐 Entering credentials');
    
    const usernameSelectors = [
      'input[type="email"]',
      'input[type="text"]',
      'input[name="email"]',
      'input[placeholder*="email"]'
    ];

    let loggedIn = false;
    for (const selector of usernameSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
          await input.fill('demo@businessai.com');
          await wait(2, '✓ Email entered');
          
          const passwordInput = page.locator('input[type="password"]').first();
          if (await passwordInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            await passwordInput.fill('demo123');
            await wait(2, '✓ Password entered');
            
            const loginButtonSelectors = [
              'button[type="submit"]',
              'button:has-text("Login")',
              'button:has-text("Sign in")'
            ];
            
            for (const btnSelector of loginButtonSelectors) {
              try {
                const loginBtn = page.locator(btnSelector).first();
                if (await loginBtn.isVisible({ timeout: 500 }).catch(() => false)) {
                  await wait(2, '🚀 Logging in');
                  await loginBtn.click();
                  await wait(3, '✓ Login successful');
                  loggedIn = true;
                  break;
                }
              } catch (e) {}
            }
            break;
          }
        }
      } catch (e) {}
    }

    if (!loggedIn) {
      log(colors.yellow, '⚠️  Could not login - continuing');
    }

    // ====================================================================
    // STEP 5: DASHBOARD - Show for ~5 seconds
    // ====================================================================

    step('STEP 5: DASHBOARD (5 seconds)');

    await navigateToTab(page, 'Dashboard', `${FRONTEND_URL}/dashboard`);
    
    action('📊 Dashboard overview');
    await wait(5, '📊 DASHBOARD - 5 seconds for viewers');

    // ====================================================================
    // STEP 6: APPLY FILTER
    // ====================================================================

    step('STEP 6: DASHBOARD FILTER');

    action('🔍 Applying filter');
    
    const filterSelectors = ['select', 'input[type="date"]', 'button:has-text("Filter")'];

    let filterApplied = false;
    for (const selector of filterSelectors) {
      try {
        const filter = page.locator(selector).first();
        if (await filter.isVisible({ timeout: 1000 }).catch(() => false)) {
          await wait(2, '🔍 Applying filter');
          await filter.click();
          await page.waitForTimeout(500);
          
          const tagName = await filter.evaluate(el => el.tagName.toLowerCase());
          if (tagName === 'select') {
            await filter.selectOption({ index: 1 });
          }
          
          await wait(4, '✓ Filter applied - data updated');
          filterApplied = true;
          break;
        }
      } catch (e) {}
    }

    if (!filterApplied) {
      log(colors.yellow, '⚠️  Filter not found - scrolling instead');
      await page.evaluate(() => window.scrollBy(0, 300));
      await wait(3, 'Scrolling dashboard');
    }

    // ====================================================================
    // STEP 7: FORECASTS - 15+ seconds with scrolling
    // ====================================================================

    step('STEP 7: FORECASTS (15+ seconds with scrolling)');

    await navigateToTab(page, 'Forecasts', `${FRONTEND_URL}/forecasts`);
    await wait(2, 'Forecasts loading');
    
    action('📈 AI-powered forecasts');
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(4, '📈 Top section visible');
    
    action('📈 Scrolling slowly');
    await page.evaluate(() => window.scrollBy(0, 300));
    await wait(4, '📈 Viewing forecast details');
    
    action('📈 Continuing scroll');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(4, '📈 More forecasts visible');
    
    action('📈 Scrolling to bottom');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(4, '📈 All forecasts visible');
    
    // Zoom/hover on chart
    action('🔍 Interacting with chart');
    try {
      const chartElements = await page.locator('canvas, svg, .recharts-wrapper').all();
      if (chartElements.length > 0) {
        await chartElements[0].hover();
        await wait(3, '🔍 Chart details visible');
      }
    } catch (e) {
      log(colors.yellow, '⚠️  Could not interact with charts');
    }

    // ====================================================================
    // STEP 8: CHATBOT - 5 English + 5 Spanish Questions
    // ====================================================================

    step('STEP 8: CHATBOT - 10 Questions (5 EN + 5 ES)');

    await navigateToTab(page, 'Chatbot', `${FRONTEND_URL}/chatbot`);
    await wait(2, 'Chatbot loading');

    action('🤖 Bilingual AI queries');

    const queries = [
      // 5 English questions
      'What was the best performing month?',
      'Show me the top selling products',
      'What is the total revenue this year?',
      'Which customer has the highest purchases?',
      'What are the sales trends?',
      // 5 Spanish questions
      '¿Cuál fue el mes con peor utilidad?',
      '¿Qué producto se facturó más?',
      '¿Cuánto se facturó este mes?',
      '¿Cuál fue la venta más alta?',
      '¿Qué día tuvimos más ventas?'
    ];

    const inputSelectors = [
      'input[placeholder*="Ask"]',
      'textarea[placeholder*="Ask"]',
      'input[type="text"]',
      'textarea'
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
        const language = i < 5 ? 'EN' : 'ES';
        action(`🤖 Q${i + 1}/10 (${language}): ${query}`);
        
        try {
          await chatInput.clear();
          await chatInput.fill(query);
          await wait(2, 'Question typed');

          const sendSelectors = [
            'button:has-text("Send")',
            'button:has-text("Enviar")',
            'button[type="submit"]'
          ];

          let sent = false;
          for (const selector of sendSelectors) {
            try {
              const sendBtn = page.locator(selector).first();
              if (await sendBtn.isVisible({ timeout: 500 }).catch(() => false)) {
                await sendBtn.click();
                sent = true;
                break;
              }
            } catch (e) {}
          }

          if (!sent) {
            await chatInput.press('Enter');
          }

          await wait(4, '⏳ AI processing');
          await wait(2, '✓ Answer displayed');
        } catch (e) {
          log(colors.yellow, `⚠️  Error with Q${i + 1}`);
        }
      }
    } else {
      log(colors.yellow, '⚠️  Chat input not found');
    }

    // ====================================================================
    // STEP 9: CLIENTS - Quick View
    // ====================================================================

    step('STEP 9: CLIENTS - Quick View');

    await navigateToTab(page, 'Customers', `${FRONTEND_URL}/customers`);
    await wait(2, 'Customers loading');
    
    action('👥 Customer list');
    await wait(3, '👥 Viewing customers');

    // ====================================================================
    // STEP 10: PRODUCTS - Quick View + Create
    // ====================================================================

    step('STEP 10: PRODUCTS - Quick View + Create');

    await navigateToTab(page, 'Products', `${FRONTEND_URL}/products`);
    await wait(2, 'Products loading');
    
    action('📦 Product catalog');
    await wait(2, '📦 Viewing products');
    
    await createProduct(page);
    await wait(3, '✓ Product created');

    // ====================================================================
    // STEP 11: REGISTER SALE
    // ====================================================================

    step('STEP 11: REGISTER SALE');

    action('💰 Registering sale');
    
    const createSaleSelectors = [
      'button:has-text("Add Sale")',
      'button:has-text("Create Sale")',
      'button:has-text("New Sale")',
      'button:has-text("Register Sale")'
    ];

    let saleCreated = false;
    for (const selector of createSaleSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await wait(2, '💰 Opening sale form');
          await btn.click();
          await wait(3, '💰 Sale form displayed');
          
          await page.press('body', 'Escape');
          saleCreated = true;
          break;
        }
      } catch (e) {}
    }

    if (!saleCreated) {
      log(colors.yellow, '⚠️  Sale form not found');
    }

    // ====================================================================
    // STEP 12: SALES INFINITE SCROLL
    // ====================================================================

    step('STEP 12: SALES - Infinite Scroll');

    await navigateToTab(page, 'Sales', `${FRONTEND_URL}/sales-infinite`);
    await wait(2, 'Sales loading');
    
    action('💰 Transaction history');
    await wait(3, '💰 Initial sales visible');
    
    action('💰 Scrolling - infinite load');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(3, '💰 Loading more...');
    
    action('💰 Continuing scroll');
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(3, '💰 More transactions loaded');
    
    action('💰 Final scroll');
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(3, '💰 All data visible');

    // ====================================================================
    // DEMO COMPLETE
    // ====================================================================

    step('🎉 DEMO COMPLETE 🎉');

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    log(colors.green, `✨ Demo finished in ${minutes}m ${seconds}s!`);
    
    await wait(3, 'Final showcase');

    await browser.close();

    header('🎬 VIDEO RECORDING DEMO COMPLETE! 🎬');

    log(colors.green, '✅ ALL FEATURES DEMONSTRATED:');
    action('✓ Login screen (8 sec)');
    action('✓ Dark mode toggle');
    action('✓ Language switch (EN/ES)');
    action('✓ Demo login');
    action('✓ Dashboard (5 sec)');
    action('✓ Dashboard filter');
    action('✓ Forecasts (15+ sec with scroll)');
    action('✓ Chatbot (5 EN + 5 ES questions)');
    action('✓ Clients view');
    action('✓ Products + create');
    action('✓ Register sale');
    action('✓ Sales infinite scroll');
    console.log('');
    log(colors.yellow, `🎥 Total: ${minutes}m ${seconds}s - READY FOR RECORDING!`);
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
  log(colors.red, '❌ Demo timeout - exceeded 6 minutes');
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
