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

  test('returns at most 3 suggestions', () => {
    const suggestions = findAccessibleAlternatives('#CCCCCC', '#DDDDDD', 4.5);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  test('first suggestion is closest foreground match', () => {
    const suggestions = findAccessibleAlternatives('#FF9999', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].label).toBe('Closest match');
    expect(suggestions[0].target).toBe('foreground');
  });

  test('includes background adjustment suggestion', () => {
    const suggestions = findAccessibleAlternatives('#888888', '#999999', 4.5);
    const bgSuggestion = suggestions.find(s => s.label === 'Adjust background');
    expect(bgSuggestion).toBeDefined();
    expect(bgSuggestion!.target).toBe('background');
  });

  test('includes hue shift suggestion', () => {
    const suggestions = findAccessibleAlternatives('#FF9999', '#FFFFFF', 4.5);
    const hueSuggestion = suggestions.find(s => s.label === 'Similar shade');
    expect(hueSuggestion).toBeDefined();
    expect(hueSuggestion!.target).toBe('foreground');
  });

  test('suggestion ratios are verified against getContrastRatio', () => {
    const suggestions = findAccessibleAlternatives('#AAAAAA', '#FFFFFF', 4.5);
    for (const s of suggestions) {
      if (s.target === 'foreground') {
        const actualRatio = getContrastRatio(s.hex, '#FFFFFF');
        expect(Math.abs(actualRatio - s.ratio)).toBeLessThan(0.01);
      }
    }
  });

  test('works with different target ratios', () => {
    const suggestionsAA = findAccessibleAlternatives('#AAAAAA', '#FFFFFF', 4.5);
    const suggestionsAAA = findAccessibleAlternatives('#AAAAAA', '#FFFFFF', 7.0);
    if (suggestionsAAA.length > 0) {
      expect(suggestionsAAA[0].ratio).toBeGreaterThanOrEqual(7.0);
    }
  });

  test('finds alternatives for dark background', () => {
    const suggestions = findAccessibleAlternatives('#333333', '#000000', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles green-dominant foreground colors', () => {
    const suggestions = findAccessibleAlternatives('#33FF33', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles blue-dominant foreground colors', () => {
    const suggestions = findAccessibleAlternatives('#3333FF', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles achromatic (gray) foreground colors', () => {
    const suggestions = findAccessibleAlternatives('#808080', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles red-dominant foreground where g < b', () => {
    const suggestions = findAccessibleAlternatives('#FF0033', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('handles high-saturation high-lightness foreground', () => {
    const suggestions = findAccessibleAlternatives('#FFAAAA', '#FFFFFF', 4.5);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('each suggestion has a label and target', () => {
    const suggestions = findAccessibleAlternatives('#BBBBBB', '#FFFFFF', 4.5);
    for (const s of suggestions) {
      expect(s.label).toBeTruthy();
      expect(typeof s.label).toBe('string');
      expect(['foreground', 'background']).toContain(s.target);
    }
  });

  test('background suggestion ratio is correct against original foreground', () => {
    const suggestions = findAccessibleAlternatives('#888888', '#999999', 4.5);
    const bgSuggestion = suggestions.find(s => s.target === 'background');
    if (bgSuggestion) {
      const actualRatio = getContrastRatio('#888888', bgSuggestion.hex);
      expect(Math.abs(actualRatio - bgSuggestion.ratio)).toBeLessThan(0.01);
    }
  });
});
