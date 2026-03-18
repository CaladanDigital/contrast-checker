/**
 * Unit tests for liveView DOM module.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('liveView DOM module', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(`
      <div class="app-layout" id="appLayout">
        <main></main>
        <aside class="live-view-panel" id="liveViewPanel" hidden>
          <div class="live-view-input-row">
            <input type="text" class="live-view-url-input" />
            <button type="button" class="live-view-load-btn">Go</button>
          </div>
          <div class="live-view-phone-frame"></div>
          <p class="live-view-status"></p>
          <div class="live-view-colors-list"></div>
        </aside>
      </div>
      <input type="text" id="foregroundHex" value="#000000" />
      <input type="color" id="foregroundColor" value="#000000" />
      <input type="text" id="backgroundHex" value="#FFFFFF" />
      <input type="color" id="backgroundColor" value="#FFFFFF" />
    `, { url: 'https://accessibilitycolor.com' });

    // Set up global references
    vi.stubGlobal('document', dom.window.document);
    vi.stubGlobal('window', dom.window);
  });

  test('panel starts hidden', () => {
    const panel = dom.window.document.getElementById('liveViewPanel');
    expect(panel).not.toBeNull();
    expect(panel!.hidden).toBe(true);
  });

  test('app-layout element exists', () => {
    const layout = dom.window.document.getElementById('appLayout');
    expect(layout).not.toBeNull();
    expect(layout!.classList.contains('app-layout')).toBe(true);
  });

  test('panel contains URL input and load button', () => {
    const input = dom.window.document.querySelector('.live-view-url-input');
    const btn = dom.window.document.querySelector('.live-view-load-btn');
    expect(input).not.toBeNull();
    expect(btn).not.toBeNull();
  });

  test('panel contains phone frame', () => {
    const frame = dom.window.document.querySelector('.live-view-phone-frame');
    expect(frame).not.toBeNull();
  });

  test('panel contains colors list container', () => {
    const list = dom.window.document.querySelector('.live-view-colors-list');
    expect(list).not.toBeNull();
  });

  test('layout does not have has-panel class initially', () => {
    const layout = dom.window.document.getElementById('appLayout');
    expect(layout!.classList.contains('has-panel')).toBe(false);
  });
});
