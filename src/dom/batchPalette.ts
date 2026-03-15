/**
 * Batch palette checker UI.
 * Color input rows, matrix generation, and summary stats.
 */

import { isPro, onProStatusChange } from '../utils/proGate';
import { generateMatrix } from '../utils/batchChecker';
import { validateHex } from '../utils/colorValidation';
import { renderUpgradeCTA } from './proUpgrade';

const MIN_COLORS = 2;
const MAX_COLORS = 12;
const DEFAULT_COLORS = ['#000000', '#FFFFFF'];

let colors: string[] = [...DEFAULT_COLORS];
let container: HTMLElement | null = null;

function render(): void {
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  // Color input row
  const colorRow = document.createElement('div');
  colorRow.className = 'batch-colors';

  colors.forEach((color, index) => {
    const item = document.createElement('div');
    item.className = 'batch-color-item';

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = color;
    picker.setAttribute('aria-label', `Palette color ${index + 1} picker`);
    picker.addEventListener('input', () => {
      colors[index] = picker.value.toUpperCase();
      hexInput.value = picker.value.toUpperCase();
    });

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.value = color;
    hexInput.maxLength = 7;
    hexInput.setAttribute('aria-label', `Palette color ${index + 1} hex`);
    hexInput.addEventListener('input', () => {
      const valid = validateHex(hexInput.value);
      if (valid) {
        colors[index] = valid;
        picker.value = valid;
      }
    });

    item.appendChild(picker);
    item.appendChild(hexInput);

    if (colors.length > MIN_COLORS) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'batch-remove-btn';
      removeBtn.textContent = '\u00D7';
      removeBtn.setAttribute('aria-label', `Remove color ${index + 1}`);
      removeBtn.addEventListener('click', () => {
        colors.splice(index, 1);
        render();
      });
      item.appendChild(removeBtn);
    }

    colorRow.appendChild(item);
  });

  if (colors.length < MAX_COLORS) {
    const addBtn = document.createElement('button');
    addBtn.className = 'batch-add-btn';
    addBtn.textContent = '+ Add Color';
    addBtn.addEventListener('click', () => {
      colors.push('#808080');
      render();
    });
    colorRow.appendChild(addBtn);
  }

  container.appendChild(colorRow);

  // Gate: free users see CTA instead of check button
  if (!isPro()) {
    renderUpgradeCTA(container, 'Batch Palette Checker');
    // Keep the color inputs above, re-insert them before the CTA
    const cta = container.querySelector('.upgrade-cta-inline');
    if (cta) {
      container.insertBefore(colorRow, cta);
    }
    return;
  }

  // Check All button
  const checkBtn = document.createElement('button');
  checkBtn.className = 'batch-check-btn';
  checkBtn.textContent = 'Check All Combinations';
  checkBtn.addEventListener('click', () => renderMatrix());
  container.appendChild(checkBtn);
}

function renderMatrix(): void {
  if (!container) return;

  // Remove old matrix/summary
  const oldWrap = container.querySelector('.batch-matrix-wrap');
  if (oldWrap) oldWrap.remove();
  const oldSummary = container.querySelector('.batch-summary');
  if (oldSummary) oldSummary.remove();

  const matrix = generateMatrix(colors);

  const wrap = document.createElement('div');
  wrap.className = 'batch-matrix-wrap';

  const table = document.createElement('table');
  table.className = 'batch-matrix';

  // Header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.appendChild(document.createElement('th')); // empty corner
  const headerLabel = document.createElement('th');
  headerLabel.colSpan = colors.length;
  headerLabel.textContent = 'Background \u2192';
  headerRow.appendChild(headerLabel);
  thead.appendChild(headerRow);

  const headerRow2 = document.createElement('tr');
  const fgLabel = document.createElement('th');
  fgLabel.textContent = 'FG \u2193 / BG \u2192';
  headerRow2.appendChild(fgLabel);
  colors.forEach((color) => {
    const th = document.createElement('th');
    const swatch = document.createElement('span');
    swatch.style.display = 'inline-block';
    swatch.style.width = '14px';
    swatch.style.height = '14px';
    swatch.style.borderRadius = '3px';
    swatch.style.backgroundColor = color;
    swatch.style.border = '1px solid rgba(0,0,0,0.15)';
    swatch.style.verticalAlign = 'middle';
    swatch.style.marginRight = '4px';
    th.appendChild(swatch);
    th.appendChild(document.createTextNode(color));
    headerRow2.appendChild(th);
  });
  thead.appendChild(headerRow2);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  let passAA = 0;
  let passAAA = 0;
  let total = 0;

  matrix.forEach((row, i) => {
    const tr = document.createElement('tr');
    const rowHeader = document.createElement('th');
    const swatch = document.createElement('span');
    swatch.style.display = 'inline-block';
    swatch.style.width = '14px';
    swatch.style.height = '14px';
    swatch.style.borderRadius = '3px';
    swatch.style.backgroundColor = colors[i];
    swatch.style.border = '1px solid rgba(0,0,0,0.15)';
    swatch.style.verticalAlign = 'middle';
    swatch.style.marginRight = '4px';
    rowHeader.appendChild(swatch);
    rowHeader.appendChild(document.createTextNode(colors[i]));
    tr.appendChild(rowHeader);

    row.forEach((cell) => {
      const td = document.createElement('td');
      if (!cell) {
        td.textContent = '\u2014';
        td.style.color = '#ccc';
      } else {
        total++;
        if (cell.wcag.aaNormal) passAA++;
        if (cell.wcag.aaaNormal) passAAA++;

        const cellDiv = document.createElement('div');
        cellDiv.className = `batch-matrix-cell ${cell.wcag.aaNormal ? 'pass' : 'fail'}`;
        cellDiv.style.backgroundColor = cell.bg;
        cellDiv.style.color = cell.fg;
        cellDiv.title = `${cell.fg} on ${cell.bg}: ${cell.ratioFormatted}`;

        const cellText = document.createElement('div');
        cellText.className = 'cell-text';
        cellText.textContent = 'Aa';
        cellDiv.appendChild(cellText);

        const cellRatio = document.createElement('div');
        cellRatio.className = 'cell-ratio';
        cellRatio.textContent = cell.ratioFormatted;
        cellDiv.appendChild(cellRatio);

        // Click to load pair into main checker
        cellDiv.addEventListener('click', () => {
          loadPairIntoChecker(cell.fg, cell.bg);
        });

        td.appendChild(cellDiv);
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);

  // Summary
  const summary = document.createElement('div');
  summary.className = 'batch-summary';

  const aaStat = document.createElement('span');
  aaStat.innerHTML = '';
  const aaStrong = document.createElement('strong');
  aaStrong.textContent = `${passAA} of ${total}`;
  aaStat.appendChild(aaStrong);
  aaStat.appendChild(document.createTextNode(' pass AA'));

  const aaaStat = document.createElement('span');
  const aaaStrong = document.createElement('strong');
  aaaStrong.textContent = `${passAAA} of ${total}`;
  aaaStat.appendChild(aaaStrong);
  aaaStat.appendChild(document.createTextNode(' pass AAA'));

  summary.appendChild(aaStat);
  summary.appendChild(aaaStat);
  container.appendChild(summary);
}

function loadPairIntoChecker(fg: string, bg: string): void {
  const fgColor = document.getElementById('foregroundColor') as HTMLInputElement | null;
  const fgHex = document.getElementById('foregroundHex') as HTMLInputElement | null;
  const bgColor = document.getElementById('backgroundColor') as HTMLInputElement | null;
  const bgHex = document.getElementById('backgroundHex') as HTMLInputElement | null;

  if (fgColor && fgHex) {
    fgColor.value = fg;
    fgHex.value = fg;
    fgHex.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (bgColor && bgHex) {
    bgColor.value = bg;
    bgHex.value = bg;
    bgHex.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const inputSection = document.getElementById('inputSection');
  if (inputSection) inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Initialize batch palette checker. Pre-populates with current fg/bg. */
export function setupBatchPalette(): void {
  container = document.getElementById('batchPaletteContainer');
  if (!container) return;

  // Pre-populate with current colors
  const fgHex = document.getElementById('foregroundHex') as HTMLInputElement | null;
  const bgHex = document.getElementById('backgroundHex') as HTMLInputElement | null;
  if (fgHex && bgHex) {
    colors = [fgHex.value.toUpperCase(), bgHex.value.toUpperCase()];
  }

  render();
  onProStatusChange(() => render());
}
