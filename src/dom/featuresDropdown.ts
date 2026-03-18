/**
 * Features dropdown in the nav — hover/click/keyboard behavior.
 */

export function setupFeaturesDropdown(): void {
  const dropdown = document.getElementById('featuresDropdown');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.nav-dropdown-trigger');
  if (!trigger) return;

  function openDropdown(): void {
    dropdown!.setAttribute('open', '');
    trigger!.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown(): void {
    dropdown!.removeAttribute('open');
    trigger!.setAttribute('aria-expanded', 'false');
  }

  function isOpen(): boolean {
    return dropdown!.hasAttribute('open');
  }

  let closeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Open on hover
  dropdown.addEventListener('mouseenter', () => {
    if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
    openDropdown();
  });

  dropdown.addEventListener('mouseleave', () => {
    closeTimeout = setTimeout(() => closeDropdown(), 150);
  });

  // Click fallback for touch
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    if (isOpen()) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (isOpen() && !dropdown!.contains(e.target as Node)) {
      closeDropdown();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      closeDropdown();
      (trigger as HTMLElement).focus();
    }
  });

  // Close on menu item click
  const menuItems = dropdown.querySelectorAll('.nav-dropdown-menu a');
  menuItems.forEach((item) => {
    item.addEventListener('click', () => closeDropdown());
  });
}
