import { describe, test, expect } from 'vitest';
import { rgbToHsl, hslToRgb, hexToHsl, hslToHex } from '../../src/utils/colorConversion';

describe('rgbToHsl', () => {
  test('pure black → HSL(0, 0, 0)', () => {
    const hsl = rgbToHsl(0, 0, 0);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(0);
  });

  test('pure white → HSL(0, 0, 100)', () => {
    const hsl = rgbToHsl(255, 255, 255);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(100);
  });

  test('pure red → HSL(0, 100, 50)', () => {
    const hsl = rgbToHsl(255, 0, 0);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  test('pure green → HSL(120, 100, 50)', () => {
    const hsl = rgbToHsl(0, 255, 0);
    expect(hsl.h).toBeCloseTo(120, 0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  test('pure blue → HSL(240, 100, 50)', () => {
    const hsl = rgbToHsl(0, 0, 255);
    expect(hsl.h).toBeCloseTo(240, 0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  test('gray (128, 128, 128) → saturation 0', () => {
    const hsl = rgbToHsl(128, 128, 128);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBeCloseTo(50.2, 0);
  });
});

describe('hslToRgb', () => {
  test('HSL(0, 0, 0) → black', () => {
    expect(hslToRgb(0, 0, 0)).toEqual([0, 0, 0]);
  });

  test('HSL(0, 0, 100) → white', () => {
    expect(hslToRgb(0, 0, 100)).toEqual([255, 255, 255]);
  });

  test('HSL(0, 100, 50) → pure red', () => {
    expect(hslToRgb(0, 100, 50)).toEqual([255, 0, 0]);
  });

  test('HSL(120, 100, 50) → pure green', () => {
    expect(hslToRgb(120, 100, 50)).toEqual([0, 255, 0]);
  });

  test('HSL(240, 100, 50) → pure blue', () => {
    expect(hslToRgb(240, 100, 50)).toEqual([0, 0, 255]);
  });

  test('achromatic (saturation = 0) returns equal RGB values', () => {
    const [r, g, b] = hslToRgb(180, 0, 50);
    expect(r).toBe(g);
    expect(g).toBe(b);
  });
});

describe('round-trip conversions', () => {
  test('RGB → HSL → RGB preserves values', () => {
    const testCases = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [128, 64, 192],
      [0, 0, 0],
      [255, 255, 255],
    ] as const;

    for (const [r, g, b] of testCases) {
      const hsl = rgbToHsl(r, g, b);
      const [r2, g2, b2] = hslToRgb(hsl.h, hsl.s, hsl.l);
      expect(r2).toBeCloseTo(r, 0);
      expect(g2).toBeCloseTo(g, 0);
      expect(b2).toBeCloseTo(b, 0);
    }
  });
});

describe('hexToHsl', () => {
  test('valid hex → HSL object', () => {
    const hsl = hexToHsl('#FF0000');
    expect(hsl).not.toBeNull();
    expect(hsl!.h).toBe(0);
    expect(hsl!.s).toBe(100);
    expect(hsl!.l).toBe(50);
  });

  test('invalid hex → null', () => {
    expect(hexToHsl('invalid')).toBeNull();
  });
});

describe('hslToHex', () => {
  test('HSL(0, 100, 50) → #FF0000', () => {
    expect(hslToHex(0, 100, 50)).toBe('#FF0000');
  });

  test('HSL(0, 0, 0) → #000000', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000');
  });

  test('HSL(0, 0, 100) → #FFFFFF', () => {
    expect(hslToHex(0, 0, 100)).toBe('#FFFFFF');
  });

  test('round-trip hex → HSL → hex preserves value', () => {
    const originals = ['#FF0000', '#00FF00', '#0000FF', '#000000', '#FFFFFF'];
    for (const hex of originals) {
      const hsl = hexToHsl(hex)!;
      const result = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(result).toBe(hex);
    }
  });
});
