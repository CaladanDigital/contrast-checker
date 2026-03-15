/**
 * Suggest accessible color alternatives when contrast fails WCAG AA.
 * Produces 3 focused suggestions: closest foreground fix, closest background fix,
 * and a slight hue shift — all visually close to the original colors.
 */

import { getContrastRatio, formatRatio } from './contrastCalculation';
import { hexToHsl, hslToHex } from './colorConversion';
import { deltaE2000 } from './deltaE';

export interface Suggestion {
  hex: string;
  ratio: number;
  ratioFormatted: string;
  label: string;
  target: 'foreground' | 'background';
}

/**
 * Find the nearest lightness that achieves the target contrast ratio.
 * Searches in 0.5% steps from the current lightness outward.
 */
function findNearestPassingLightness(
  h: number,
  s: number,
  currentL: number,
  otherHex: string,
  targetRatio: number,
  mode: 'fg' | 'bg'
): { hex: string; ratio: number } | null {
  let bestHex: string | null = null;
  let bestRatio = 0;
  let bestDistance = Infinity;

  for (let newL = 0; newL <= 100; newL += 0.5) {
    const candidate = hslToHex(h, s, newL);
    const ratio = mode === 'fg'
      ? getContrastRatio(candidate, otherHex)
      : getContrastRatio(otherHex, candidate);

    if (ratio >= targetRatio) {
      const distance = Math.abs(newL - currentL);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestHex = candidate;
        bestRatio = ratio;
      }
    }
  }

  return bestHex ? { hex: bestHex, ratio: bestRatio } : null;
}

/**
 * Find accessible color alternatives for a foreground/background pair.
 * Returns up to 3 focused suggestions ranked by visual similarity.
 */
export function findAccessibleAlternatives(
  fgHex: string,
  bgHex: string,
  targetRatio: number = 4.5
): Suggestion[] {
  const fgHsl = hexToHsl(fgHex);
  const bgHsl = hexToHsl(bgHex);
  if (!fgHsl) return [];

  const suggestions: Suggestion[] = [];
  const seen = new Set<string>();

  // Strategy 1: Closest foreground fix — adjust foreground lightness only
  const fgFix = findNearestPassingLightness(
    fgHsl.h, fgHsl.s, fgHsl.l, bgHex, targetRatio, 'fg'
  );
  if (fgFix && !seen.has(fgFix.hex)) {
    seen.add(fgFix.hex);
    suggestions.push({
      hex: fgFix.hex,
      ratio: fgFix.ratio,
      ratioFormatted: formatRatio(fgFix.ratio),
      label: 'Closest match',
      target: 'foreground',
    });
  }

  // Strategy 2: Closest background fix — adjust background lightness only
  if (bgHsl) {
    const bgFix = findNearestPassingLightness(
      bgHsl.h, bgHsl.s, bgHsl.l, fgHex, targetRatio, 'bg'
    );
    if (bgFix && !seen.has(bgFix.hex + '-bg')) {
      seen.add(bgFix.hex + '-bg');
      suggestions.push({
        hex: bgFix.hex,
        ratio: bgFix.ratio,
        ratioFormatted: formatRatio(bgFix.ratio),
        label: 'Adjust background',
        target: 'background',
      });
    }
  }

  // Strategy 3: Slight hue shift — try ±15° and ±30° hue shifts with minimal lightness adjustment
  const hueShifts = [15, -15, 30, -30];
  for (const shift of hueShifts) {
    const shiftedH = ((fgHsl.h + shift) % 360 + 360) % 360;
    const hueFix = findNearestPassingLightness(
      shiftedH, fgHsl.s, fgHsl.l, bgHex, targetRatio, 'fg'
    );
    if (hueFix && !seen.has(hueFix.hex)) {
      seen.add(hueFix.hex);
      suggestions.push({
        hex: hueFix.hex,
        ratio: hueFix.ratio,
        ratioFormatted: formatRatio(hueFix.ratio),
        label: 'Similar shade',
        target: 'foreground',
      });
      break; // Only need one hue-shift suggestion
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * Advanced alternatives ranked by CIEDE2000 perceptual similarity.
 * Generates candidates across lightness, saturation, and hue axes.
 * Returns up to `limit` suggestions (default 8) ranked by visual closeness.
 */
export function getAdvancedAlternatives(
  fgHex: string,
  bgHex: string,
  targetRatio: number = 4.5,
  limit: number = 8
): Suggestion[] {
  const fgHsl = hexToHsl(fgHex);
  if (!fgHsl) return [];

  const candidates: Array<{ hex: string; ratio: number; deltaE: number }> = [];
  const seen = new Set<string>();

  // Generate candidates across lightness axis
  for (let l = 0; l <= 100; l += 0.5) {
    const candidate = hslToHex(fgHsl.h, fgHsl.s, l);
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const ratio = getContrastRatio(candidate, bgHex);
    if (ratio >= targetRatio) {
      const dE = deltaE2000(fgHex, candidate);
      if (dE !== null) {
        candidates.push({ hex: candidate, ratio, deltaE: dE });
      }
    }
  }

  // Generate candidates across saturation axis
  for (let s = 0; s <= 100; s += 2) {
    for (let l = 0; l <= 100; l += 1) {
      const candidate = hslToHex(fgHsl.h, s, l);
      if (seen.has(candidate)) continue;
      seen.add(candidate);
      const ratio = getContrastRatio(candidate, bgHex);
      if (ratio >= targetRatio) {
        const dE = deltaE2000(fgHex, candidate);
        if (dE !== null) {
          candidates.push({ hex: candidate, ratio, deltaE: dE });
        }
      }
    }
  }

  // Generate candidates across hue axis (±30° in 5° steps)
  for (let hShift = -30; hShift <= 30; hShift += 5) {
    if (hShift === 0) continue;
    const h = ((fgHsl.h + hShift) % 360 + 360) % 360;
    for (let l = 0; l <= 100; l += 1) {
      const candidate = hslToHex(h, fgHsl.s, l);
      if (seen.has(candidate)) continue;
      seen.add(candidate);
      const ratio = getContrastRatio(candidate, bgHex);
      if (ratio >= targetRatio) {
        const dE = deltaE2000(fgHex, candidate);
        if (dE !== null) {
          candidates.push({ hex: candidate, ratio, deltaE: dE });
        }
      }
    }
  }

  // Sort by deltaE (most perceptually similar first)
  candidates.sort((a, b) => a.deltaE - b.deltaE);

  // Dedupe nearby colors (skip if hex matches or deltaE difference < 1)
  const results: Suggestion[] = [];
  const usedHexes = new Set<string>();

  for (const c of candidates) {
    if (usedHexes.has(c.hex)) continue;
    if (c.hex === fgHex) continue;
    usedHexes.add(c.hex);
    results.push({
      hex: c.hex,
      ratio: c.ratio,
      ratioFormatted: formatRatio(c.ratio),
      label: 'Similar color',
      target: 'foreground',
    });
    if (results.length >= limit) break;
  }

  return results;
}
