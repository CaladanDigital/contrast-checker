/**
 * Saved palettes UI.
 * Save button, palette list, load/delete actions.
 */

import { isPro, onProStatusChange } from '../utils/proGate';
import { getSavedPalettes, savePalette, deletePalette, type SavedPalette } from '../utils/paletteStorage';
import { renderUpgradeCTA } from './proUpgrade';

let container: HTMLElement | null = null;

function render(): void {
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  if (!isPro()) {
    renderUpgradeCTA(container, 'Saved Palettes');
    return;
  }

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-palette-btn';
  saveBtn.textContent = 'Save Current Colors';
  saveBtn.addEventListener('click', () => {
    const fg = (document.getElementById('foregroundHex') as HTMLInputElement)?.value || '#000000';
    const bg = (document.getElementById('backgroundHex') as HTMLInputElement)?.value || '#FFFFFF';
    const name = prompt('Palette name (optional):') || '';
    savePalette(name, fg, bg);
    render();
  });
  container.appendChild(saveBtn);

  // Palette list
  const palettes = getSavedPalettes();

  if (palettes.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'saved-empty-state';
    empty.textContent = 'No saved palettes yet. Click "Save Current Colors" to save your first one.';
    container.appendChild(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'saved-palettes-list';

  palettes.forEach((palette: SavedPalette) => {
    const item = document.createElement('div');
    item.className = 'saved-palette-item';

    // Swatches
    const swatches = document.createElement('div');
    swatches.className = 'saved-palette-swatches';

    const fgSwatch = document.createElement('div');
    fgSwatch.className = 'saved-palette-swatch';
    fgSwatch.style.backgroundColor = palette.fg;
    fgSwatch.title = `Foreground: ${palette.fg}`;

    const bgSwatch = document.createElement('div');
    bgSwatch.className = 'saved-palette-swatch';
    bgSwatch.style.backgroundColor = palette.bg;
    bgSwatch.title = `Background: ${palette.bg}`;

    swatches.appendChild(fgSwatch);
    swatches.appendChild(bgSwatch);
    item.appendChild(swatches);

    // Name
    const nameEl = document.createElement('span');
    nameEl.className = 'saved-palette-name';
    nameEl.textContent = palette.name;
    item.appendChild(nameEl);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'saved-palette-actions';

    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load';
    loadBtn.setAttribute('aria-label', `Load palette ${palette.name}`);
    loadBtn.addEventListener('click', () => loadPalette(palette));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete palette ${palette.name}`);
    deleteBtn.addEventListener('click', () => {
      deletePalette(palette.id);
      render();
    });

    actions.appendChild(loadBtn);
    actions.appendChild(deleteBtn);
    item.appendChild(actions);

    list.appendChild(item);
  });

  container.appendChild(list);
}

function loadPalette(palette: SavedPalette): void {
  const fgColor = document.getElementById('foregroundColor') as HTMLInputElement | null;
  const fgHex = document.getElementById('foregroundHex') as HTMLInputElement | null;
  const bgColor = document.getElementById('backgroundColor') as HTMLInputElement | null;
  const bgHex = document.getElementById('backgroundHex') as HTMLInputElement | null;

  if (fgColor && fgHex) {
    fgColor.value = palette.fg;
    fgHex.value = palette.fg;
    fgHex.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (bgColor && bgHex) {
    bgColor.value = palette.bg;
    bgHex.value = palette.bg;
    bgHex.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const inputSection = document.getElementById('inputSection');
  if (inputSection) inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Initialize saved palettes section. */
export function setupSavedPalettes(): void {
  container = document.getElementById('savedPalettesContainer');
  if (!container) return;

  render();
  onProStatusChange(() => render());
}
