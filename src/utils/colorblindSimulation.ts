/**
 * Colorblind simulation using Brettel/Vienot/Mollon matrices.
 * Simulates how colors appear to people with color vision deficiencies.
 */

import { hexToRgb, rgbToHex } from './colorValidation';

export type ColorblindType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

const COLORBLIND_MATRICES: Record<ColorblindType, number[][]> = {
  protanopia: [
    [0.567, 0.433, 0.000],
    [0.558, 0.442, 0.000],
    [0.000, 0.242, 0.758]
  ],
  deuteranopia: [
    [0.625, 0.375, 0.000],
    [0.700, 0.300, 0.000],
    [0.000, 0.300, 0.700]
  ],
  tritanopia: [
    [0.950, 0.050, 0.000],
    [0.000, 0.433, 0.567],
    [0.000, 0.475, 0.525]
  ],
  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114]
  ]
};

/**
 * Simulate how a color appears under a specific color vision deficiency.
 * Returns simulated hex color with RGB clamping to 0-255.
 */
export function simulateColorblindness(hex: string, type: ColorblindType): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const matrix = COLORBLIND_MATRICES[type];

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const newR = (matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b) * 255;
  const newG = (matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b) * 255;
  const newB = (matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b) * 255;

  // rgbToHex already clamps to 0-255
  return rgbToHex(newR, newG, newB);
}

export const COLORBLIND_TYPES: ColorblindType[] = [
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia'
];
