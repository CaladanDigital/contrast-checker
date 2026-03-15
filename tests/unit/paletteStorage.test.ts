import { describe, test, expect, beforeEach } from 'vitest';
import { getSavedPalettes, savePalette, deletePalette, renamePalette } from '../../src/utils/paletteStorage';

describe('paletteStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('getSavedPalettes returns empty array when nothing stored', () => {
    expect(getSavedPalettes()).toEqual([]);
  });

  test('savePalette creates a palette and persists it', () => {
    const palette = savePalette('Test', '#000000', '#FFFFFF');
    expect(palette.name).toBe('Test');
    expect(palette.fg).toBe('#000000');
    expect(palette.bg).toBe('#FFFFFF');
    expect(palette.id).toBeTruthy();
    expect(palette.createdAt).toBeTruthy();

    const saved = getSavedPalettes();
    expect(saved.length).toBe(1);
    expect(saved[0].id).toBe(palette.id);
  });

  test('savePalette uses default name when empty', () => {
    const palette = savePalette('', '#000000', '#FFFFFF');
    expect(palette.name).toBe('Palette 1');
  });

  test('savePalette trims name', () => {
    const palette = savePalette('  My Palette  ', '#000000', '#FFFFFF');
    expect(palette.name).toBe('My Palette');
  });

  test('multiple palettes are stored', () => {
    savePalette('First', '#000000', '#FFFFFF');
    savePalette('Second', '#FF0000', '#00FF00');
    const saved = getSavedPalettes();
    expect(saved.length).toBe(2);
  });

  test('deletePalette removes by ID', () => {
    const p1 = savePalette('First', '#000000', '#FFFFFF');
    savePalette('Second', '#FF0000', '#00FF00');
    deletePalette(p1.id);
    const saved = getSavedPalettes();
    expect(saved.length).toBe(1);
    expect(saved[0].name).toBe('Second');
  });

  test('deletePalette with non-existent ID does nothing', () => {
    savePalette('First', '#000000', '#FFFFFF');
    deletePalette('non-existent-id');
    expect(getSavedPalettes().length).toBe(1);
  });

  test('renamePalette updates name', () => {
    const palette = savePalette('Old Name', '#000000', '#FFFFFF');
    renamePalette(palette.id, 'New Name');
    const saved = getSavedPalettes();
    expect(saved[0].name).toBe('New Name');
  });

  test('renamePalette trims new name', () => {
    const palette = savePalette('Old', '#000000', '#FFFFFF');
    renamePalette(palette.id, '  New  ');
    expect(getSavedPalettes()[0].name).toBe('New');
  });

  test('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('acc_saved_palettes', 'not-json');
    expect(getSavedPalettes()).toEqual([]);
  });

  test('handles non-array localStorage gracefully', () => {
    localStorage.setItem('acc_saved_palettes', '{"not": "array"}');
    expect(getSavedPalettes()).toEqual([]);
  });
});
