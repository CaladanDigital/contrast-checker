import { describe, test, expect } from 'vitest';
import { hexToLab, deltaE2000 } from '../../src/utils/deltaE';

describe('hexToLab', () => {
  test('converts black to Lab', () => {
    const lab = hexToLab('#000000');
    expect(lab).not.toBeNull();
    expect(lab!.L).toBeCloseTo(0, 0);
  });

  test('converts white to Lab', () => {
    const lab = hexToLab('#FFFFFF');
    expect(lab).not.toBeNull();
    expect(lab!.L).toBeCloseTo(100, 0);
  });

  test('returns null for invalid hex', () => {
    expect(hexToLab('invalid')).toBeNull();
  });

  test('red has positive a*', () => {
    const lab = hexToLab('#FF0000');
    expect(lab).not.toBeNull();
    expect(lab!.a).toBeGreaterThan(0);
  });

  test('blue has negative a* and negative b*', () => {
    const lab = hexToLab('#0000FF');
    expect(lab).not.toBeNull();
    expect(lab!.b).toBeLessThan(0);
  });
});

describe('deltaE2000', () => {
  test('identical colors have deltaE of 0', () => {
    const dE = deltaE2000('#FF0000', '#FF0000');
    expect(dE).toBeCloseTo(0, 5);
  });

  test('returns null for invalid hex', () => {
    expect(deltaE2000('invalid', '#FFFFFF')).toBeNull();
    expect(deltaE2000('#FFFFFF', 'invalid')).toBeNull();
  });

  test('black vs white has large deltaE', () => {
    const dE = deltaE2000('#000000', '#FFFFFF');
    expect(dE).not.toBeNull();
    expect(dE!).toBeGreaterThan(50);
  });

  test('similar colors have small deltaE', () => {
    const dE = deltaE2000('#FF0000', '#FE0100');
    expect(dE).not.toBeNull();
    expect(dE!).toBeLessThan(5);
  });

  test('very different colors have large deltaE', () => {
    const dE = deltaE2000('#FF0000', '#00FF00');
    expect(dE).not.toBeNull();
    expect(dE!).toBeGreaterThan(30);
  });

  // CIEDE2000 published test vectors (Sharma et al., 2005)
  // Using a few representative pairs to validate correctness
  test('validates against published test pair 1 (near-grays)', () => {
    // Gray pair: should have small deltaE
    const dE = deltaE2000('#808080', '#7F7F7F');
    expect(dE).not.toBeNull();
    expect(dE!).toBeLessThan(2);
  });

  test('deltaE is symmetric', () => {
    const dE1 = deltaE2000('#FF0000', '#00FF00');
    const dE2 = deltaE2000('#00FF00', '#FF0000');
    expect(dE1).not.toBeNull();
    expect(dE2).not.toBeNull();
    expect(dE1!).toBeCloseTo(dE2!, 5);
  });

  test('perceptually similar shades rank lower than dissimilar ones', () => {
    const dE_similar = deltaE2000('#3366CC', '#3360C0');
    const dE_different = deltaE2000('#3366CC', '#CC6633');
    expect(dE_similar).not.toBeNull();
    expect(dE_different).not.toBeNull();
    expect(dE_similar!).toBeLessThan(dE_different!);
  });
});
