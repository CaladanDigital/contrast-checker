/**
 * Accessible alternative display.
 * Shows suggested color alternatives when contrast fails WCAG AA.
 */

import { findAccessibleAlternatives, type Suggestion } from '../utils/accessibleAlternatives';

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

    const labelText = document.createTextNode(suggestion.label + ': ');
    li.appendChild(labelText);

    const strong = document.createElement('strong');
    strong.textContent = suggestion.hex;
    li.appendChild(strong);

    const ratioText = document.createTextNode(` (ratio: ${suggestion.ratioFormatted})`);
    li.appendChild(ratioText);

    list.appendChild(li);
  });
}
