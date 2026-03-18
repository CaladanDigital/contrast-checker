import { describe, it, expect } from 'vitest';
import {
  parseComputedColor,
  colorDistance,
  clusterColors,
  isNearBlackOrWhite,
  extractColorsFromDocument,
} from '../../src/utils/colorExtraction';

describe('parseComputedColor', () => {
  it('parses rgb() to hex', () => {
    expect(parseComputedColor('rgb(255, 0, 0)')).toBe('#FF0000');
    expect(parseComputedColor('rgb(0, 128, 255)')).toBe('#0080FF');
  });

  it('parses rgba() with opaque alpha to hex', () => {
    expect(parseComputedColor('rgba(0, 0, 0, 1)')).toBe('#000000');
    expect(parseComputedColor('rgba(100, 200, 50, 0.8)')).toBe('#64C832');
  });

  it('returns null for transparent', () => {
    expect(parseComputedColor('transparent')).toBeNull();
    expect(parseComputedColor('rgba(0, 0, 0, 0)')).toBeNull();
  });

  it('returns null for empty or invalid values', () => {
    expect(parseComputedColor('')).toBeNull();
    expect(parseComputedColor('notacolor')).toBeNull();
  });
});

describe('colorDistance', () => {
  it('returns 0 for identical colors', () => {
    expect(colorDistance('#FF0000', '#FF0000')).toBe(0);
  });

  it('computes distance between black and white', () => {
    const dist = colorDistance('#000000', '#FFFFFF');
    expect(dist).toBeCloseTo(441.67, 1);
  });

  it('computes distance between similar colors', () => {
    const dist = colorDistance('#FF0000', '#FE0101');
    expect(dist).toBeLessThan(5);
  });
});

describe('clusterColors', () => {
  it('merges similar colors and sums frequencies', () => {
    const entries = [
      { hex: '#FF0000', frequency: 5 },
      { hex: '#FE0101', frequency: 3 },
    ];
    const result = clusterColors(entries);
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe(8);
  });

  it('keeps distinct colors separate', () => {
    const entries = [
      { hex: '#FF0000', frequency: 5 },
      { hex: '#0000FF', frequency: 3 },
    ];
    const result = clusterColors(entries);
    expect(result).toHaveLength(2);
  });
});

describe('isNearBlackOrWhite', () => {
  it('returns true for black and white', () => {
    expect(isNearBlackOrWhite('#000000')).toBe(true);
    expect(isNearBlackOrWhite('#FFFFFF')).toBe(true);
  });

  it('returns true for near-black', () => {
    expect(isNearBlackOrWhite('#0A0A0A')).toBe(true);
  });

  it('returns false for chromatic colors', () => {
    expect(isNearBlackOrWhite('#0066CC')).toBe(false);
    expect(isNearBlackOrWhite('#FF0000')).toBe(false);
  });
});

describe('extractColorsFromDocument', () => {
  it('extracts colors from styled elements', () => {
    // Create a minimal mock document
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');
    const p = document.createElement('p');

    div1.style.backgroundColor = 'rgb(0, 102, 204)';
    div1.style.color = 'rgb(255, 255, 255)';
    div2.style.backgroundColor = 'rgb(0, 102, 204)';
    p.style.color = 'rgb(51, 51, 51)';

    document.body.appendChild(div1);
    document.body.appendChild(div2);
    document.body.appendChild(p);

    const colors = extractColorsFromDocument(document);

    // Should find colors — the exact set depends on defaults in the test env,
    // but our explicitly set colors should appear
    expect(colors.length).toBeGreaterThan(0);

    const hexes = colors.map(c => c.hex);
    expect(hexes).toContain('#0066CC');

    // Cleanup
    document.body.removeChild(div1);
    document.body.removeChild(div2);
    document.body.removeChild(p);
  });

  it('sorts chromatic colors before near-black/white', () => {
    const div = document.createElement('div');
    div.style.backgroundColor = 'rgb(255, 0, 0)';
    div.style.color = 'rgb(0, 0, 0)';
    document.body.appendChild(div);

    const colors = extractColorsFromDocument(document);
    if (colors.length >= 2) {
      const firstNearBW = colors.findIndex(c => isNearBlackOrWhite(c.hex));
      const lastChromatic = colors.findLastIndex(c => !isNearBlackOrWhite(c.hex));
      if (firstNearBW !== -1 && lastChromatic !== -1) {
        expect(lastChromatic).toBeLessThan(firstNearBW);
      }
    }

    document.body.removeChild(div);
  });
});
