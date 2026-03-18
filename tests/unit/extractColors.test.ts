/**
 * Unit tests for the extract-colors API logic.
 * We import and test the internal helpers by extracting them.
 * Since the API module is a default export handler, we test the
 * color extraction logic by recreating the key pure functions here.
 */

import { describe, test, expect } from 'vitest';

// --- Reproduce the pure functions from extract-colors.ts for unit testing ---

const NAMED_COLORS: Record<string, string> = {
  red: '#ff0000', blue: '#0000ff', green: '#008000', white: '#ffffff',
  black: '#000000', coral: '#ff7f50', navy: '#000080', teal: '#008080',
  orange: '#ffa500', purple: '#800080', yellow: '#ffff00', pink: '#ffc0cb',
};

function normalizeToHex(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(s)) return s.toUpperCase();
  if (/^#[0-9a-f]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toUpperCase();
  }
  const rgbMatch = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) {
    const [, rs, gs, bs] = rgbMatch;
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const r = clamp(parseInt(rs, 10));
    const g = clamp(parseInt(gs, 10));
    const b = clamp(parseInt(bs, 10));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  const hslMatch = s.match(/^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%/);
  if (hslMatch) {
    const [, hs, ss, ls] = hslMatch;
    const h = parseInt(hs, 10) / 360;
    const sat = parseInt(ss, 10) / 100;
    const lit = parseInt(ls, 10) / 100;
    let r: number, g: number, b: number;
    if (sat === 0) {
      r = g = b = lit;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = lit < 0.5 ? lit * (1 + sat) : lit + sat - lit * sat;
      const p = 2 * lit - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return '#' + [r, g, b]
      .map(v => Math.round(v * 255).toString(16).padStart(2, '0'))
      .join('').toUpperCase();
  }
  if (NAMED_COLORS[s]) return NAMED_COLORS[s].toUpperCase();
  return null;
}

function hexToRgbArray(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgbArray(a);
  const [r2, g2, b2] = hexToRgbArray(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

interface ColorEntry { hex: string; frequency: number; }

function clusterColors(entries: ColorEntry[], threshold = 30): ColorEntry[] {
  const clusters: ColorEntry[] = [];
  for (const entry of entries) {
    const match = clusters.find(c => colorDistance(c.hex, entry.hex) < threshold);
    if (match) {
      match.frequency += entry.frequency;
    } else {
      clusters.push({ ...entry });
    }
  }
  return clusters;
}

function extractColorsFromCSS(css: string): Map<string, number> {
  const counts = new Map<string, number>();
  const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  let match: RegExpExecArray | null;
  while ((match = hexRegex.exec(css)) !== null) {
    const hex = normalizeToHex(match[0]);
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  const rgbRegex = /rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)/gi;
  while ((match = rgbRegex.exec(css)) !== null) {
    const hex = normalizeToHex(match[0]);
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  const hslRegex = /hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*[\d.]+)?\s*\)/gi;
  while ((match = hslRegex.exec(css)) !== null) {
    const hex = normalizeToHex(match[0]);
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  return counts;
}

// --- Tests ---

describe('normalizeToHex', () => {
  test('normalizes 6-digit hex', () => {
    expect(normalizeToHex('#ff0000')).toBe('#FF0000');
    expect(normalizeToHex('#ABCDEF')).toBe('#ABCDEF');
  });

  test('expands 3-digit hex shorthand', () => {
    expect(normalizeToHex('#f00')).toBe('#FF0000');
    expect(normalizeToHex('#abc')).toBe('#AABBCC');
  });

  test('converts rgb() to hex', () => {
    expect(normalizeToHex('rgb(255, 0, 0)')).toBe('#FF0000');
    expect(normalizeToHex('rgb(0, 128, 0)')).toBe('#008000');
  });

  test('converts rgba() to hex (ignores alpha)', () => {
    expect(normalizeToHex('rgba(255, 255, 0, 0.5)')).toBe('#FFFF00');
  });

  test('clamps out-of-range RGB values', () => {
    // Only positive integers are matched by the regex (CSS spec)
    expect(normalizeToHex('rgb(300, 0, 128)')).toBe('#FF0080');
  });

  test('converts hsl() to hex', () => {
    expect(normalizeToHex('hsl(0, 100%, 50%)')).toBe('#FF0000');
    expect(normalizeToHex('hsl(0, 0%, 0%)')).toBe('#000000');
    expect(normalizeToHex('hsl(0, 0%, 100%)')).toBe('#FFFFFF');
  });

  test('converts named CSS colors', () => {
    expect(normalizeToHex('red')).toBe('#FF0000');
    expect(normalizeToHex('navy')).toBe('#000080');
    expect(normalizeToHex('teal')).toBe('#008080');
  });

  test('returns null for invalid input', () => {
    expect(normalizeToHex('notacolor')).toBeNull();
    expect(normalizeToHex('#xyz')).toBeNull();
    expect(normalizeToHex('')).toBeNull();
  });
});

describe('colorDistance', () => {
  test('identical colors have zero distance', () => {
    expect(colorDistance('#FF0000', '#FF0000')).toBe(0);
  });

  test('black and white have maximum distance', () => {
    const dist = colorDistance('#000000', '#FFFFFF');
    expect(dist).toBeCloseTo(441.67, 0);
  });

  test('similar colors have small distance', () => {
    const dist = colorDistance('#FF0000', '#FE0101');
    expect(dist).toBeLessThan(5);
  });
});

describe('clusterColors', () => {
  test('merges similar colors', () => {
    const entries: ColorEntry[] = [
      { hex: '#FF0000', frequency: 5 },
      { hex: '#FE0101', frequency: 3 },
    ];
    const result = clusterColors(entries);
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe(8);
  });

  test('keeps distinct colors separate', () => {
    const entries: ColorEntry[] = [
      { hex: '#FF0000', frequency: 5 },
      { hex: '#0000FF', frequency: 3 },
    ];
    const result = clusterColors(entries);
    expect(result).toHaveLength(2);
  });
});

describe('extractColorsFromCSS', () => {
  test('extracts hex colors', () => {
    const css = 'body { color: #333333; background: #fff; }';
    const result = extractColorsFromCSS(css);
    expect(result.has('#333333')).toBe(true);
    expect(result.has('#FFFFFF')).toBe(true);
  });

  test('extracts rgb colors', () => {
    const css = '.foo { color: rgb(255, 0, 0); }';
    const result = extractColorsFromCSS(css);
    expect(result.has('#FF0000')).toBe(true);
  });

  test('extracts hsl colors', () => {
    const css = '.bar { background: hsl(120, 100%, 50%); }';
    const result = extractColorsFromCSS(css);
    expect(result.size).toBeGreaterThan(0);
  });

  test('counts repeated colors', () => {
    const css = '.a { color: #0066cc; } .b { color: #0066cc; } .c { color: #0066cc; }';
    const result = extractColorsFromCSS(css);
    expect(result.get('#0066CC')).toBe(3);
  });

  test('returns empty map for CSS with no colors', () => {
    const css = 'body { font-size: 16px; margin: 0; }';
    const result = extractColorsFromCSS(css);
    expect(result.size).toBe(0);
  });
});
