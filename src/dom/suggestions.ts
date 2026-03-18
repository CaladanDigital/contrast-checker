/**
 * Accessible alternative display.
 * Shows suggested color alternatives when contrast fails WCAG AA.
 * Each suggestion includes a color swatch and a button to apply the color.
 * Background suggestions update the background input; foreground suggestions update the foreground input.
 */

import { findAccessibleAlternatives, getAdvancedAlternatives, type Suggestion } from '../utils/accessibleAlternatives';

export function updateSuggestions(fg: string, bg: string, ratio: number): void {
  const section = document.getElementById('suggestionsSection');
  const list = document.getElementById('suggestionsList');
  if (!section || !list) return;

  if (ratio >= 4.5) {
    section.classList.add('hidden');
    return;
  }

  const suggestions = findAccessibleAlternatives(fg, bg, 4.5);

  if (suggestions.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');

  // Clear existing suggestions safely
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  // Build suggestions using DOM APIs (never innerHTML with user data)
  suggestions.forEach((suggestion: Suggestion) => {
    const li = document.createElement('li');
    li.className = 'suggestion-item';

    // Color swatch showing the suggested color
    const swatch = document.createElement('span');
    swatch.className = 'suggestion-swatch';
    if (suggestion.target === 'background') {
      // Show foreground text on suggested background
      swatch.style.backgroundColor = suggestion.hex;
      swatch.style.color = fg;
      swatch.textContent = 'Aa';
    } else {
      // Show suggested foreground on current background
      swatch.style.backgroundColor = bg;
      swatch.style.color = suggestion.hex;
      swatch.textContent = 'Aa';
    }
    swatch.setAttribute('aria-hidden', 'true');
    li.appendChild(swatch);

    // Label and hex value
    const labelText = document.createTextNode(suggestion.label + ': ');
    li.appendChild(labelText);

    const strong = document.createElement('strong');
    strong.textContent = suggestion.hex;
    strong.classList.add('hex-copyable');
    strong.title = 'Click to copy';
    li.appendChild(strong);

    const ratioText = document.createTextNode(` (ratio: ${suggestion.ratioFormatted})`);
    li.appendChild(ratioText);

    // Button to apply the suggested color
    const copyBtn = document.createElement('button');
    copyBtn.className = 'suggestion-copy-btn';
    copyBtn.textContent = 'Use this';

    if (suggestion.target === 'background') {
      copyBtn.setAttribute('aria-label', `Apply ${suggestion.hex} as background color`);
      copyBtn.addEventListener('click', () => {
        const bgColorInput = document.getElementById('backgroundColor') as HTMLInputElement | null;
        const bgHexInput = document.getElementById('backgroundHex') as HTMLInputElement | null;
        if (bgColorInput && bgHexInput) {
          bgColorInput.value = suggestion.hex;
          bgHexInput.value = suggestion.hex;
          bgHexInput.dispatchEvent(new Event('input', { bubbles: true }));
          const inputSection = document.getElementById('inputSection');
          if (inputSection) {
            inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    } else {
      copyBtn.setAttribute('aria-label', `Apply ${suggestion.hex} as foreground color`);
      copyBtn.addEventListener('click', () => {
        const fgColorInput = document.getElementById('foregroundColor') as HTMLInputElement | null;
        const fgHexInput = document.getElementById('foregroundHex') as HTMLInputElement | null;
        if (fgColorInput && fgHexInput) {
          fgColorInput.value = suggestion.hex;
          fgHexInput.value = suggestion.hex;
          fgHexInput.dispatchEvent(new Event('input', { bubbles: true }));
          const inputSection = document.getElementById('inputSection');
          if (inputSection) {
            inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    }
    li.appendChild(copyBtn);

    list.appendChild(li);
  });

  // Show More button for advanced suggestions
  const showMoreBtn = document.createElement('button');
  showMoreBtn.className = 'suggestion-copy-btn';
  showMoreBtn.style.marginTop = '1rem';
  showMoreBtn.textContent = 'Show More Suggestions';
  showMoreBtn.addEventListener('click', () => {
    showMoreBtn.remove();
    renderAdvancedSuggestions(list, fg, bg);
  });
  section.appendChild(showMoreBtn);
}

function renderAdvancedSuggestions(list: HTMLElement, fg: string, bg: string): void {
  const advanced = getAdvancedAlternatives(fg, bg, 4.5, 8);
  if (advanced.length === 0) return;

  const heading = document.createElement('h4');
  heading.textContent = 'More Alternatives (ranked by visual similarity)';
  heading.style.marginTop = '1rem';
  heading.style.color = '#0369a1';
  list.parentElement?.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'advanced-suggestions-grid';

  advanced.forEach((suggestion: Suggestion) => {
    const card = document.createElement('div');
    card.className = 'advanced-suggestion-card';

    const swatch = document.createElement('div');
    swatch.className = 'advanced-suggestion-swatch';
    swatch.style.backgroundColor = bg;
    swatch.style.color = suggestion.hex;
    swatch.textContent = 'Aa';

    const hex = document.createElement('div');
    hex.className = 'advanced-suggestion-hex';
    hex.textContent = suggestion.hex;

    const ratio = document.createElement('div');
    ratio.className = 'advanced-suggestion-ratio';
    ratio.textContent = suggestion.ratioFormatted;

    card.appendChild(swatch);
    card.appendChild(hex);
    card.appendChild(ratio);

    card.addEventListener('click', () => {
      const fgColorInput = document.getElementById('foregroundColor') as HTMLInputElement | null;
      const fgHexInput = document.getElementById('foregroundHex') as HTMLInputElement | null;
      if (fgColorInput && fgHexInput) {
        fgColorInput.value = suggestion.hex;
        fgHexInput.value = suggestion.hex;
        fgHexInput.dispatchEvent(new Event('input', { bubbles: true }));
        const inputSection = document.getElementById('inputSection');
        if (inputSection) inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    grid.appendChild(card);
  });

  list.parentElement?.appendChild(grid);
}
