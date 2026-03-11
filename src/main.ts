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
  const aboutToggle = document.getElementById('aboutToggle');
  const aboutContent = document.getElementById('aboutContent');

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
  }

  // Set up input event listeners
  setupInputListeners(elements, updateAll);

  // About section toggle
  if (aboutToggle && aboutContent) {
    aboutToggle.addEventListener('click', () => {
      aboutContent.classList.toggle('show');
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
