/**
 * WCAG pass/fail badge rendering.
 */

import { type WCAGResults } from '../utils/contrastCalculation';

export function updateBadges(results: WCAGResults): void {
  const badges = document.querySelectorAll('.badge');

  badges.forEach(badge => {
    const ratioEl = badge.querySelector('.badge-ratio') as HTMLElement | null;
    if (!ratioEl) return;

    const level = ratioEl.dataset.level;
    let passes = false;

    switch (level) {
      case 'aa-normal': passes = results.aaNormal; break;
      case 'aa-large': passes = results.aaLarge; break;
      case 'aaa-normal': passes = results.aaaNormal; break;
      case 'aaa-large': passes = results.aaaLarge; break;
    }

    badge.classList.toggle('pass', passes);
    badge.classList.toggle('fail', !passes);
  });
}
