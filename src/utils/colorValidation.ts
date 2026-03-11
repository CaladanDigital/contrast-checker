/**
 * Strict hex color validation and conversion utilities.
 * All user input MUST pass through these functions before use.
 */

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const HEX_SHORT_PATTERN = /^#[0-9A-Fa-f]{3}$/;

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Validate a hex color string. Returns normalized uppercase 6-digit hex or null.
 * This is the ONLY entry point for user color input.
 */
export function validateHex(input: string): string | null {
  if (typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Expand 3-digit shorthand: #RGB -> #RRGGBB
  if (HEX_SHORT_PATTERN.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  if (HEX_PATTERN.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}

/**
 * Convert validated hex to RGB. Only call with output from validateHex().
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})$/.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Convert RGB to hex. Clamps values to 0-255.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Check if a string is a valid hex color.
 */
export function isValidHex(input: string): boolean {
  return validateHex(input) !== null;
}
