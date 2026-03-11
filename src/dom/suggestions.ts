/**
 *  * Accessible alternative display.
  * Shows suggested color alternatives when contrast fails WCAG AA.
   * Each suggestion includes a color swatch and a copy button to apply the color.
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
                                                            li.className = 'suggestion-item';

                                                                // Color swatch showing the suggested color
                                                                    const swatch = document.createElement('span');
                                                                        swatch.className = 'suggestion-swatch';
                                                                            swatch.style.backgroundColor = suggestion.hex;
                                                                                swatch.setAttribute('aria-hidden', 'true');
                                                                                    li.appendChild(swatch);

                                                                                        // Label and hex value
                                                                                            const labelText = document.createTextNode(suggestion.label + ': ');
                                                                                                li.appendChild(labelText);

                                                                                                    const strong = document.createElement('strong');
                                                                                                        strong.textContent = suggestion.hex;
                                                                                                            li.appendChild(strong);

                                                                                                                const ratioText = document.createTextNode(` (ratio: ${suggestion.ratioFormatted})`);
                                                                                                                    li.appendChild(ratioText);

                                                                                                                        // Copy button to apply the suggested color to the foreground input
                                                                                                                            const copyBtn = document.createElement('button');
                                                                                                                                copyBtn.className = 'suggestion-copy-btn';
                                                                                                                                    copyBtn.textContent = 'Use this';
                                                                                                                                        copyBtn.setAttribute('aria-label', `Apply ${suggestion.hex} as foreground color`);
                                                                                                                                            copyBtn.addEventListener('click', () => {
                                                                                                                                                  const fgColorInput = document.getElementById('foregroundColor') as HTMLInputElement | null;
                                                                                                                                                        const fgHexInput = document.getElementById('foregroundHex') as HTMLInputElement | null;
                                                                                                                                                              if (fgColorInput && fgHexInput) {
                                                                                                                                                                      fgColorInput.value = suggestion.hex;
                                                                                                                                                                              fgHexInput.value = suggestion.hex;
                                                                                                                                                                                      // Trigger change event to update the preview
                                                                                                                                                                                              fgHexInput.dispatchEvent(new Event('input', { bubbles: true }));
                                                                                                                                                                                                      // Scroll to the input section
                                                                                                                                                                                                              const inputSection = document.getElementById('inputSection');
                                                                                                                                                                                                                      if (inputSection) {
                                                                                                                                                                                                                                inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                  });
                                                                                                                                                                                                                                                      li.appendChild(copyBtn);

                                                                                                                                                                                                                                                          list.appendChild(li);
                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                            }
