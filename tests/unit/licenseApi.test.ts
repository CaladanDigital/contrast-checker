import { describe, test, expect } from 'vitest';
import { validateLicense } from '../../src/utils/licenseApi';

describe('validateLicense', () => {
  test('rejects invalid key format', async () => {
    const result = await validateLicense('INVALID', 'test@example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('format');
  });

  test('rejects empty email', async () => {
    const result = await validateLicense('ACPRO-ABCD-1234-WXYZ', '');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('email');
  });

  test('rejects email without @', async () => {
    const result = await validateLicense('ACPRO-ABCD-1234-WXYZ', 'notanemail');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('email');
  });

  test('accepts valid key and email in mock mode', async () => {
    const result = await validateLicense('ACPRO-ABCD-1234-WXYZ', 'test@example.com');
    expect(result.valid).toBe(true);
  });

  test('accepts lowercase key in mock mode', async () => {
    const result = await validateLicense('acpro-abcd-1234-wxyz', 'test@example.com');
    expect(result.valid).toBe(true);
  });
});
