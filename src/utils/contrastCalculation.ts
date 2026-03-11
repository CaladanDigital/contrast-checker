/**
 * WCAG 2.1 contrast ratio calculation.
 * Reference: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 *
 * CRITICAL: No premature rounding. The WCAG spec requires exact comparison.
 * A ratio of 4.499:1 FAILS AA normal text. Only >= 4.5 passes.
 */

import { hexToRgb, type RGB } from './colorValidation';

/**
 * Calculate relative luminance per WCAG 2.1 formula.
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where each channel is linearized from sRGB.
 *
 * Uses correct sRGB threshold of 0.04045 (not 0.03928).
 */
export function getRelativeLuminance(rgb: RGB): number {
  const linearize = (channel: number): number => {
    const srgb = channel / 255;
    return srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * linearize(rgb.r) +
    0.7152 * linearize(rgb.g) +
    0.0722 * linearize(rgb.b)
  );
}

/**
 * Calculate contrast ratio between two colors.
 * Returns exact ratio (no rounding). Range: 1 to 21.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Format ratio for display. Rounds to 2 decimal places for UI only.
 * Internal comparisons must use the raw getContrastRatio() value.
 */
export function formatRatio(ratio: number): string {
  return ratio.toFixed(2) + ':1';
}

/**
 * WCAG compliance thresholds. Uses exact (unrounded) ratio for comparison.
 */
export interface WCAGResults {
  aaNormal: boolean;   // >= 4.5:1
  aaLarge: boolean;    // >= 3:1
  aaaNormal: boolean;  // >= 7:1
  aaaLarge: boolean;   // >= 4.5:1
}

export function checkWCAGCompliance(ratio: number): WCAGResults {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5
  };
}
