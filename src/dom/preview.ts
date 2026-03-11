/**
 * Live preview box updates.
 * Sets foreground and background colors on the preview element.
 */

export function updatePreview(fg: string, bg: string): void {
  const previewBox = document.getElementById('previewBox');
  if (!previewBox) return;

  previewBox.style.color = fg;
  previewBox.style.backgroundColor = bg;
}
