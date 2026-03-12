/**
 * HSL slider setup and synchronization.
 * Each color (fg/bg) gets H, S, L range inputs with live output displays.
 */

import { hexToHsl, hslToHex } from '../utils/colorConversion';
import { smartFixLightness } from '../utils/contrastCalculation';
import type { ColorInputElements } from './inputs';

export interface HSLSliderElements {
  fgH: HTMLInputElement;
  fgS: HTMLInputElement;
  fgL: HTMLInputElement;
  fgHOut: HTMLOutputElement;
  fgSOut: HTMLOutputElement;
  fgLOut: HTMLOutputElement;
  bgH: HTMLInputElement;
  bgS: HTMLInputElement;
  bgL: HTMLInputElement;
  bgHOut: HTMLOutputElement;
  bgSOut: HTMLOutputElement;
  bgLOut: HTMLOutputElement;
  fgSmartFix: HTMLButtonElement;
  bgSmartFix: HTMLButtonElement;
}

export function getHSLSliderElements(): HSLSliderElements {
  return {
    fgH: document.getElementById('fgHue') as HTMLInputElement,
    fgS: document.getElementById('fgSaturation') as HTMLInputElement,
    fgL: document.getElementById('fgLightness') as HTMLInputElement,
    fgHOut: document.getElementById('fgHueOut') as HTMLOutputElement,
    fgSOut: document.getElementById('fgSaturationOut') as HTMLOutputElement,
    fgLOut: document.getElementById('fgLightnessOut') as HTMLOutputElement,
    bgH: document.getElementById('bgHue') as HTMLInputElement,
    bgS: document.getElementById('bgSaturation') as HTMLInputElement,
    bgL: document.getElementById('bgLightness') as HTMLInputElement,
    bgHOut: document.getElementById('bgHueOut') as HTMLOutputElement,
    bgSOut: document.getElementById('bgSaturationOut') as HTMLOutputElement,
    bgLOut: document.getElementById('bgLightnessOut') as HTMLOutputElement,
    fgSmartFix: document.getElementById('fgSmartFix') as HTMLButtonElement,
    bgSmartFix: document.getElementById('bgSmartFix') as HTMLButtonElement,
  };
}

export function setupHSLSliders(
  sliders: HSLSliderElements,
  inputs: ColorInputElements,
  onUpdate: () => void
): void {
  // Foreground sliders → update hex inputs
  const updateFgFromSliders = () => {
    const h = Number(sliders.fgH.value);
    const s = Number(sliders.fgS.value);
    const l = Number(sliders.fgL.value);
    const hex = hslToHex(h, s, l);
    inputs.fgHex.value = hex;
    inputs.fgColor.value = hex;
    sliders.fgHOut.textContent = `${Math.round(h)}`;
    sliders.fgSOut.textContent = `${Math.round(s)}`;
    sliders.fgLOut.textContent = `${Math.round(l)}`;
    onUpdate();
  };

  sliders.fgH.addEventListener('input', updateFgFromSliders);
  sliders.fgS.addEventListener('input', updateFgFromSliders);
  sliders.fgL.addEventListener('input', updateFgFromSliders);

  // Background sliders → update hex inputs
  const updateBgFromSliders = () => {
    const h = Number(sliders.bgH.value);
    const s = Number(sliders.bgS.value);
    const l = Number(sliders.bgL.value);
    const hex = hslToHex(h, s, l);
    inputs.bgHex.value = hex;
    inputs.bgColor.value = hex;
    sliders.bgHOut.textContent = `${Math.round(h)}`;
    sliders.bgSOut.textContent = `${Math.round(s)}`;
    sliders.bgLOut.textContent = `${Math.round(l)}`;
    onUpdate();
  };

  sliders.bgH.addEventListener('input', updateBgFromSliders);
  sliders.bgS.addEventListener('input', updateBgFromSliders);
  sliders.bgL.addEventListener('input', updateBgFromSliders);

  // Smart Fix buttons
  sliders.fgSmartFix.addEventListener('click', () => {
    const fixed = smartFixLightness(inputs.fgHex.value, inputs.bgHex.value);
    if (fixed) {
      inputs.fgHex.value = fixed;
      inputs.fgColor.value = fixed;
      onUpdate();
    }
  });

  sliders.bgSmartFix.addEventListener('click', () => {
    const fixed = smartFixLightness(inputs.bgHex.value, inputs.fgHex.value);
    if (fixed) {
      inputs.bgHex.value = fixed;
      inputs.bgColor.value = fixed;
      onUpdate();
    }
  });
}

/**
 * Sync slider positions from current hex values.
 * Safe from event loops: setting .value programmatically doesn't fire 'input' events.
 */
export function syncHSLSliders(
  sliders: HSLSliderElements,
  fgHex: string,
  bgHex: string
): void {
  const fgHsl = hexToHsl(fgHex);
  if (fgHsl) {
    sliders.fgH.value = String(Math.round(fgHsl.h));
    sliders.fgS.value = String(Math.round(fgHsl.s));
    sliders.fgL.value = String(Math.round(fgHsl.l));
    sliders.fgHOut.textContent = `${Math.round(fgHsl.h)}`;
    sliders.fgSOut.textContent = `${Math.round(fgHsl.s)}`;
    sliders.fgLOut.textContent = `${Math.round(fgHsl.l)}`;
  }

  const bgHsl = hexToHsl(bgHex);
  if (bgHsl) {
    sliders.bgH.value = String(Math.round(bgHsl.h));
    sliders.bgS.value = String(Math.round(bgHsl.s));
    sliders.bgL.value = String(Math.round(bgHsl.l));
    sliders.bgHOut.textContent = `${Math.round(bgHsl.h)}`;
    sliders.bgSOut.textContent = `${Math.round(bgHsl.s)}`;
    sliders.bgLOut.textContent = `${Math.round(bgHsl.l)}`;
  }
}
