import { describe, it, expect, beforeEach } from 'vitest';
import { readColorsFromHash, writeColorsToHash } from '../../src/dom/hashSync';

describe('readColorsFromHash', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('parses valid hash with fg and bg', () => {
    window.location.hash = '#fg=FF0000&bg=FFFFFF';
    const result = readColorsFromHash();
    expect(result).toEqual({ fg: '#FF0000', bg: '#FFFFFF' });
  });

  it('parses lowercase hex values', () => {
    window.location.hash = '#fg=aabbcc&bg=112233';
    const result = readColorsFromHash();
    expect(result).toEqual({ fg: '#AABBCC', bg: '#112233' });
  });

  it('returns null for empty hash', () => {
    window.location.hash = '';
    expect(readColorsFromHash()).toBeNull();
  });

  it('returns null for hash with only fg', () => {
    window.location.hash = '#fg=FF0000';
    expect(readColorsFromHash()).toBeNull();
  });

  it('returns null for hash with only bg', () => {
    window.location.hash = '#bg=FFFFFF';
    expect(readColorsFromHash()).toBeNull();
  });

  it('returns null for malformed hex values', () => {
    window.location.hash = '#fg=ZZZZZZ&bg=FFFFFF';
    expect(readColorsFromHash()).toBeNull();
  });

  it('returns null for XSS payload in fg', () => {
    window.location.hash = '#fg=<script>alert(1)</script>&bg=FFFFFF';
    expect(readColorsFromHash()).toBeNull();
  });

  it('returns null for XSS payload in bg', () => {
    window.location.hash = '#fg=FF0000&bg=javascript:alert(1)';
    expect(readColorsFromHash()).toBeNull();
  });

  it('returns null for XSS img onerror payload', () => {
    window.location.hash = '#fg="><img onerror=alert(1)>&bg=FFFFFF';
    expect(readColorsFromHash()).toBeNull();
  });

  it('returns null for too-short hex values', () => {
    window.location.hash = '#fg=FF&bg=FFFFFF';
    expect(readColorsFromHash()).toBeNull();
  });

  it('handles 3-digit shorthand hex', () => {
    window.location.hash = '#fg=F00&bg=FFF';
    const result = readColorsFromHash();
    expect(result).toEqual({ fg: '#FF0000', bg: '#FFFFFF' });
  });
});

describe('writeColorsToHash', () => {
  it('writes colors to hash without # prefix', () => {
    writeColorsToHash('#FF0000', '#FFFFFF');
    expect(window.location.hash).toBe('#fg=FF0000&bg=FFFFFF');
  });

  it('strips # from input values', () => {
    writeColorsToHash('#AABBCC', '#112233');
    expect(window.location.hash).toBe('#fg=AABBCC&bg=112233');
  });
});
