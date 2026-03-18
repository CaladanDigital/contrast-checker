/**
 * PDF export button and options dialog.
 * Pro-gated: free users see upgrade prompt.
 */

import { getContrastRatio, checkWCAGCompliance } from '../utils/contrastCalculation';
import { generateReport, type ReportData } from '../utils/pdfReport';

let dialogOpen = false;
let triggerElement: HTMLElement | null = null;

/** Trap focus within a container element. */
function trapFocus(container: HTMLElement, e: KeyboardEvent): void {
  if (e.key !== 'Tab') return;

  const focusable = container.querySelectorAll<HTMLElement>(
    'input, button, [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function showExportDialog(): void {
  if (dialogOpen) return;
  dialogOpen = true;
  triggerElement = document.activeElement as HTMLElement | null;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.addEventListener('click', () => closeDialog(backdrop, dialog));

  const dialog = document.createElement('div');
  dialog.className = 'pdf-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Export PDF Report');

  const title = document.createElement('h3');
  title.textContent = 'Export PDF Report';
  dialog.appendChild(title);

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Project Name (optional)';
  nameLabel.htmlFor = 'pdfProjectName';
  dialog.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'pdfProjectName';
  nameInput.placeholder = 'e.g. Brand Redesign';
  dialog.appendChild(nameInput);

  const notesLabel = document.createElement('label');
  notesLabel.textContent = 'Notes (optional)';
  notesLabel.htmlFor = 'pdfNotes';
  dialog.appendChild(notesLabel);

  const notesInput = document.createElement('input');
  notesInput.type = 'text';
  notesInput.id = 'pdfNotes';
  notesInput.placeholder = 'e.g. Q1 accessibility audit';
  dialog.appendChild(notesInput);

  const actions = document.createElement('div');
  actions.className = 'pdf-dialog-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => closeDialog(backdrop, dialog));

  const generateBtn = document.createElement('button');
  generateBtn.textContent = 'Generate PDF';
  generateBtn.className = 'batch-check-btn';
  generateBtn.addEventListener('click', async () => {
    generateBtn.textContent = 'Generating...';
    generateBtn.setAttribute('disabled', '');
    try {
      await doExport(nameInput.value, notesInput.value);
    } finally {
      closeDialog(backdrop, dialog);
    }
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(generateBtn);
  dialog.appendChild(actions);

  document.body.appendChild(backdrop);
  document.body.appendChild(dialog);
  nameInput.focus();

  function keyHandler(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      closeDialog(backdrop, dialog);
      document.removeEventListener('keydown', keyHandler);
    }
    trapFocus(dialog, e);
  }
  document.addEventListener('keydown', keyHandler);
}

function closeDialog(backdrop: HTMLElement, dialog: HTMLElement): void {
  backdrop.remove();
  dialog.remove();
  dialogOpen = false;
  if (triggerElement) {
    triggerElement.focus();
    triggerElement = null;
  }
}

async function doExport(projectName: string, notes: string): Promise<void> {
  const fgHex = (document.getElementById('foregroundHex') as HTMLInputElement)?.value || '#000000';
  const bgHex = (document.getElementById('backgroundHex') as HTMLInputElement)?.value || '#FFFFFF';
  const ratio = getContrastRatio(fgHex, bgHex);

  const reportData: ReportData = {
    projectName,
    notes,
    fg: fgHex,
    bg: bgHex,
    ratio,
    wcag: checkWCAGCompliance(ratio),
  };

  await generateReport(reportData);
}

/** Set up PDF export button. */
export function setupPdfExport(): void {
  const btn = document.getElementById('exportPdfButton');
  if (!btn) return;

  btn.onclick = () => showExportDialog();
}
