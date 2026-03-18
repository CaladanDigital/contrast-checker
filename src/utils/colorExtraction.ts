/**
 * Client-side color extraction from rendered DOM elements.
 * Uses getComputedStyle() to read resolved CSS values (including CSS variables).
 */

import { rgbToHex } from './colorValidation';

export interface ColorEntry {
  hex: string;
  frequency: number;
}

/** Parse a computed CSS color value (rgb/rgba) to uppercase 6-digit hex. Returns null for transparent. */
export function parseComputedColor(value: string): string | null {
  if (!value || value === 'transparent') return null;

  const rgbaMatch = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/
  );
  if (!rgbaMatch) return null;

  const r = parseInt(rgbaMatch[1], 10);
  const g = parseInt(rgbaMatch[2], 10);
  const b = parseInt(rgbaMatch[3], 10);
  const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;

  // Skip fully transparent
  if (a === 0) return null;

  return rgbToHex(r, g, b);
}

/** Euclidean distance between two hex colors in RGB space. */
export function colorDistance(a: string, b: string): number {
  const r1 = parseInt(a.slice(1, 3), 16);
  const g1 = parseInt(a.slice(3, 5), 16);
  const b1 = parseInt(a.slice(5, 7), 16);
  const r2 = parseInt(b.slice(1, 3), 16);
  const g2 = parseInt(b.slice(3, 5), 16);
  const b2 = parseInt(b.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/** Cluster similar colors (RGB distance < threshold) and sum their frequencies. */
export function clusterColors(entries: ColorEntry[], threshold = 30): ColorEntry[] {
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

/** Returns true if the color is very close to pure black or pure white. */
export function isNearBlackOrWhite(hex: string): boolean {
  return colorDistance(hex, '#000000') < 30 || colorDistance(hex, '#FFFFFF') < 30;
}

const SELECTORS = 'body,main,header,footer,nav,section,article,div,h1,h2,h3,h4,h5,h6,a,button,p,span,li';
const MAX_ELEMENTS = 200;

/** Extract dominant colors from a rendered Document by reading computed styles. */
export function extractColorsFromDocument(doc: Document): ColorEntry[] {
  const counts = new Map<string, number>();

  const elements = Array.from(doc.querySelectorAll(SELECTORS)).slice(0, MAX_ELEMENTS);
  const properties = ['color', 'backgroundColor', 'borderColor'] as const;

  for (const el of elements) {
    const style = doc.defaultView?.getComputedStyle(el);
    if (!style) continue;

    for (const prop of properties) {
      const hex = parseComputedColor(style[prop]);
      if (hex) {
        counts.set(hex, (counts.get(hex) || 0) + 1);
      }
    }
  }

  // Convert to array and cluster
  let entries: ColorEntry[] = Array.from(counts.entries())
    .map(([hex, frequency]) => ({ hex, frequency }));

  entries = clusterColors(entries);

  // Sort: chromatic colors first (by frequency), then near-black/white at the end
  entries.sort((a, b) => {
    const aGray = isNearBlackOrWhite(a.hex);
    const bGray = isNearBlackOrWhite(b.hex);
    if (aGray !== bGray) return aGray ? 1 : -1;
    return b.frequency - a.frequency;
  });

  return entries.slice(0, 6);
}
