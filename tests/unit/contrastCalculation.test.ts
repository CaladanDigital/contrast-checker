import { describe, test, expect } from 'vitest';
import { getRelativeLuminance, getContrastRatio, formatRatio, checkWCAGCompliance } from '../../src/utils/contrastCalculation';

describe('getRelativeLuminance', () => {
  test('pure black has luminance 0', () => {
    expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  test('pure white has luminance 1', () => {
    expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  test('luminance is between 0 and 1', () => {
    const lum = getRelativeLuminance({ r: 128, g: 128, b: 128 });
    expect(lum).toBeGreaterThanOrEqual(0);
    expect(lum).toBeLessThanOrEqual(1);
  });
});

describe('getContrastRatio', () => {
  // Cross-referenced with WebAIM contrast checker
  test('black on white = 21:1 (maximum)', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21, 0);
  });

  test('white on white = 1:1 (no contrast)', () => {
    const ratio = getContrastRatio('#FFFFFF', '#FFFFFF');
    expect(ratio).toBeCloseTo(1, 2);
  });

  test('black on black = 1:1 (no contrast)', () => {
    const ratio = getContrastRatio('#000000', '#000000');
    expect(ratio).toBeCloseTo(1, 2);
  });

  test('#777777 on #FFFFFF ~ 4.48:1 (just below AA normal)', () => {
    const ratio = getContrastRatio('#777777', '#FFFFFF');
    expect(ratio).toBeCloseTo(4.48, 1);
    expect(ratio).toBeLessThan(4.5);
  });

  test('#767676 on #FFFFFF ~ 4.54:1 (just above AA normal, WebAIM reference)', () => {
    const ratio = getContrastRatio('#767676', '#FFFFFF');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(4.7);
  });

  test('#595959 on #FFFFFF ~ 7.0:1 (near AAA threshold)', () => {
    const ratio = getContrastRatio('#595959', '#FFFFFF');
    expect(ratio).toBeCloseTo(7.0, 0);
  });

  test('#FF0000 on #FFFFFF ~ 4.0:1 (red on white)', () => {
    const ratio = getContrastRatio('#FF0000', '#FFFFFF');
    expect(ratio).toBeCloseTo(4.0, 0);
  });

  test('#0000FF on #FFFFFF ~ 8.59:1 (blue on white)', () => {
    const ratio = getContrastRatio('#0000FF', '#FFFFFF');
    expect(ratio).toBeCloseTo(8.59, 0);
  });

  test('#00FF00 on #FFFFFF ~ 1.37:1 (green on white, low contrast)', () => {
    const ratio = getContrastRatio('#00FF00', '#FFFFFF');
    expect(ratio).toBeCloseTo(1.37, 1);
  });

  test('#808080 on #000000 ~ 5.32:1 (gray on black)', () => {
    const ratio = getContrastRatio('#808080', '#000000');
    expect(ratio).toBeCloseTo(5.32, 0);
  });

  test('returns 1 for invalid inputs', () => {
    expect(getContrastRatio('invalid', '#FFFFFF')).toBe(1);
    expect(getContrastRatio('#000000', 'invalid')).toBe(1);
  });

  test('ratio is symmetric: f(a,b) === f(b,a)', () => {
    const r1 = getContrastRatio('#FF6600', '#003366');
    const r2 = getContrastRatio('#003366', '#FF6600');
    expect(r1).toBe(r2);
  });
});

describe('formatRatio', () => {
  test('formats ratio with 2 decimal places', () => {
    expect(formatRatio(4.5)).toBe('4.50:1');
  });

  test('formats 21:1', () => {
    expect(formatRatio(21)).toBe('21.00:1');
  });

  test('formats 1:1', () => {
    expect(formatRatio(1)).toBe('1.00:1');
  });
});

describe('checkWCAGCompliance', () => {
  test('ratio 21 passes all levels', () => {
    const results = checkWCAGCompliance(21);
    expect(results.aaNormal).toBe(true);
    expect(results.aaLarge).toBe(true);
    expect(results.aaaNormal).toBe(true);
    expect(results.aaaLarge).toBe(true);
  });

  test('ratio 1 fails all levels', () => {
    const results = checkWCAGCompliance(1);
    expect(results.aaNormal).toBe(false);
    expect(results.aaLarge).toBe(false);
    expect(results.aaaNormal).toBe(false);
    expect(results.aaaLarge).toBe(false);
  });

  test('ratio 4.5 passes AA normal but not AAA normal', () => {
    const results = checkWCAGCompliance(4.5);
    expect(results.aaNormal).toBe(true);
    expect(results.aaLarge).toBe(true);
    expect(results.aaaNormal).toBe(false);
    expect(results.aaaLarge).toBe(true);
  });

  test('ratio 3.0 passes AA large only', () => {
    const results = checkWCAGCompliance(3.0);
    expect(results.aaNormal).toBe(false);
    expect(results.aaLarge).toBe(true);
    expect(results.aaaNormal).toBe(false);
    expect(results.aaaLarge).toBe(false);
  });
});
