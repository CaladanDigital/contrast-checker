/**
 * Entry point: imports all modules, wires up DOM events, runs initial update.
 */
import './styles/main.css';
import { getContrastRatio, formatRatio, checkWCAGCompliance } from './utils/contrastCalculation';
import { getInputElements, setupInputListeners } from './dom/inputs';
import { updatePreview, updateMiniPreview } from './dom/preview';
import { updateBadges } from './dom/badges';
import { updateSimulations } from './dom/simulations';
import { updateSuggestions } from './dom/suggestions';
import { readColorsFromHash, writeColorsToHash, setupShareButton } from './dom/hashSync';
import { setupEyeDroppers } from './dom/eyedropper';
import { getHSLSliderElements, setupHSLSliders, syncHSLSliders } from './dom/hslSliders';
import { setupCopyableHex } from './dom/copyHex';
import { setupLicenseUI } from './dom/license';
import { onProStatusChange } from './utils/proGate';
import { setupProUpgrade } from './dom/proUpgrade';
import { setupBatchPalette } from './dom/batchPalette';
import { setupPdfExport } from './dom/pdfExport';
import { setupSavedPalettes } from './dom/savedPalettes';
import { setupLiveView } from './dom/liveView';

function init(): void {
  const elements = getInputElements();
  const sliderEls = getHSLSliderElements();

  // Hero elements
  const heroPreviewSwatch = document.getElementById('heroPreviewSwatch') as HTMLElement | null;
  const heroPreviewText = document.getElementById('heroPreviewText') as HTMLElement | null;
  const heroPreviewRatio = document.getElementById('heroPreviewRatio') as HTMLElement | null;
  const heroPreviewBox = document.getElementById('heroPreviewBox') as HTMLElement | null;

  // Seed inputs from URL hash if present
  const hashColors = readColorsFromHash();
  if (hashColors) {
    elements.fgHex.value = hashColors.fg;
    elements.fgColor.value = hashColors.fg;
    elements.bgHex.value = hashColors.bg;
    elements.bgColor.value = hashColors.bg;
  }

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

    // Update mini preview
    updateMiniPreview(fg, bg);

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

    // Sync HSL sliders
    syncHSLSliders(sliderEls, fg, bg);

    // Sync URL hash
    writeColorsToHash(fg, bg);
  }

  // Set up input event listeners
  setupInputListeners(elements, updateAll);

  // Set up HSL sliders
  setupHSLSliders(sliderEls, elements, updateAll);

  // Set up click-to-copy hex codes
  setupCopyableHex();

  // Hero preview box click: scroll to full live preview section
  if (heroPreviewBox) {
    heroPreviewBox.addEventListener('click', () => {
      const previewSection = document.getElementById('previewSection');
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Share button
  setupShareButton();

  // Bookmark CTA
  const bookmarkBtn = document.getElementById('bookmarkBtn');
  const bookmarkToast = document.getElementById('bookmarkToast');
  if (bookmarkBtn && bookmarkToast) {
    bookmarkBtn.addEventListener('click', () => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const shortcut = isMac ? '\u2318+D' : 'Ctrl+D';
      bookmarkToast.textContent = `Press ${shortcut} to bookmark this page`;
      bookmarkToast.classList.add('show');
      setTimeout(() => bookmarkToast.classList.remove('show'), 3000);
    });
  }

  // Eye dropper (progressive enhancement)
  setupEyeDroppers(elements, updateAll);

  // Pro features
  setupLicenseUI();
  setupProUpgrade();
  setupBatchPalette();
  setupPdfExport();
  setupSavedPalettes();
  setupLiveView();

  // Re-render Pro-gated sections when license status changes
  onProStatusChange(() => updateAll());

  // Initial update
  updateAll();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
