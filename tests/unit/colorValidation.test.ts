import { describe, test, expect } from 'vitest';
import { validateHex, hexToRgb, rgbToHex, isValidHex } from '../../src/utils/colorValidation';

describe('validateHex', () => {
  // Valid inputs
  test('#000000 -> #000000', () => {
    expect(validateHex('#000000')).toBe('#000000');
  });

  test('#FFFFFF -> #FFFFFF', () => {
    expect(validateHex('#FFFFFF')).toBe('#FFFFFF');
  });

  test('#ffffff -> #FFFFFF (uppercase)', () => {
    expect(validateHex('#ffffff')).toBe('#FFFFFF');
  });

  test('#AbCdEf -> #ABCDEF (mixed case)', () => {
    expect(validateHex('#AbCdEf')).toBe('#ABCDEF');
  });

  test('#FFF -> #FFFFFF (3-digit expansion)', () => {
    expect(validateHex('#FFF')).toBe('#FFFFFF');
  });

  test('#abc -> #AABBCC (3-digit expansion)', () => {
    expect(validateHex('#abc')).toBe('#AABBCC');
  });

  test('handles whitespace', () => {
    expect(validateHex('  #000000  ')).toBe('#000000');
  });

  // Invalid inputs
  test('empty string -> null', () => {
    expect(validateHex('')).toBeNull();
  });

  test('"red" -> null (named color)', () => {
    expect(validateHex('red')).toBeNull();
  });

  test('"rgb(0,0,0)" -> null (rgb notation)', () => {
    expect(validateHex('rgb(0,0,0)')).toBeNull();
  });

  test('"#GGGGGG" -> null (invalid hex chars)', () => {
    expect(validateHex('#GGGGGG')).toBeNull();
  });

  test('"#12345" -> null (5 digits)', () => {
    expect(validateHex('#12345')).toBeNull();
  });

  test('"#1234567" -> null (7 digits)', () => {
    expect(validateHex('#1234567')).toBeNull();
  });

  test('"000000" -> null (missing #)', () => {
    expect(validateHex('000000')).toBeNull();
  });

  test('null -> null', () => {
    expect(validateHex(null as unknown as string)).toBeNull();
  });

  test('undefined -> null', () => {
    expect(validateHex(undefined as unknown as string)).toBeNull();
  });

  test('123 (number) -> null', () => {
    expect(validateHex(123 as unknown as string)).toBeNull();
  });

  // XSS payloads
  test('"<script>alert(1)</script>" -> null', () => {
    expect(validateHex('<script>alert(1)</script>')).toBeNull();
  });

  test('"#000000<script>" -> null', () => {
    expect(validateHex('#000000<script>')).toBeNull();
  });

  test('"javascript:alert(1)" -> null', () => {
    expect(validateHex('javascript:alert(1)')).toBeNull();
  });

  test('"#000000\\" onclick=\\"alert(1)" -> null', () => {
    expect(validateHex('#000000" onclick="alert(1)')).toBeNull();
  });

  test('"><img src=x onerror=alert(1)>" -> null', () => {
    expect(validateHex('"><img src=x onerror=alert(1)>')).toBeNull();
  });
});

describe('hexToRgb', () => {
  test('converts black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  test('converts white', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  test('converts red', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  test('returns null for invalid input', () => {
    expect(hexToRgb('invalid')).toBeNull();
  });
});

describe('rgbToHex', () => {
  test('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  test('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
  });

  test('clamps values above 255', () => {
    expect(rgbToHex(300, 0, 0)).toBe('#FF0000');
  });

  test('clamps values below 0', () => {
    expect(rgbToHex(-10, 0, 0)).toBe('#000000');
  });

  test('rounds fractional values', () => {
    expect(rgbToHex(127.6, 0, 0)).toBe('#800000');
  });
});

describe('isValidHex', () => {
  test('returns true for valid hex', () => {
    expect(isValidHex('#FF0000')).toBe(true);
  });

  test('returns true for 3-digit hex', () => {
    expect(isValidHex('#FFF')).toBe(true);
  });

  test('returns false for invalid', () => {
    expect(isValidHex('not-a-color')).toBe(false);
  });
});
