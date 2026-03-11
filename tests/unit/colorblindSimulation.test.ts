import { describe, test, expect } from 'vitest';
import { simulateColorblindness } from '../../src/utils/colorblindSimulation';
import { hexToRgb, isValidHex } from '../../src/utils/colorValidation';

describe('Colorblind Simulation', () => {
  test('achromatopsia converts to grayscale', () => {
    const result = simulateColorblindness('#FF0000', 'achromatopsia');
    const rgb = hexToRgb(result);
    expect(rgb).not.toBeNull();
    // For grayscale, R, G, B should be equal (or very close)
    expect(rgb!.r).toBe(rgb!.g);
    expect(rgb!.g).toBe(rgb!.b);
  });

  test('protanopia: red and green appear more similar', () => {
    const simRed = simulateColorblindness('#FF0000', 'protanopia');
    const simGreen = simulateColorblindness('#00FF00', 'protanopia');
    const redRgb = hexToRgb(simRed)!;
    const greenRgb = hexToRgb(simGreen)!;

    // Original colors are maximally different. Simulated should be closer.
    const simDistance = Math.abs(redRgb.r - greenRgb.r) +
      Math.abs(redRgb.g - greenRgb.g) +
      Math.abs(redRgb.b - greenRgb.b);
    // Original distance is 255 + 255 = 510
    expect(simDistance).toBeLessThan(510);
  });

  test('simulation preserves black', () => {
    const types = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;
    for (const type of types) {
      expect(simulateColorblindness('#000000', type)).toBe('#000000');
    }
  });

  test('simulation preserves white', () => {
    const types = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;
    for (const type of types) {
      expect(simulateColorblindness('#FFFFFF', type)).toBe('#FFFFFF');
    }
  });

  test('all simulation types return valid hex', () => {
    const types = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;
    for (const type of types) {
      const result = simulateColorblindness('#FF6633', type);
      expect(isValidHex(result)).toBe(true);
    }
  });

  test('RGB values stay in 0-255 range after simulation', () => {
    const types = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;
    const testColors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

    for (const type of types) {
      for (const color of testColors) {
        const result = simulateColorblindness(color, type);
        const rgb = hexToRgb(result);
        expect(rgb).not.toBeNull();
        expect(rgb!.r).toBeGreaterThanOrEqual(0);
        expect(rgb!.r).toBeLessThanOrEqual(255);
        expect(rgb!.g).toBeGreaterThanOrEqual(0);
        expect(rgb!.g).toBeLessThanOrEqual(255);
        expect(rgb!.b).toBeGreaterThanOrEqual(0);
        expect(rgb!.b).toBeLessThanOrEqual(255);
      }
    }
  });

  test('returns original hex for invalid input', () => {
    expect(simulateColorblindness('invalid', 'protanopia')).toBe('invalid');
  });
});
