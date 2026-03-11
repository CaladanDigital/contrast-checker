/**
 * Colorblind preview rendering.
 * Updates simulation preview boxes with simulated colors.
 */

import { simulateColorblindness, COLORBLIND_TYPES, type ColorblindType } from '../utils/colorblindSimulation';

export function updateSimulations(fg: string, bg: string): void {
  // Normal vision
  const normalEl = document.getElementById('normalVision');
  if (normalEl) {
    normalEl.style.color = fg;
    normalEl.style.backgroundColor = bg;
    normalEl.textContent = 'Sample Text';
  }

  // Colorblind simulations
  for (const type of COLORBLIND_TYPES) {
    const el = document.getElementById(type);
    if (!el) continue;

    el.style.color = simulateColorblindness(fg, type as ColorblindType);
    el.style.backgroundColor = simulateColorblindness(bg, type as ColorblindType);
    el.textContent = 'Sample Text';
  }
}
