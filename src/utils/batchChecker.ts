/**
 * Batch palette contrast checking.
 * Checks all foreground/background pairs in a set of colors.
 */

import { getContrastRatio, formatRatio, checkWCAGCompliance, type WCAGResults } from './contrastCalculation';

export interface PairResult {
  fg: string;
  bg: string;
  ratio: number;
  ratioFormatted: string;
  wcag: WCAGResults;
}

/**
 * Check all unique foreground/background pairs (fg !== bg).
 * For N colors, returns N*(N-1) pairs.
 */
export function checkAllPairs(colors: string[]): PairResult[] {
  const results: PairResult[] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = 0; j < colors.length; j++) {
      if (i === j) continue;
      const ratio = getContrastRatio(colors[i], colors[j]);
      results.push({
        fg: colors[i],
        bg: colors[j],
        ratio,
        ratioFormatted: formatRatio(ratio),
        wcag: checkWCAGCompliance(ratio),
      });
    }
  }
  return results;
}

/**
 * Generate a matrix of results: matrix[row][col] where row=foreground, col=background.
 * Diagonal entries (same color) are null.
 */
export function generateMatrix(colors: string[]): (PairResult | null)[][] {
  const matrix: (PairResult | null)[][] = [];
  for (let i = 0; i < colors.length; i++) {
    const row: (PairResult | null)[] = [];
    for (let j = 0; j < colors.length; j++) {
      if (i === j) {
        row.push(null);
      } else {
        const ratio = getContrastRatio(colors[i], colors[j]);
        row.push({
          fg: colors[i],
          bg: colors[j],
          ratio,
          ratioFormatted: formatRatio(ratio),
          wcag: checkWCAGCompliance(ratio),
        });
      }
    }
    matrix.push(row);
  }
  return matrix;
}
