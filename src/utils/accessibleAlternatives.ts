/**
 * Suggest accessible color alternatives when contrast fails WCAG AA.
 * Tries hue-preserved adjustments first, then grayscale fallbacks.
 */

import { hexToRgb, rgbToHex } from './colorValidation';
import { getContrastRatio, formatRatio } from './contrastCalculation';
import { rgbToHsl, hslToRgb } from './colorConversion';

export interface Suggestion {
  hex: string;
  ratio: number;
  ratioFormatted: string;
  label: string;
}

/**
 * Find accessible color alternatives for a foreground/background pair.
 * Returns multiple suggestions ranked by visual similarity to original.
 */
export function findAccessibleAlternatives(
  fgHex: string,
  bgHex: string,
  targetRatio: number = 4.5
): Suggestion[] {
  const fgRgb = hexToRgb(fgHex);
  if (!fgRgb) return [];

  const suggestions: Suggestion[] = [];
  const seen = new Set<string>();

  // Strategy 1: Hue-preserved foreground adjustments (darken/lighten)
  const { h, s, l } = rgbToHsl(fgRgb.r, fgRgb.g, fgRgb.b);

  for (let newL = 0; newL <= 100; newL += 1) {
    const [r, g, b] = hslToRgb(h, s, newL);
    const hex = rgbToHex(r, g, b);
    if (seen.has(hex)) continue;
    seen.add(hex);

    const ratio = getContrastRatio(hex, bgHex);
    if (ratio >= targetRatio) {
      const distance = Math.abs(newL - l);
      suggestions.push({
        hex,
        ratio,
        ratioFormatted: formatRatio(ratio),
        label: newL < l ? `Darker ${fgHex}` : `Lighter ${fgHex}`
      });
      // Only keep closest matches for hue-preserved
      if (suggestions.length >= 3 && distance > 20) break;
    }
  }

  // Sort by visual similarity (closest lightness to original)
  suggestions.sort((a, b) => {
    const aRgb = hexToRgb(a.hex)!;
    const bRgb = hexToRgb(b.hex)!;
    const aDist = Math.abs(aRgb.r - fgRgb.r) + Math.abs(aRgb.g - fgRgb.g) + Math.abs(aRgb.b - fgRgb.b);
    const bDist = Math.abs(bRgb.r - fgRgb.r) + Math.abs(bRgb.g - fgRgb.g) + Math.abs(bRgb.b - fgRgb.b);
    return aDist - bDist;
  });

  // Strategy 2: Adjust background instead
  const bgRgb = hexToRgb(bgHex);
  if (bgRgb) {
    const { h: bh, s: bs, l: bl } = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);
    for (let newL = 0; newL <= 100; newL += 1) {
      const [r, g, b] = hslToRgb(bh, bs, newL);
      const hex = rgbToHex(r, g, b);
      if (seen.has(hex + '-bg')) continue;
      seen.add(hex + '-bg');

      const ratio = getContrastRatio(fgHex, hex);
      if (ratio >= targetRatio) {
        const distance = Math.abs(newL - bl);
        suggestions.push({
          hex,
          ratio,
          ratioFormatted: formatRatio(ratio),
          label: `Background: ${hex}`
        });
        if (distance > 20) break;
      }
    }
  }

  // Strategy 3: Grayscale fallback
  for (let i = 0; i <= 255; i += 5) {
    const hex = rgbToHex(i, i, i);
    if (seen.has(hex)) continue;
    seen.add(hex);

    const ratio = getContrastRatio(hex, bgHex);
    if (ratio >= targetRatio) {
      suggestions.push({
        hex,
        ratio,
        ratioFormatted: formatRatio(ratio),
        label: `Grayscale: ${hex}`
      });
      break; // Just one grayscale suggestion
    }
  }

  // Return top suggestions, max 5
  return suggestions.slice(0, 5);
}
