/**
 * Pro license state management.
 * Handles localStorage persistence and notifies listeners on status change.
 */

const STORAGE_KEY_LICENSE = 'acc_license_key';
const STORAGE_KEY_ACTIVATED = 'acc_license_activated';
const STORAGE_KEY_EMAIL = 'acc_license_email';

const LICENSE_PATTERN = /^ACPRO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Mock mode: any key matching pattern is treated as valid (no server call). */
export const MOCK_MODE = true;

type ProStatusCallback = (isPro: boolean) => void;
const listeners: ProStatusCallback[] = [];

let proActive = false;

export interface StoredLicense {
  key: string;
  email: string;
  activatedAt: string;
}

/** Check if the user has an active Pro license. */
export function isPro(): boolean {
  return proActive;
}

/** Validate license key format. */
export function isValidLicenseKey(key: string): boolean {
  return LICENSE_PATTERN.test(key.trim().toUpperCase());
}

/** Get stored license info, or null if none. */
export function getStoredLicense(): StoredLicense | null {
  try {
    const key = localStorage.getItem(STORAGE_KEY_LICENSE);
    const email = localStorage.getItem(STORAGE_KEY_EMAIL);
    const activatedAt = localStorage.getItem(STORAGE_KEY_ACTIVATED);
    if (key && activatedAt) {
      return { key, email: email || '', activatedAt };
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

/** Store and activate a license. */
export function storeLicense(key: string, email: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_LICENSE, key.trim().toUpperCase());
    localStorage.setItem(STORAGE_KEY_EMAIL, email.trim());
    localStorage.setItem(STORAGE_KEY_ACTIVATED, new Date().toISOString());
  } catch {
    // localStorage unavailable
  }
  proActive = true;
  notifyListeners();
}

/** Clear stored license and deactivate Pro. */
export function clearLicense(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LICENSE);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    localStorage.removeItem(STORAGE_KEY_ACTIVATED);
  } catch {
    // localStorage unavailable
  }
  proActive = false;
  notifyListeners();
}

/** Register a callback for Pro status changes. Returns unsubscribe function. */
export function onProStatusChange(callback: ProStatusCallback): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notifyListeners(): void {
  for (const cb of listeners) {
    cb(proActive);
  }
}

/** Restore Pro state from localStorage on module load. */
export function initProGate(): void {
  // Admin bypass: ?admin=true auto-activates Pro with test key
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      storeLicense('ACPRO-TEST-ADMN-KEY1', 'admin@accessibilitycolor.com');
      return;
    }
  }

  const stored = getStoredLicense();
  if (stored && isValidLicenseKey(stored.key)) {
    proActive = true;
  }
}

// Auto-init on module load
initProGate();
