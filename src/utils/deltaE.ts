/**
 * CIEDE2000 color difference calculation.
 * Used for ranking color suggestions by perceptual similarity.
 * Reference: "The CIEDE2000 Color-Difference Formula" (Sharma, Wu, Dalal, 2005)
 */

import { hexToRgb } from './colorValidation';

interface Lab {
  L: number;
  a: number;
  b: number;
}

/** Convert hex color to CIE L*a*b*. */
export function hexToLab(hex: string): Lab | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  // sRGB to linear
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Linear RGB to XYZ (D65 illuminant)
  let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  // Normalize by D65 reference white
  x /= 0.95047;
  y /= 1.00000;
  z /= 1.08883;

  // XYZ to Lab
  const epsilon = 0.008856;
  const kappa = 903.3;

  const fx = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116;
  const fy = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116;
  const fz = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116;

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/** Calculate CIEDE2000 color difference between two hex colors. */
export function deltaE2000(hex1: string, hex2: string): number | null {
  const lab1 = hexToLab(hex1);
  const lab2 = hexToLab(hex2);
  if (!lab1 || !lab2) return null;

  return deltaE2000Lab(lab1, lab2);
}

/** CIEDE2000 between two Lab colors. */
export function deltaE2000Lab(lab1: Lab, lab2: Lab): number {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Step 1: Calculate C'ab, h'ab
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cab = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cab, 7) / (Math.pow(Cab, 7) + Math.pow(25, 7))));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  let h1p = Math.atan2(b1, a1p) * deg;
  if (h1p < 0) h1p += 360;

  let h2p = Math.atan2(b2, a2p) * deg;
  if (h2p < 0) h2p += 360;

  // Step 2: Calculate delta values
  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);

  // Step 3: Calculate CIEDE2000
  const Lp = (L1 + L2) / 2;
  const Cp = (C1p + C2p) / 2;

  let hp: number;
  if (C1p * C2p === 0) {
    hp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hp = (h1p + h2p + 360) / 2;
  } else {
    hp = (h1p + h2p - 360) / 2;
  }

  const T = 1
    - 0.17 * Math.cos((hp - 30) * rad)
    + 0.24 * Math.cos(2 * hp * rad)
    + 0.32 * Math.cos((3 * hp + 6) * rad)
    - 0.20 * Math.cos((4 * hp - 63) * rad);

  const SL = 1 + (0.015 * Math.pow(Lp - 50, 2)) / Math.sqrt(20 + Math.pow(Lp - 50, 2));
  const SC = 1 + 0.045 * Cp;
  const SH = 1 + 0.015 * Cp * T;

  const RT_exp = -Math.pow((hp - 275) / 25, 2);
  const RT = -2 * Math.sqrt(Math.pow(Cp, 7) / (Math.pow(Cp, 7) + Math.pow(25, 7)))
    * Math.sin(60 * Math.exp(RT_exp) * rad);

  const result = Math.sqrt(
    Math.pow(dLp / SL, 2) +
    Math.pow(dCp / SC, 2) +
    Math.pow(dHp / SH, 2) +
    RT * (dCp / SC) * (dHp / SH)
  );

  return result;
}
