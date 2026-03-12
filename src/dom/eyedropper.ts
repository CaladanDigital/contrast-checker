/**
 * EyeDropper API progressive enhancement.
 * Only renders buttons in browsers that support the API (Chromium).
 */

import { validateHex } from '../utils/colorValidation';
import type { ColorInputElements } from './inputs';

export function setupEyeDroppers(
  elements: ColorInputElements,
  onUpdate: () => void
): void {
  if (!('EyeDropper' in window)) return;

  const pairs: Array<{ color: HTMLInputElement; hex: HTMLInputElement }> = [
    { color: elements.fgColor, hex: elements.fgHex },
    { color: elements.bgColor, hex: elements.bgHex },
  ];

  for (const { color, hex } of pairs) {
    const wrapper = color.closest('.input-wrapper');
    if (!wrapper) continue;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'eyedropper-btn';
    btn.setAttribute('aria-label', 'Pick color from screen');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22l1-1h3l9-9"/><path d="M3 21v-3l9-9"/><circle cx="17.5" cy="6.5" r="3.5"/></svg>';

    btn.addEventListener('click', async () => {
      try {
        const dropper = new EyeDropper();
        const result = await dropper.open();
        const validated = validateHex(result.sRGBHex);
        if (validated) {
          color.value = validated;
          hex.value = validated;
          onUpdate();
        }
      } catch {
        // User cancelled or API error — do nothing
      }
    });

    wrapper.appendChild(btn);
  }
}
