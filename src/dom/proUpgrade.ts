/**
 * Pro upgrade CTAs: inline gates, pricing section interaction, session nudge banner.
 */

import { isPro, onProStatusChange } from '../utils/proGate';

const SESSION_KEY_USES = 'acc_tool_uses';
const SESSION_KEY_NUDGE_DISMISSED = 'acc_nudge_dismissed';

/** Track tool usage and show nudge after 3+ uses for free users. */
function trackUsage(): void {
  if (isPro()) return;
  try {
    const current = parseInt(sessionStorage.getItem(SESSION_KEY_USES) || '0', 10);
    sessionStorage.setItem(SESSION_KEY_USES, String(current + 1));
    if (current + 1 >= 3 && !sessionStorage.getItem(SESSION_KEY_NUDGE_DISMISSED)) {
      showNudgeBanner();
    }
  } catch {
    // sessionStorage unavailable
  }
}

function showNudgeBanner(): void {
  if (document.getElementById('nudgeBanner')) return;

  const banner = document.createElement('div');
  banner.className = 'nudge-banner';
  banner.id = 'nudgeBanner';

  const text = document.createElement('span');
  text.textContent = 'Need batch checking or PDF reports? ';

  const link = document.createElement('a');
  link.href = '#pricingSection';
  link.textContent = 'See Pro features';
  link.addEventListener('click', () => banner.remove());

  const dismiss = document.createElement('button');
  dismiss.className = 'nudge-dismiss';
  dismiss.textContent = '\u00D7';
  dismiss.setAttribute('aria-label', 'Dismiss');
  dismiss.addEventListener('click', () => {
    banner.remove();
    try { sessionStorage.setItem(SESSION_KEY_NUDGE_DISMISSED, '1'); } catch { /* */ }
  });

  banner.appendChild(text);
  banner.appendChild(link);
  banner.appendChild(dismiss);
  document.body.appendChild(banner);
}

/** Render an inline upgrade CTA that replaces a feature. */
export function renderUpgradeCTA(container: HTMLElement, featureName: string): void {
  while (container.firstChild) container.removeChild(container.firstChild);

  const cta = document.createElement('div');
  cta.className = 'upgrade-cta-inline';

  const p = document.createElement('p');
  p.textContent = `${featureName} is a Pro feature. Upgrade to unlock it.`;

  const btn = document.createElement('button');
  btn.className = 'upgrade-cta-btn';
  btn.textContent = 'Upgrade to Pro';
  btn.addEventListener('click', () => {
    const pricing = document.getElementById('pricingSection');
    if (pricing) pricing.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  cta.appendChild(p);
  cta.appendChild(btn);
  container.appendChild(cta);
}

/** Set up pricing section CTA button and session nudge tracking. */
export function setupProUpgrade(): void {
  // Pricing CTA button → opens license modal
  const pricingBtn = document.getElementById('pricingUpgradeBtn');
  if (pricingBtn) {
    pricingBtn.addEventListener('click', () => {
      const badge = document.getElementById('proBadge');
      if (badge) badge.click();
    });

    onProStatusChange((active) => {
      if (active) {
        pricingBtn.textContent = 'Pro Active';
        pricingBtn.setAttribute('disabled', '');
      } else {
        pricingBtn.textContent = 'Upgrade to Pro';
        pricingBtn.removeAttribute('disabled');
      }
    });
  }

  // Set up the nudge removal on pro activation
  onProStatusChange((active) => {
    if (active) {
      const nudge = document.getElementById('nudgeBanner');
      if (nudge) nudge.remove();
    }
  });
}

/** Call this from updateAll to track tool usage. */
export function trackToolUsage(): void {
  trackUsage();
}
