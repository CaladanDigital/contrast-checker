/**
 * Entry point: imports all modules, wires up DOM events, runs initial update.
 */
import './styles/main.css';
import { getContrastRatio, formatRatio, checkWCAGCompliance } from './utils/contrastCalculation';
import { getInputElements, setupInputListeners } from './dom/inputs';
import { updatePreview } from './dom/preview';
import { updateBadges } from './dom/badges';
import { updateSimulations } from './dom/simulations';
import { updateSuggestions } from './dom/suggestions';

function init(): void {
  const elements = getInputElements();

  // Hero elements
  const heroPreviewSwatch = document.getElementById('heroPreviewSwatch') as HTMLElement | null;
  const heroPreviewText = document.getElementById('heroPreviewText') as HTMLElement | null;
  const heroPreviewRatio = document.getElementById('heroPreviewRatio') as HTMLElement | null;
  const heroCtaBtn = document.getElementById('heroCtaBtn') as HTMLButtonElement | null;
  const heroPreviewBox = document.getElementById('heroPreviewBox') as HTMLElement | null;
  const miniPreview = document.getElementById('miniPreview') as HTMLElement | null;

  function updateAll(): void {
    const fg = elements.fgHex.value;
    const bg = elements.bgHex.value;
    const ratio = getContrastRatio(fg, bg);

    // Update contrast ratio display
    const ratioDisplay = document.getElementById('contrastRatio');
    if (ratioDisplay) {
      ratioDisplay.textContent = formatRatio(ratio);
    }

    // Update WCAG badges
    const results = checkWCAGCompliance(ratio);
    updateBadges(results);

    // Update live preview
    updatePreview(fg, bg);

    // Update colorblind simulations
    updateSimulations(fg, bg);

    // Update suggestions
    updateSuggestions(fg, bg, ratio);

    // Update hero preview swatch
    if (heroPreviewSwatch && heroPreviewText && heroPreviewRatio) {
      heroPreviewSwatch.style.backgroundColor = bg;
      heroPreviewSwatch.style.color = fg;
      heroPreviewText.textContent = 'Aa';
      heroPreviewRatio.textContent = formatRatio(ratio);
    }
  }

  // Set up input event listeners
  setupInputListeners(elements, updateAll);

  // CTA button: focus foreground hex input and scroll to input section
  if (heroCtaBtn) {
    heroCtaBtn.addEventListener('click', () => {
      const inputSection = document.getElementById('inputSection');
      if (inputSection) {
        inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setTimeout(() => {
        elements.fgHex.focus();
        elements.fgHex.select();
      }, 400);
    });
  }

  // Hero preview box click: scroll to full live preview section
  if (heroPreviewBox) {
    heroPreviewBox.addEventListener('click', () => {
      const previewSection = document.getElementById('previewSection');
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Mini-preview click: scroll to full live preview section
  if (miniPreview) {
    miniPreview.addEventListener('click', () => {
      const previewSection = document.getElementById('previewSection');
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Initial update
  updateAll();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
