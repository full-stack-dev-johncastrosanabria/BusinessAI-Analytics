/**
 * Shared Demo Orchestration Utilities
 * 
 * This module provides common functionality for demo scripts to eliminate duplication:
 * - Logging and console output formatting
 * - Browser management and setup
 * - Navigation helpers
 * - UI interaction patterns
 * - Timing and flow control
 * 
 * Used by: demo-interactive.ts, demo-video-recording.ts
 */

import { Browser, Page, BrowserContext, chromium } from 'playwright';

// ─── Console Colors and Logging ──────────────────────────────────────────────

export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
};

export class DemoLogger {
  static log(color: string, message: string): void {
    console.log(`${color}${message}${colors.reset}`);
  }

  static header(title: string): void {
    console.log('');
    DemoLogger.log(colors.purple, '╔════════════════════════════════════════════════════════════╗');
    DemoLogger.log(colors.purple, `║ ${title.padEnd(60)} ║`);
    DemoLogger.log(colors.purple, '╚════════════════════════════════════════════════════════════╝');
    console.log('');
  }

  static step(title: string): void {
    DemoLogger.log(colors.cyan, `\n📋 ${title}\n`);
  }

  static action(message: string): void {
    DemoLogger.log(colors.green, `  ▶ ${message}`);
  }

  static success(message: string): void {
    DemoLogger.log(colors.green, `✅ ${message}`);
  }

  static warning(message: string): void {
    DemoLogger.log(colors.yellow, `⚠️ ${message}`);
  }

  static error(message: string): void {
    DemoLogger.log(colors.red, `❌ ${message}`);
  }
}

// ─── Timing and Flow Control ─────────────────────────────────────────────────

export class DemoTiming {
  static async wait(seconds: number, message: string = 'Waiting'): Promise<void> {
    DemoLogger.log(colors.yellow, `⏳ ${message} (${seconds}s)`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  static async smoothScroll(page: Page, distance: number, duration: number = 1500): Promise<void> {
    await page.evaluate(async ({ distance, duration }) => {
      const start = globalThis.scrollY;
      const startTime = Date.now();
      
      const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      
      const scroll = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutQuad(progress);
        
        globalThis.scrollTo(0, start + distance * eased);
        
        if (progress < 1) {
          requestAnimationFrame(scroll);
        }
      };
      
      scroll();
      await new Promise(resolve => setTimeout(resolve, duration));
    }, { distance, duration }); // NOSONAR S4721 - Hardcoded scrolling animation for demo
  }

  static formatDuration(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// ─── Browser Management ──────────────────────────────────────────────────────

export class BrowserManager {
  static async launchBrowser(headless: boolean = false): Promise<Browser> {
    DemoLogger.log(colors.blue, '🌐 Launching browser...');
    
    return await chromium.launch({ 
      headless,
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
  }

  static async createContext(browser: Browser, viewport = { width: 1920, height: 1080 }): Promise<BrowserContext> {
    DemoLogger.log(colors.blue, `📱 Creating browser context with ${viewport.width}x${viewport.height} viewport...`);
    
    return await browser.newContext({
      viewport,
      ignoreHTTPSErrors: true,
      deviceScaleFactor: 1,
    });
  }

  static async setupFullscreen(page: Page): Promise<void> {
    DemoLogger.log(colors.blue, '🖥️ Setting up fullscreen mode...');
    
    await page.evaluate(() => { // NOSONAR S4721 - Hardcoded CSS reset for demo fullscreen
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
      globalThis.scrollTo(0, 0);
    });
    
    await page.waitForTimeout(1500);
    DemoLogger.success('Fullscreen mode active');
  }
}

// ─── Navigation Helpers ──────────────────────────────────────────────────────

export class NavigationHelper {
  static async navigateToTab(page: Page, tabName: string, url?: string): Promise<boolean> {
    try {
      DemoLogger.action(`Navigating to ${tabName}`);
      
      const selectors = [
        `a:has-text("${tabName}")`,
        `button:has-text("${tabName}")`,
        `[role="tab"]:has-text("${tabName}")`,
        `text=${tabName}`
      ];

      let found = false;
      for (const selector of selectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click();
            found = true;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!found && url) {
        DemoLogger.warning(`Tab "${tabName}" not found, navigating directly to ${url}`);
        await page.goto(url);
        found = true;
      }

      if (found) {
        await page.waitForTimeout(2000);
        DemoLogger.success(`Successfully navigated to ${tabName}`);
      } else {
        DemoLogger.error(`Failed to navigate to ${tabName}`);
      }

      return found;
    } catch (error) {
      DemoLogger.error(`Navigation to ${tabName} failed: ${error}`);
      return false;
    }
  }

  static async waitForPageLoad(page: Page, url: string, timeout: number = 30000): Promise<void> {
    DemoLogger.action(`Loading ${url}...`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout });
    await page.waitForLoadState('domcontentloaded');
    
    DemoLogger.success('Page loaded successfully');
  }
}

// ─── UI Interaction Helpers ──────────────────────────────────────────────────

export class UIInteractionHelper {
  static async toggleDarkMode(page: Page): Promise<void> {
    DemoLogger.action('Testing dark mode toggle');
    
    const darkModeSelectors = [
      '[data-testid="theme-toggle"]',
      'button[aria-label*="theme"]',
      'button[aria-label*="dark"]',
      '.theme-toggle',
      '[role="switch"]'
    ];

    for (const selector of darkModeSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          await DemoTiming.wait(2, 'Observing theme change');
          DemoLogger.success('Dark mode toggled');
          return;
        }
      } catch {
        continue;
      }
    }
    
    DemoLogger.warning('Dark mode toggle not found');
  }

  static async switchLanguage(page: Page, language: string = 'Español'): Promise<void> {
    DemoLogger.action(`Switching language to ${language}`);
    
    const languageSelectors = [
      `button:has-text("${language}")`,
      `[data-testid="language-toggle"]`,
      '.language-selector',
      '[aria-label*="language"]'
    ];

    for (const selector of languageSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          await DemoTiming.wait(2, 'Observing language change');
          DemoLogger.success(`Language switched to ${language}`);
          return;
        }
      } catch {
        continue;
      }
    }
    
    DemoLogger.warning(`Language switch to ${language} not found`);
  }

  static async performLogin(page: Page, email: string = 'demo@businessai.com', password: string = 'demo123'): Promise<void> {
    DemoLogger.action('Performing demo login');
    
    try {
      // Fill email
      const emailInput = page.locator('input[type="email"], input[name="email"], #email');
      await emailInput.fill(email);
      await DemoTiming.wait(1, 'Typing email');

      // Fill password
      const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
      await passwordInput.fill(password);
      await DemoTiming.wait(1, 'Typing password');

      // Click login button
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      await loginButton.click();
      
      await DemoTiming.wait(3, 'Logging in');
      DemoLogger.success('Login completed');
    } catch (error) {
      DemoLogger.error(`Login failed: ${error}`);
    }
  }
}

// ─── Chatbot Interaction Helpers ─────────────────────────────────────────────

export class ChatbotHelper {
  static readonly DEMO_QUESTIONS = {
    english: [
      "What was the best performing month?",
      "Show me the top selling products",
      "What is the total revenue?",
      "Which customer segment is most profitable?",
      "What are the cost trends?"
    ],
    spanish: [
      "¿Cuál fue el mes con mejor rendimiento?",
      "¿Qué productos se vendieron más?",
      "¿Cuál es el ingreso total?",
      "¿Qué segmento de clientes es más rentable?",
      "¿Cuáles son las tendencias de costos?"
    ]
  };

  static async askQuestion(page: Page, question: string): Promise<void> {
    DemoLogger.action(`Asking: "${question}"`);
    
    try {
      const inputSelectors = [
        'input[placeholder*="question"]',
        'input[placeholder*="Ask"]',
        'textarea[placeholder*="question"]',
        '.chatbot-input input',
        '#chatbot-input'
      ];

      let inputFound = false;
      for (const selector of inputSelectors) {
        try {
          const input = page.locator(selector).first();
          if (await input.isVisible({ timeout: 2000 })) {
            await input.fill(question);
            await input.press('Enter');
            inputFound = true;
            break;
          }
        } catch {
          continue;
        }
      }

      if (inputFound) {
        await DemoTiming.wait(3, 'Waiting for AI response');
        DemoLogger.success('Question submitted and response received');
      } else {
        DemoLogger.warning('Chatbot input not found');
      }
    } catch (error) {
      DemoLogger.error(`Failed to ask question: ${error}`);
    }
  }

  static async runQuestionSequence(page: Page, questions: string[], delayBetween: number = 4): Promise<void> {
    for (let i = 0; i < questions.length; i++) {
      await this.askQuestion(page, questions[i]);
      if (i < questions.length - 1) {
        await DemoTiming.wait(delayBetween, 'Pausing between questions');
      }
    }
  }
}

// ─── Demo Completion and Reporting ───────────────────────────────────────────

export class DemoCompletion {
  static reportSuccess(startTime: number, totalSteps: number): void {
    const duration = Date.now() - startTime;
    const formattedDuration = DemoTiming.formatDuration(duration);
    
    DemoLogger.header('🎉 DEMO COMPLETED SUCCESSFULLY');
    DemoLogger.success(`Total duration: ${formattedDuration}`);
    DemoLogger.success(`Completed ${totalSteps} steps`);
    DemoLogger.success('All features demonstrated successfully');
  }

  static reportError(error: any, startTime: number): void {
    const duration = Date.now() - startTime;
    const formattedDuration = DemoTiming.formatDuration(duration);
    
    DemoLogger.header('❌ DEMO FAILED');
    DemoLogger.error(`Duration before failure: ${formattedDuration}`);
    DemoLogger.error(`Error: ${error.message || error}`);
  }

  static async cleanup(browser: Browser | null): Promise<void> {
    if (browser) {
      DemoLogger.action('Cleaning up browser...');
      await browser.close();
      DemoLogger.success('Browser closed');
    }
  }
}

// ─── Exported Convenience Functions ──────────────────────────────────────────

// Re-export commonly used functions for backward compatibility
export const log = DemoLogger.log;
export const header = DemoLogger.header;
export const step = DemoLogger.step;
export const action = DemoLogger.action;
export const wait = DemoTiming.wait;
export const smoothScroll = DemoTiming.smoothScroll;
export const navigateToTab = NavigationHelper.navigateToTab;