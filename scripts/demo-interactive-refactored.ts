#!/usr/bin/env node

/**
 * BusinessAI-Analytics Platform - Interactive Browser Demo (Refactored)
 * Automated 4-5 minute video recording showcasing all features
 * Uses shared demo orchestration module to reduce duplication
 */

import { Browser, Page } from 'playwright';
import {
  DemoLogger,
  DemoTiming,
  BrowserManager,
  NavigationHelper,
  UIInteractionHelper,
  ChatbotHelper,
  DemoCompletion,
  colors
} from './shared/demo-orchestrator.js';

const FRONTEND_URL = 'http://localhost:5173';
const DEMO_TIMEOUT = 360000; // 6 minutes in ms

async function tryEntityActions(page: Page, entityType: string): Promise<void> {
  try {
    const editSelectors = [
      'button:has-text("Edit")',
      'button:has-text("View")',
      `[data-testid="edit-${entityType}"]`,
      '.btn-sm'
    ];

    for (const selector of editSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          DemoLogger.action(`🔴 Clicking ${entityType} action button`);
          await DemoTiming.wait(1, '🔴 Button found');
          await btn.click();
          await DemoTiming.wait(3, `${entityType} details displayed - viewers can see the data`);
          
          // Close by pressing Escape
          await page.press('body', 'Escape');
          await DemoTiming.wait(1, 'Details closed');
          break;
        }
      } catch (e) {}
    }
  } catch (e) {
    DemoLogger.warning(`Could not perform ${entityType} operations`);
  }
}

async function runDemo(): Promise<void> {
  let browser: Browser | null = null;
  const startTime = Date.now();

  try {
    DemoLogger.header('🎬 BusinessAI-Analytics Platform - Interactive Demo');

    // ====================================================================
    // STEP 0: FULLSCREEN MODE - FIRST PRIORITY
    // ====================================================================

    DemoLogger.step('STEP 0: ENTERING FULLSCREEN MODE');

    const { browser: browserInstance, page } = await BrowserManager.setupBrowser({
      headless: false,
      viewport: { width: 1920, height: 1080 }
    });
    browser = browserInstance;
    
    await DemoTiming.wait(1.5, 'Browser ready');
    
    DemoLogger.success(`FULLSCREEN MODE ACTIVE`);
    
    // Verify fullscreen is actually working
    const isFullscreenWorking = await BrowserManager.verifyViewport(page);
    
    if (!isFullscreenWorking) {
      DemoLogger.error('ABORTING DEMO - Fullscreen not working correctly');
      await browser.close();
      process.exit(1);
    }
    
    await DemoTiming.wait(2, 'Browser ready in fullscreen');

    // ====================================================================
    // STEP 1: DASHBOARD
    // ====================================================================

    DemoLogger.step('STEP 1: DASHBOARD - Real-time Business Metrics');

    DemoLogger.log(colors.blue, `Opening: ${FRONTEND_URL}`);
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 15000 });
    
    await NavigationHelper.resetPagePosition(page);
    
    DemoLogger.action('📊 Viewing dashboard overview');
    await DemoTiming.wait(3, 'Dashboard loading and rendering');
    
    DemoLogger.action('📊 Scrolling to see all metrics');
    await page.evaluate(() => window.scrollBy(0, 400));
    await DemoTiming.wait(3, 'Viewing dashboard content - viewers can see all metrics');

    // ====================================================================
    // STEP 2: ANALYTICS & FORECASTING
    // ====================================================================

    DemoLogger.step('STEP 2: ANALYTICS & FORECASTING - AI-Powered Predictions');

    await NavigationHelper.navigateToTab(page, 'Analytics', `${FRONTEND_URL}/analytics`);
    await DemoTiming.wait(3, 'Analytics page loading');
    
    DemoLogger.action('📈 Viewing AI-powered forecast charts');
    await DemoTiming.wait(2, 'Page rendering');
    
    // Scroll to top first
    await page.evaluate(() => window.scrollTo(0, 0));
    await DemoTiming.wait(1, 'Positioned at top');
    
    // Scroll down to see forecasts - multiple scrolls for visibility
    DemoLogger.action('📈 Scrolling to reveal forecast charts');
    await page.evaluate(() => window.scrollBy(0, 500));
    await DemoTiming.wait(3, 'Forecasts visible - viewers can see predictions');
    
    DemoLogger.action('📈 Scrolling more to see all forecast details');
    await page.evaluate(() => window.scrollBy(0, 600));
    await DemoTiming.wait(3, 'Viewing detailed forecasts - viewers can see all data');
    
    DemoLogger.action('📈 Scrolling to see bottom of forecasts');
    await page.evaluate(() => window.scrollBy(0, 500));
    await DemoTiming.wait(2, 'All forecast data visible');

    // ====================================================================
    // STEP 3: CHATBOT - Business Intelligence Questions
    // ====================================================================

    DemoLogger.step('STEP 3: AI CHATBOT - Bilingual Business Intelligence');

    await NavigationHelper.navigateToTab(page, 'Chatbot', `${FRONTEND_URL}/chatbot`);
    await DemoTiming.wait(2, 'Chatbot page loading');

    DemoLogger.action('🤖 Demonstrating bilingual AI queries');
    await DemoTiming.wait(1, 'Ready to ask questions');

    // Spanish business questions
    const queries = [
      '¿Cuál fue el mes con peor utilidad?',
      '¿Qué mes estuvo más cerca de pérdida?',
      '¿Cuánto se facturó este mes?',
      '¿Cuál fue la factura o venta más alta?',
      '¿Qué producto se facturó más?',
      '¿Qué día tuvimos más ventas?'
    ];

    await ChatbotHelper.runChatbotQueries(page, queries);
    await DemoTiming.wait(2, '✓ Chatbot demo complete');

    // ====================================================================
    // STEP 4: PRODUCTS - CRUD Operations
    // ====================================================================

    DemoLogger.step('STEP 4: PRODUCTS - Inventory Management (CRUD)');

    await NavigationHelper.navigateToTab(page, 'Products', `${FRONTEND_URL}/products`);
    await DemoTiming.wait(2, 'Products page loading');
    
    DemoLogger.action('📦 Viewing product catalog');
    await DemoTiming.wait(2, 'Observing products');
    
    // Try to create a product
    await UIInteractionHelper.createEntity(page, 'Product');
    await DemoTiming.wait(3, '✓ Product creation complete - viewers can see the new product');
    
    DemoLogger.action('📦 Scrolling through product list');
    await page.evaluate(() => window.scrollBy(0, 400));
    await DemoTiming.wait(3, 'Viewing product details - viewers can see products');

    // Try to interact with product actions
    await tryEntityActions(page, 'product');

    DemoLogger.action('📦 Scrolling to see more products');
    await page.evaluate(() => window.scrollBy(0, 400));
    await DemoTiming.wait(2, 'Viewing more products');

    // ====================================================================
    // STEP 5: CUSTOMERS - Customer Management
    // ====================================================================

    DemoLogger.step('STEP 5: CUSTOMERS - Customer Segments');

    await NavigationHelper.navigateToTab(page, 'Customers', `${FRONTEND_URL}/customers`);
    await DemoTiming.wait(2, 'Customers page loading');
    
    DemoLogger.action('👥 Viewing customer segments');
    await DemoTiming.wait(2, 'Observing customer data');
    
    // Try to create a customer
    await UIInteractionHelper.createEntity(page, 'Customer');
    await DemoTiming.wait(3, '✓ Customer creation complete - viewers can see the new customer');
    
    DemoLogger.action('👥 Scrolling through customer list');
    await page.evaluate(() => window.scrollBy(0, 400));
    await DemoTiming.wait(3, 'Viewing customer details - viewers can see customers');

    // Try to interact with customer actions
    await tryEntityActions(page, 'customer');

    DemoLogger.action('👥 Scrolling to see more customers');
    await page.evaluate(() => window.scrollBy(0, 400));
    await DemoTiming.wait(2, 'Viewing more customers');

    // ====================================================================
    // STEP 6: SALES - Transaction History (Infinite Scroll)
    // ====================================================================

    DemoLogger.step('STEP 6: SALES - Transaction History (Infinite Scroll)');

    await NavigationHelper.navigateToTab(page, 'Sales', `${FRONTEND_URL}/sales-infinite`);
    await DemoTiming.wait(2, 'Sales page loading');
    
    DemoLogger.action('💰 Viewing transaction history');
    await DemoTiming.wait(2, 'Observing sales data');
    
    DemoLogger.action('💰 Scrolling through transactions');
    await page.evaluate(() => window.scrollBy(0, 400));
    await DemoTiming.wait(3, 'Viewing transaction details - viewers can see the sales');

    // Try to interact with sales actions
    await tryEntityActions(page, 'sale');

    DemoLogger.action('💰 Scrolling to see more transactions');
    await page.evaluate(() => window.scrollBy(0, 400));
    await DemoTiming.wait(2, 'Viewing more transactions');

    // ====================================================================
    // STEP 7: DOCUMENTS - Document Management
    // ====================================================================

    DemoLogger.step('STEP 7: DOCUMENTS - Document Management');

    await NavigationHelper.navigateToTab(page, 'Documents', `${FRONTEND_URL}/documents`);
    await DemoTiming.wait(2, 'Documents page loading');
    
    DemoLogger.action('📄 Viewing document uploads');
    await DemoTiming.wait(2, 'Observing documents');
    
    DemoLogger.action('📄 Scrolling through document list');
    await page.evaluate(() => window.scrollBy(0, 400));
    await DemoTiming.wait(2, 'Viewing document details - viewers can see the documents');

    // ====================================================================
    // DEMO COMPLETE
    // ====================================================================

    await browser.close();

    const demoSteps = [
      'Real-time business analytics dashboard',
      'AI-powered forecasting with PyTorch',
      'Bilingual conversational AI (6 business questions)',
      'Product inventory management (CRUD)',
      'Customer segment analysis (CRUD)',
      'Sales transaction tracking',
      'Document management system'
    ];

    DemoCompletion.logDemoSummary(startTime, demoSteps);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    DemoLogger.error(`Error: ${errorMessage}`);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Run demo with timeout
const timeoutHandle = setTimeout(() => {
  DemoLogger.error('Demo timeout - exceeded 6 minutes');
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
    DemoLogger.error(`Fatal error: ${errorMessage}`);
    process.exit(1);
  });