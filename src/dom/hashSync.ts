/**
 * URL hash sync for shareable color links.
 * Format: #fg=FF0000&bg=FFFFFF (no # prefix on hex values)
 */

import { validateHex } from '../utils/colorValidation';

export function readColorsFromHash(): { fg: string; bg: string } | null {
  const hash = window.location.hash.slice(1); // remove leading #
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const fgRaw = params.get('fg');
  const bgRaw = params.get('bg');

  if (!fgRaw || !bgRaw) return null;

  const fg = validateHex('#' + fgRaw);
  const bg = validateHex('#' + bgRaw);

  if (!fg || !bg) return null;

  return { fg, bg };
}

export function writeColorsToHash(fg: string, bg: string): void {
  const fgClean = fg.replace('#', '');
  const bgClean = bg.replace('#', '');
  const hash = `#fg=${fgClean}&bg=${bgClean}`;
  history.replaceState(null, '', hash);
}

export function setupShareButton(): void {
  const shareButton = document.getElementById('shareButton');
  if (!shareButton) return;

  shareButton.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      shareButton.textContent = '\u2713 Copied!';
      setTimeout(() => {
        shareButton.textContent = '\uD83D\uDD17 Share Link';
      }, 2000);
    });
  });
}
