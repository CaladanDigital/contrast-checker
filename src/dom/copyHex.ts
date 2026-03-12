/**
 * Click-to-copy for hex color codes.
 * Uses event delegation on .hex-copyable elements.
 */

export function setupCopyableHex(): void {
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.hex-copyable');
    if (!target) return;

    const text = target.textContent?.trim();
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      target.classList.add('copied');
      setTimeout(() => {
        target.classList.remove('copied');
      }, 1500);
    });
  });
}
