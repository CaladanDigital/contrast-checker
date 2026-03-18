/**
 * Live View panel: Pro users enter a URL to see a site preview + extracted dominant colors.
 * Clicking a color swatch sets the foreground picker; shift+click sets background.
 */

import { isPro, onProStatusChange } from '../utils/proGate';

export function setupLiveView(): void {
  const panel = document.getElementById('liveViewPanel') as HTMLElement | null;
  const layout = document.getElementById('appLayout') as HTMLElement | null;
  if (!panel || !layout) return;

  const urlInput = panel.querySelector<HTMLInputElement>('.live-view-url-input');
  const loadBtn = panel.querySelector<HTMLButtonElement>('.live-view-load-btn');
  const phoneFrame = panel.querySelector<HTMLElement>('.live-view-phone-frame');
  const colorsList = panel.querySelector<HTMLElement>('.live-view-colors-list');
  const statusEl = panel.querySelector<HTMLElement>('.live-view-status');

  if (!urlInput || !loadBtn || !phoneFrame || !colorsList || !statusEl) return;

  function showPanel(): void {
    panel!.hidden = false;
    layout!.classList.add('has-panel');
  }

  function hidePanel(): void {
    panel!.hidden = true;
    layout!.classList.remove('has-panel');
  }

  function updateVisibility(): void {
    if (isPro()) {
      showPanel();
    } else {
      hidePanel();
    }
  }

  // React to Pro status changes
  onProStatusChange(() => updateVisibility());
  updateVisibility();

  /** Normalize URL input to include protocol. */
  function normalizeUrl(input: string): string | null {
    let value = input.trim();
    if (!value) return null;
    if (!/^https?:\/\//i.test(value)) {
      value = 'https://' + value;
    }
    try {
      new URL(value);
      return value;
    } catch {
      return null;
    }
  }

  async function loadSite(): Promise<void> {
    const url = normalizeUrl(urlInput!.value);
    if (!url) {
      statusEl!.textContent = 'Please enter a valid URL.';
      statusEl!.className = 'live-view-status live-view-status--error';
      return;
    }

    // Show loading state
    statusEl!.textContent = 'Loading...';
    statusEl!.className = 'live-view-status live-view-status--loading';
    colorsList!.innerHTML = '';
    loadBtn!.disabled = true;

    // Clear phone frame (remove placeholder, old iframe, old fallback)
    while (phoneFrame!.firstChild) phoneFrame!.removeChild(phoneFrame!.firstChild);

    // Load iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'live-view-iframe';
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute('title', 'Site preview');
    iframe.src = url;
    phoneFrame!.appendChild(iframe);

    // Detect iframe load failure with timeout
    let loaded = false;
    iframe.addEventListener('load', () => { loaded = true; });
    setTimeout(() => {
      if (!loaded) {
        const fb = document.createElement('div');
        fb.className = 'live-view-fallback';
        fb.textContent = 'Preview unavailable for this site';
        phoneFrame!.appendChild(fb);
      }
    }, 5000);

    // Fetch colors from API
    try {
      const resp = await fetch('/api/extract-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await resp.json();

      if (data.colors && data.colors.length > 0) {
        renderColors(data.colors);
        statusEl!.textContent = `${data.colors.length} colors detected`;
        statusEl!.className = 'live-view-status live-view-status--success';
      } else {
        statusEl!.textContent = data.error || 'No colors found.';
        statusEl!.className = 'live-view-status live-view-status--error';
      }
    } catch {
      statusEl!.textContent = 'Failed to extract colors.';
      statusEl!.className = 'live-view-status live-view-status--error';
    } finally {
      loadBtn!.disabled = false;
    }
  }

  function renderColors(colors: Array<{ hex: string; frequency: number }>): void {
    while (colorsList!.firstChild) colorsList!.removeChild(colorsList!.firstChild);

    for (const color of colors) {
      const item = document.createElement('button');
      item.className = 'live-view-color-item';
      item.type = 'button';
      item.setAttribute('aria-label', `Use color ${color.hex}. Click for foreground, Shift+click for background.`);

      const swatch = document.createElement('span');
      swatch.className = 'live-view-swatch';
      swatch.style.backgroundColor = color.hex;

      const hex = document.createElement('span');
      hex.className = 'live-view-hex';
      hex.textContent = color.hex;

      const hint = document.createElement('span');
      hint.className = 'live-view-hint';
      hint.textContent = 'click = fg · shift = bg';

      item.appendChild(swatch);
      item.appendChild(hex);
      item.appendChild(hint);

      item.addEventListener('click', (e) => {
        const isShift = (e as MouseEvent).shiftKey;
        applyColor(color.hex, isShift);
      });

      colorsList!.appendChild(item);
    }
  }

  function applyColor(hex: string, isBackground: boolean): void {
    const targetHex = isBackground
      ? document.getElementById('backgroundHex') as HTMLInputElement | null
      : document.getElementById('foregroundHex') as HTMLInputElement | null;
    const targetColor = isBackground
      ? document.getElementById('backgroundColor') as HTMLInputElement | null
      : document.getElementById('foregroundColor') as HTMLInputElement | null;

    if (targetHex) {
      targetHex.value = hex;
      targetHex.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (targetColor) {
      targetColor.value = hex;
      targetColor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Event listeners
  loadBtn.addEventListener('click', loadSite);
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadSite();
  });
}
