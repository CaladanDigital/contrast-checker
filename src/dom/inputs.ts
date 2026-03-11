/**
 * Color input synchronization and event handling.
 * Syncs color pickers with hex text inputs.
 */

import { validateHex } from '../utils/colorValidation';

export interface ColorInputElements {
  fgColor: HTMLInputElement;
  fgHex: HTMLInputElement;
  bgColor: HTMLInputElement;
  bgHex: HTMLInputElement;
  swapButton: HTMLButtonElement;
  copyButton: HTMLButtonElement;
}

export function getInputElements(): ColorInputElements {
  return {
    fgColor: document.getElementById('foregroundColor') as HTMLInputElement,
    fgHex: document.getElementById('foregroundHex') as HTMLInputElement,
    bgColor: document.getElementById('backgroundColor') as HTMLInputElement,
    bgHex: document.getElementById('backgroundHex') as HTMLInputElement,
    swapButton: document.getElementById('swapButton') as HTMLButtonElement,
    copyButton: document.getElementById('copyButton') as HTMLButtonElement,
  };
}

export function setupInputListeners(
  elements: ColorInputElements,
  onUpdate: () => void
): void {
  const { fgColor, fgHex, bgColor, bgHex, swapButton, copyButton } = elements;

  // Foreground color picker -> hex input
  fgColor.addEventListener('input', () => {
    const validated = validateHex(fgColor.value);
    if (validated) {
      fgHex.value = validated;
      onUpdate();
    }
  });

  // Foreground hex input -> color picker
  fgHex.addEventListener('input', () => {
    let value = fgHex.value;
    if (!value.startsWith('#')) value = '#' + value;
    const validated = validateHex(value);
    if (validated) {
      fgColor.value = validated;
      onUpdate();
    }
  });

  // Background color picker -> hex input
  bgColor.addEventListener('input', () => {
    const validated = validateHex(bgColor.value);
    if (validated) {
      bgHex.value = validated;
      onUpdate();
    }
  });

  // Background hex input -> color picker
  bgHex.addEventListener('input', () => {
    let value = bgHex.value;
    if (!value.startsWith('#')) value = '#' + value;
    const validated = validateHex(value);
    if (validated) {
      bgColor.value = validated;
      onUpdate();
    }
  });

  // Swap colors
  swapButton.addEventListener('click', () => {
    const tempColor = fgColor.value;
    fgColor.value = bgColor.value;
    bgColor.value = tempColor;
    fgHex.value = fgColor.value.toUpperCase();
    bgHex.value = bgColor.value.toUpperCase();
    onUpdate();
  });

  // Copy CSS
  copyButton.addEventListener('click', () => {
    const fgValidated = validateHex(fgHex.value) || fgHex.value;
    const bgValidated = validateHex(bgHex.value) || bgHex.value;
    const css = `color: ${fgValidated}; background-color: ${bgValidated};`;
    navigator.clipboard.writeText(css).then(() => {
      copyButton.textContent = '\u2713 Copied!';
      setTimeout(() => {
        copyButton.textContent = '\uD83D\uDCCB Copy CSS';
      }, 2000);
    });
  });
}
