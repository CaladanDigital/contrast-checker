import { describe, test, expect } from 'vitest';
import { getRelativeLuminance, getContrastRatio, checkWCAGCompliance } from '../../src/utils/contrastCalculation';

describe('WCAG Edge Cases', () => {
  test('boundary: ratio just below 4.5 should FAIL AA normal text', () => {
    // #777777 on white produces ~4.48 which is below 4.5
    const ratio = getContrastRatio('#777777', '#FFFFFF');
    const results = checkWCAGCompliance(ratio);
    expect(results.aaNormal).toBe(false);
  });

  test('boundary: #767676 on #FFFFFF should PASS AA normal text', () => {
    const ratio = getContrastRatio('#767676', '#FFFFFF');
    const results = checkWCAGCompliance(ratio);
    expect(results.aaNormal).toBe(true);
  });

  test('boundary: 2.999 should FAIL AA large text', () => {
    const results = checkWCAGCompliance(2.999);
    expect(results.aaLarge).toBe(false);
  });

  test('boundary: 3.0 should PASS AA large text', () => {
    const results = checkWCAGCompliance(3.0);
    expect(results.aaLarge).toBe(true);
  });

  test('boundary: 6.999 should FAIL AAA normal text', () => {
    const results = checkWCAGCompliance(6.999);
    expect(results.aaaNormal).toBe(false);
  });

  test('boundary: 7.0 should PASS AAA normal text', () => {
    const results = checkWCAGCompliance(7.0);
    expect(results.aaaNormal).toBe(true);
  });

  test('ratio should never exceed 21:1', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeLessThanOrEqual(21);
  });

  test('ratio should never be less than 1:1', () => {
    const ratio = getContrastRatio('#FFFFFF', '#FFFFFF');
    expect(ratio).toBeGreaterThanOrEqual(1);
  });

  test('ratio is symmetric: f(a,b) === f(b,a)', () => {
    const r1 = getContrastRatio('#FF6600', '#003366');
    const r2 = getContrastRatio('#003366', '#FF6600');
    expect(r1).toBe(r2);
  });

  test('luminance of pure black is 0', () => {
    expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  test('luminance of pure white is 1', () => {
    expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 10);
  });

  test('sRGB linearization threshold at 0.04045', () => {
    // Channel value 10 (10/255 ~ 0.0392) should use linear formula
    const lum10 = getRelativeLuminance({ r: 10, g: 0, b: 0 });
    // Channel value 11 (11/255 ~ 0.0431) should use gamma formula
    const lum11 = getRelativeLuminance({ r: 11, g: 0, b: 0 });

    // Both should produce small but distinct positive values
    expect(lum10).toBeGreaterThan(0);
    expect(lum11).toBeGreaterThan(lum10);
  });

  test('maximum contrast ratio is exactly 21 for black/white', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF');
    // (1 + 0.05) / (0 + 0.05) = 1.05 / 0.05 = 21
    expect(ratio).toBe(21);
  });

  test('contrast of same color is exactly 1', () => {
    const ratio = getContrastRatio('#ABCDEF', '#ABCDEF');
    expect(ratio).toBe(1);
  });
});
