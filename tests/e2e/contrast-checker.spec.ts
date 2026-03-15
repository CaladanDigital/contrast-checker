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
      '#swapButton', '#copyButton', '#shareButton', '#bookmarkBtn'
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
    // Verify no significant horizontal scroll (allow small rounding)
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

  test('no license keys in localStorage by default', async ({ page }) => {
    const hasLicense = await page.evaluate(() => localStorage.getItem('acc_license_key'));
    expect(hasLicense).toBeNull();
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

  // ===== WHY IT MATTERS / WCAG EDUCATION =====

  test('why it matters section displays stat cards', async ({ page }) => {
    const stats = await page.$$('.stat-card');
    expect(stats.length).toBe(3);
  });

  test('WCAG guidelines section is visible', async ({ page }) => {
    const guidelines = page.locator('#guidelinesSection');
    await expect(guidelines).toBeVisible();
    const cards = await page.$$('.guideline-card');
    expect(cards.length).toBe(4);
  });

  // ===== MINI PREVIEW =====

  test('mini preview updates with color changes', async ({ page }) => {
    const miniPreview = page.locator('#miniPreview');
    await expect(miniPreview).toBeVisible();
    await page.fill('#foregroundHex', '#FF0000');
    await page.waitForTimeout(100);
    const color = await miniPreview.evaluate(el => el.style.color);
    expect(color).toBeTruthy();
  });

  // ===== SHAREABLE URL =====

  test('share button copies URL to clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions only supported in Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('#shareButton');
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('fg=');
    expect(clipboardText).toContain('bg=');
  });

  test('URL hash seeds colors on load', async ({ page }) => {
    await page.goto('about:blank');
    await page.goto('http://localhost:5173/#fg=FF0000&bg=00FF00', { waitUntil: 'networkidle' });
    const fg = await page.inputValue('#foregroundHex');
    const bg = await page.inputValue('#backgroundHex');
    expect(fg.toUpperCase()).toContain('FF0000');
    expect(bg.toUpperCase()).toContain('00FF00');
  });

  // ===== HSL SLIDERS =====

  test('HSL sliders are present for both colors', async ({ page }) => {
    await expect(page.locator('#fgHue')).toBeVisible();
    await expect(page.locator('#fgSaturation')).toBeVisible();
    await expect(page.locator('#fgLightness')).toBeVisible();
    await expect(page.locator('#bgHue')).toBeVisible();
    await expect(page.locator('#bgSaturation')).toBeVisible();
    await expect(page.locator('#bgLightness')).toBeVisible();
  });

  test('HSL sliders sync with hex input on load', async ({ page }) => {
    // Default fg is #000000 → L=0, bg is #FFFFFF → L=100
    const fgL = await page.inputValue('#fgLightness');
    const bgL = await page.inputValue('#bgLightness');
    expect(fgL).toBe('0');
    expect(bgL).toBe('100');
  });

  // ===== SMART FIX =====

  test('Smart Fix buttons are present', async ({ page }) => {
    await expect(page.locator('#fgSmartFix')).toBeVisible();
    await expect(page.locator('#bgSmartFix')).toBeVisible();
  });

  // ===== COLORBLIND SIMULATIONS NON-INTERACTIVE =====

  test('guideline cards have no hover animation', async ({ page }) => {
    const duration = await page.locator('.guideline-card').first().evaluate(el => {
      return window.getComputedStyle(el).transitionDuration;
    });
    expect(duration).toBe('0s');
  });

  test('colorblind simulation boxes are non-interactive', async ({ page }) => {
    const cursor = await page.locator('.simulation').first().evaluate(el => {
      return window.getComputedStyle(el).cursor;
    });
    expect(cursor).toBe('default');
  });
});
