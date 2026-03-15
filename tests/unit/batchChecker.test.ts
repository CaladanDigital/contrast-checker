import { describe, test, expect } from 'vitest';
import { checkAllPairs, generateMatrix } from '../../src/utils/batchChecker';

describe('batchChecker', () => {
  test('checkAllPairs returns N*(N-1) pairs for N colors', () => {
    const colors = ['#000000', '#FFFFFF', '#FF0000'];
    const results = checkAllPairs(colors);
    expect(results.length).toBe(6); // 3 * 2
  });

  test('checkAllPairs excludes same-color pairs', () => {
    const results = checkAllPairs(['#000000', '#FFFFFF']);
    for (const r of results) {
      expect(r.fg).not.toBe(r.bg);
    }
  });

  test('checkAllPairs results have valid ratios', () => {
    const results = checkAllPairs(['#000000', '#FFFFFF']);
    for (const r of results) {
      expect(r.ratio).toBeGreaterThanOrEqual(1);
      expect(r.ratio).toBeLessThanOrEqual(21);
    }
  });

  test('checkAllPairs results have formatted ratios', () => {
    const results = checkAllPairs(['#000000', '#FFFFFF']);
    for (const r of results) {
      expect(r.ratioFormatted).toMatch(/^\d+\.\d{2}:1$/);
    }
  });

  test('checkAllPairs results have WCAG compliance', () => {
    const results = checkAllPairs(['#000000', '#FFFFFF']);
    for (const r of results) {
      expect(typeof r.wcag.aaNormal).toBe('boolean');
      expect(typeof r.wcag.aaLarge).toBe('boolean');
      expect(typeof r.wcag.aaaNormal).toBe('boolean');
      expect(typeof r.wcag.aaaLarge).toBe('boolean');
    }
  });

  test('generateMatrix returns correct dimensions', () => {
    const colors = ['#000000', '#FFFFFF', '#FF0000'];
    const matrix = generateMatrix(colors);
    expect(matrix.length).toBe(3);
    for (const row of matrix) {
      expect(row.length).toBe(3);
    }
  });

  test('generateMatrix diagonal is null', () => {
    const matrix = generateMatrix(['#000000', '#FFFFFF']);
    expect(matrix[0][0]).toBeNull();
    expect(matrix[1][1]).toBeNull();
  });

  test('generateMatrix off-diagonal has results', () => {
    const matrix = generateMatrix(['#000000', '#FFFFFF']);
    expect(matrix[0][1]).not.toBeNull();
    expect(matrix[1][0]).not.toBeNull();
  });

  test('black on white has max contrast', () => {
    const results = checkAllPairs(['#000000', '#FFFFFF']);
    const blackOnWhite = results.find(r => r.fg === '#000000' && r.bg === '#FFFFFF');
    expect(blackOnWhite).toBeDefined();
    expect(blackOnWhite!.ratio).toBeCloseTo(21, 0);
  });

  test('handles empty array', () => {
    expect(checkAllPairs([])).toEqual([]);
    expect(generateMatrix([])).toEqual([]);
  });

  test('handles single color', () => {
    expect(checkAllPairs(['#000000'])).toEqual([]);
  });
});
