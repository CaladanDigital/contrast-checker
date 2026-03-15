/**
 * License validation API client.
 * In MOCK_MODE, validates locally against key pattern.
 * When connected to Lemon Squeezy, calls /api/validate-license.
 */

import { MOCK_MODE, isValidLicenseKey } from './proGate';

export interface LicenseValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a license key. In mock mode, checks format only.
 * In production, calls the serverless endpoint.
 */
export async function validateLicense(
  key: string,
  email: string
): Promise<LicenseValidationResult> {
  if (!isValidLicenseKey(key)) {
    return { valid: false, error: 'Invalid license key format. Expected: ACPRO-XXXX-XXXX-XXXX' };
  }

  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  if (MOCK_MODE) {
    return { valid: true };
  }

  try {
    const response = await fetch('/api/validate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key.trim().toUpperCase(), email: email.trim() }),
    });

    if (!response.ok) {
      return { valid: false, error: 'Server error. Please try again.' };
    }

    const data = await response.json();
    return { valid: data.valid, error: data.error };
  } catch {
    return { valid: false, error: 'Network error. Please check your connection.' };
  }
}
