import { describe, test, expect, beforeEach } from 'vitest';
import {
  isPro,
  isValidLicenseKey,
  getStoredLicense,
  storeLicense,
  clearLicense,
  onProStatusChange,
  initProGate
} from '../../src/utils/proGate';

describe('proGate', () => {
  beforeEach(() => {
    localStorage.clear();
    clearLicense();
  });

  test('isPro returns false by default', () => {
    expect(isPro()).toBe(false);
  });

  test('isValidLicenseKey accepts correct format', () => {
    expect(isValidLicenseKey('ACPRO-ABCD-1234-WXYZ')).toBe(true);
    expect(isValidLicenseKey('acpro-abcd-1234-wxyz')).toBe(true);
  });

  test('isValidLicenseKey rejects invalid formats', () => {
    expect(isValidLicenseKey('')).toBe(false);
    expect(isValidLicenseKey('INVALID')).toBe(false);
    expect(isValidLicenseKey('ACPRO-ABCD-1234')).toBe(false);
    expect(isValidLicenseKey('XXXX-ABCD-1234-WXYZ')).toBe(false);
    expect(isValidLicenseKey('ACPRO-AB!D-1234-WXYZ')).toBe(false);
  });

  test('storeLicense activates Pro and persists to localStorage', () => {
    storeLicense('ACPRO-ABCD-1234-WXYZ', 'test@example.com');
    expect(isPro()).toBe(true);
    const stored = getStoredLicense();
    expect(stored).not.toBeNull();
    expect(stored!.key).toBe('ACPRO-ABCD-1234-WXYZ');
    expect(stored!.email).toBe('test@example.com');
    expect(stored!.activatedAt).toBeTruthy();
  });

  test('clearLicense deactivates Pro and clears localStorage', () => {
    storeLicense('ACPRO-ABCD-1234-WXYZ', 'test@example.com');
    clearLicense();
    expect(isPro()).toBe(false);
    expect(getStoredLicense()).toBeNull();
  });

  test('getStoredLicense returns null when nothing stored', () => {
    expect(getStoredLicense()).toBeNull();
  });

  test('onProStatusChange notifies on activation', () => {
    const calls: boolean[] = [];
    onProStatusChange((active) => calls.push(active));
    storeLicense('ACPRO-ABCD-1234-WXYZ', 'test@example.com');
    expect(calls).toEqual([true]);
  });

  test('onProStatusChange notifies on deactivation', () => {
    storeLicense('ACPRO-ABCD-1234-WXYZ', 'test@example.com');
    const calls: boolean[] = [];
    onProStatusChange((active) => calls.push(active));
    clearLicense();
    expect(calls).toEqual([false]);
  });

  test('unsubscribe prevents further notifications', () => {
    const calls: boolean[] = [];
    const unsub = onProStatusChange((active) => calls.push(active));
    unsub();
    storeLicense('ACPRO-ABCD-1234-WXYZ', 'test@example.com');
    expect(calls).toEqual([]);
  });

  test('initProGate restores Pro from valid localStorage', () => {
    localStorage.setItem('acc_license_key', 'ACPRO-ABCD-1234-WXYZ');
    localStorage.setItem('acc_license_activated', '2026-01-01T00:00:00Z');
    initProGate();
    expect(isPro()).toBe(true);
  });

  test('initProGate does not activate for invalid stored key', () => {
    localStorage.setItem('acc_license_key', 'INVALID-KEY');
    localStorage.setItem('acc_license_activated', '2026-01-01T00:00:00Z');
    clearLicense(); // reset state
    localStorage.setItem('acc_license_key', 'INVALID-KEY');
    localStorage.setItem('acc_license_activated', '2026-01-01T00:00:00Z');
    initProGate();
    expect(isPro()).toBe(false);
  });

  test('storeLicense uppercases key', () => {
    storeLicense('acpro-abcd-1234-wxyz', 'test@example.com');
    const stored = getStoredLicense();
    expect(stored!.key).toBe('ACPRO-ABCD-1234-WXYZ');
  });

  test('storeLicense trims email', () => {
    storeLicense('ACPRO-ABCD-1234-WXYZ', '  test@example.com  ');
    const stored = getStoredLicense();
    expect(stored!.email).toBe('test@example.com');
  });
});
