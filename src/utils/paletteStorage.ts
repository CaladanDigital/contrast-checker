/**
 * Saved palettes storage using localStorage.
 * CRUD operations for saved foreground/background pairs.
 */

const STORAGE_KEY = 'acc_saved_palettes';

export interface SavedPalette {
  id: string;
  name: string;
  fg: string;
  bg: string;
  createdAt: string;
}

/** Get all saved palettes. */
export function getSavedPalettes(): SavedPalette[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/** Save a new palette. Returns the created palette. */
export function savePalette(name: string, fg: string, bg: string): SavedPalette {
  const palettes = getSavedPalettes();
  const palette: SavedPalette = {
    id: crypto.randomUUID(),
    name: name.trim() || `Palette ${palettes.length + 1}`,
    fg,
    bg,
    createdAt: new Date().toISOString(),
  };
  palettes.push(palette);
  persistPalettes(palettes);
  return palette;
}

/** Delete a palette by ID. */
export function deletePalette(id: string): void {
  const palettes = getSavedPalettes().filter(p => p.id !== id);
  persistPalettes(palettes);
}

/** Rename a palette. */
export function renamePalette(id: string, newName: string): void {
  const palettes = getSavedPalettes();
  const palette = palettes.find(p => p.id === id);
  if (palette) {
    palette.name = newName.trim();
    persistPalettes(palettes);
  }
}

function persistPalettes(palettes: SavedPalette[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
  } catch {
    // localStorage full or unavailable
  }
}
