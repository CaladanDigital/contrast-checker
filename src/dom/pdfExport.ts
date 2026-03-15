/**
 * PDF export button and options dialog.
 * Pro-gated: free users see upgrade prompt.
 */

import { isPro, onProStatusChange } from '../utils/proGate';
import { getContrastRatio, checkWCAGCompliance } from '../utils/contrastCalculation';
import { generateReport, type ReportData } from '../utils/pdfReport';

let dialogOpen = false;

function showExportDialog(): void {
  if (dialogOpen) return;
  dialogOpen = true;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.addEventListener('click', () => closeDialog(backdrop, dialog));

  const dialog = document.createElement('div');
  dialog.className = 'pdf-dialog';

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

  document.addEventListener('keydown', function escHandler(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeDialog(backdrop, dialog);
      document.removeEventListener('keydown', escHandler);
    }
  });
}

function closeDialog(backdrop: HTMLElement, dialog: HTMLElement): void {
  backdrop.remove();
  dialog.remove();
  dialogOpen = false;
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

  function updateButtonState(): void {
    if (!btn) return;
    if (isPro()) {
      btn.onclick = () => showExportDialog();
    } else {
      btn.onclick = () => {
        const pricing = document.getElementById('pricingSection');
        if (pricing) pricing.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    }
  }

  updateButtonState();
  onProStatusChange(() => updateButtonState());
}
