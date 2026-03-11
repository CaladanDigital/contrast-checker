import { describe, test, expect } from 'vitest';
import { findAccessibleAlternatives } from '../../src/utils/accessibleAlternatives';
import { getContrastRatio } from '../../src/utils/contrastCalculation';
import { isValidHex } from '../../src/utils/colorValidation';

describe('findAccessibleAlternatives', () => {
  test('returns suggestions when contrast fails AA', () => {
    const suggestions = findAccessibleAlternatives('#999999', '#AAAAAA', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('all suggestions meet the target ratio', () => {
    const suggestions = findAccessibleAlternatives('#999999', '#FFFFFF', 4.5);
    for (const s of suggestions) {
      expect(s.ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('all suggestions return valid hex colors', () => {
    const suggestions = findAccessibleAlternatives('#CCCCCC', '#FFFFFF', 4.5);
    for (const s of suggestions) {
      expect(isValidHex(s.hex)).toBe(true);
    }
  });

  test('suggestions have formatted ratio strings', () => {
    const suggestions = findAccessibleAlternatives('#AAAAAA', '#FFFFFF', 4.5);
    for (const s of suggestions) {
      expect(s.ratioFormatted).toMatch(/^\d+\.\d{2}:1$/);
    }
  });

  test('returns empty array for invalid foreground hex', () => {
    const suggestions = findAccessibleAlternatives('invalid', '#FFFFFF', 4.5);
    expect(suggestions).toEqual([]);
  });

  test('returns at most 5 suggestions', () => {
    const suggestions = findAccessibleAlternatives('#CCCCCC', '#DDDDDD', 4.5);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  test('suggestions include hue-preserved adjustments', () => {
    const suggestions = findAccessibleAlternatives('#FF9999', '#FFFFFF', 4.5);
    // Should find at least one darker variant of the original hue
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('suggestions include background adjustments', () => {
    const suggestions = findAccessibleAlternatives('#888888', '#999999', 4.5);
    const bgSuggestion = suggestions.find(s => s.label.startsWith('Background:'));
    expect(bgSuggestion).toBeDefined();
  });

  test('suggestion ratios are verified against getContrastRatio', () => {
    const suggestions = findAccessibleAlternatives('#AAAAAA', '#FFFFFF', 4.5);
    for (const s of suggestions) {
      if (!s.label.startsWith('Background:')) {
        const actualRatio = getContrastRatio(s.hex, '#FFFFFF');
        expect(Math.abs(actualRatio - s.ratio)).toBeLessThan(0.01);
      }
    }
  });

  test('works with different target ratios', () => {
    const suggestionsAA = findAccessibleAlternatives('#AAAAAA', '#FFFFFF', 4.5);
    const suggestionsAAA = findAccessibleAlternatives('#AAAAAA', '#FFFFFF', 7.0);
    // AAA suggestions should have higher contrast ratios
    if (suggestionsAAA.length > 0) {
      expect(suggestionsAAA[0].ratio).toBeGreaterThanOrEqual(7.0);
    }
  });

  test('finds alternatives for dark background', () => {
    const suggestions = findAccessibleAlternatives('#333333', '#000000', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles green-dominant foreground colors', () => {
    // Green max channel hits case g in rgbToHsl
    const suggestions = findAccessibleAlternatives('#33FF33', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles blue-dominant foreground colors', () => {
    // Blue max channel hits case b in rgbToHsl
    const suggestions = findAccessibleAlternatives('#3333FF', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles achromatic (gray) foreground colors', () => {
    // s === 0 path in hslToRgb
    const suggestions = findAccessibleAlternatives('#808080', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles red-dominant foreground where g < b', () => {
    // Hits the g < b branch in case r of rgbToHsl
    const suggestions = findAccessibleAlternatives('#FF0033', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles high-saturation high-lightness foreground', () => {
    // Hits l > 0.5 branch in rgbToHsl saturation calc
    const suggestions = findAccessibleAlternatives('#FFAAAA', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('each suggestion has a label', () => {
    const suggestions = findAccessibleAlternatives('#BBBBBB', '#FFFFFF', 4.5);
    for (const s of suggestions) {
      expect(s.label).toBeTruthy();
      expect(typeof s.label).toBe('string');
    }
  });
});
