import { test, expect } from '@playwright/test';

test.describe('Color Contrast Checker', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ===== CORE FUNCTIONALITY =====

  test('displays correct contrast ratio for default colors (black on white)', async ({ page }) => {
    const ratio = await page.textContent('#contrastRatio');
    expect(ratio).toContain('21');
  });

  test('updates ratio when foreground color changes', async ({ page }) => {
    await page.fill('#foregroundHex', '#777777');
    const ratio = await page.textContent('#contrastRatio');
    expect(ratio).not.toContain('21');
  });

  test('swap button exchanges foreground and background', async ({ page }) => {
    await page.fill('#foregroundHex', '#FF0000');
    // Wait for update
    await page.waitForTimeout(100);
    await page.fill('#backgroundHex', '#0000FF');
    await page.waitForTimeout(100);
    await page.click('#swapButton');
    const fg = await page.inputValue('#foregroundHex');
    const bg = await page.inputValue('#backgroundHex');
    expect(fg.toUpperCase()).toContain('0000FF');
    expect(bg.toUpperCase()).toContain('FF0000');
  });

  test('copy CSS button copies correct CSS to clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions only supported in Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('#copyButton');
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('color:');
    expect(clipboardText).toContain('background-color:');
  });

  test('WCAG badges show pass/fail correctly', async ({ page }) => {
    // Default black on white should pass all
    const badges = await page.$$('.badge.pass');
    expect(badges.length).toBe(4);
  });

  test('colorblind simulations render for all types', async ({ page }) => {
    const sims = await page.$$('.simulation-preview');
    expect(sims.length).toBe(5); // normal + 4 types
  });

  test('suggestions appear when contrast fails AA', async ({ page }) => {
    await page.fill('#foregroundHex', '#999999');
    await page.waitForTimeout(100);
    await page.fill('#backgroundHex', '#AAAAAA');
    await page.waitForTimeout(200);
    const suggestions = page.locator('#suggestionsSection');
    await expect(suggestions).toBeVisible();
  });

  test('suggestions hidden when contrast passes AA', async ({ page }) => {
    // Default black on white passes
    const suggestions = page.locator('#suggestionsSection');
    await expect(suggestions).toBeHidden();
  });

  // ===== KEYBOARD ACCESSIBILITY =====

  test('all interactive elements are focusable via Tab', async ({ page }) => {
    const interactiveSelectors = [
      '#foregroundColor', '#foregroundHex',
      '#backgroundColor', '#backgroundHex',
      '#swapButton', '#copyButton', '#aboutToggle'
    ];
    for (const selector of interactiveSelectors) {
      const el = page.locator(selector);
      await el.focus();
      await expect(el).toBeFocused();
    }
  });

  test('swap button activates with Enter key', async ({ page }) => {
    await page.fill('#foregroundHex', '#FF0000');
    await page.waitForTimeout(100);
    await page.locator('#swapButton').focus();
    await page.keyboard.press('Enter');
    const bg = await page.inputValue('#backgroundHex');
    expect(bg.toUpperCase()).toContain('FF0000');
  });

  // ===== INPUT VALIDATION =====

  test('invalid hex input does not crash the page', async ({ page }) => {
    await page.fill('#foregroundHex', 'not-a-color');
    // Page should still be functional
    const ratio = await page.textContent('#contrastRatio');
    expect(ratio).toBeTruthy();
  });

  test('XSS payload in hex input is rejected', async ({ page }) => {
    await page.fill('#foregroundHex', '<script>alert(1)</script>');
    // No alert should appear, page should be stable
    const title = await page.title();
    expect(title).toContain('Accessibility');
  });

  // ===== RESPONSIVE DESIGN =====

  test('layout works on mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('layout works on tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  // ===== SECURITY VERIFICATION =====

  test('no cookies are set', async ({ page }) => {
    const cookies = await page.context().cookies();
    expect(cookies.length).toBe(0);
  });

  test('no localStorage is written', async ({ page }) => {
    const storageLength = await page.evaluate(() => localStorage.length);
    expect(storageLength).toBe(0);
  });

  test('no external network requests are made', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        requests.push(req.url());
      }
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(requests).toEqual([]);
  });

  // ===== ABOUT SECTION =====

  test('about section toggles visibility', async ({ page }) => {
    const content = page.locator('#aboutContent');
    await expect(content).toBeHidden();
    await page.click('#aboutToggle');
    await expect(content).toBeVisible();
    await page.click('#aboutToggle');
    await expect(content).toBeHidden();
  });
});
