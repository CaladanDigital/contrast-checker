/**
 * License activation modal and Pro badge in header.
 * Handles the complete UI flow for entering/activating/deactivating license keys.
 */

import { isPro, storeLicense, clearLicense, getStoredLicense, onProStatusChange } from '../utils/proGate';
import { validateLicense } from '../utils/licenseApi';

let modalEl: HTMLElement | null = null;

function createProBadge(): HTMLElement {
  const badge = document.createElement('a');
  badge.id = 'proBadge';
  badge.href = '#';
  badge.className = 'pro-badge';
  badge.textContent = isPro() ? 'Pro' : 'Upgrade';
  badge.setAttribute('aria-label', isPro() ? 'Manage Pro license' : 'Upgrade to Pro');
  badge.style.borderBottom = 'none';
  badge.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });
  return badge;
}

function updateBadgeState(): void {
  const badge = document.getElementById('proBadge');
  if (!badge) return;
  if (isPro()) {
    badge.textContent = 'Pro';
    badge.classList.add('active');
    badge.setAttribute('aria-label', 'Manage Pro license');
  } else {
    badge.textContent = 'Upgrade';
    badge.classList.remove('active');
    badge.setAttribute('aria-label', 'Upgrade to Pro');
  }

  // Logo PRO pill
  const logo = document.querySelector('.site-logo');
  if (logo) {
    const existing = logo.querySelector('.logo-pro-pill');
    if (isPro() && !existing) {
      const pill = document.createElement('span');
      pill.className = 'logo-pro-pill';
      pill.textContent = 'PRO';
      logo.appendChild(pill);
    } else if (!isPro() && existing) {
      existing.remove();
    }
  }
}

function buildModalContent(): HTMLElement {
  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'licenseModalTitle');

  if (isPro()) {
    const stored = getStoredLicense();
    dialog.appendChild(createEl('h2', { id: 'licenseModalTitle', text: 'Thanks for being a Pro member!' }));

    // Benefits list
    dialog.appendChild(createEl('h3', { text: 'Your Pro Benefits' }));
    const benefitsList = document.createElement('ul');
    benefitsList.className = 'pro-benefits-list';
    const benefits = [
      'Batch palette checker',
      'PDF accessibility reports',
      'Saved palettes',
      'Advanced color suggestions',
    ];
    for (const b of benefits) {
      const li = document.createElement('li');
      li.textContent = b;
      benefitsList.appendChild(li);
    }
    dialog.appendChild(benefitsList);

    // Account section
    dialog.appendChild(createEl('h3', { text: 'Account' }));
    dialog.appendChild(createEl('p', { text: `License: ${stored?.key || 'Unknown'}` }));
    if (stored?.email) {
      dialog.appendChild(createEl('p', { text: `Email: ${stored.email}` }));
    }

    // Billing section
    dialog.appendChild(createEl('h3', { text: 'Billing & Subscription' }));
    const billingP = document.createElement('p');
    billingP.textContent = 'To manage your subscription or update payment details, email us at ';
    const billingLink = document.createElement('a');
    billingLink.href = 'mailto:info@caladandigital.com';
    billingLink.textContent = 'info@caladandigital.com';
    billingP.appendChild(billingLink);
    billingP.appendChild(document.createTextNode('.'));
    dialog.appendChild(billingP);

    // Feature requests
    dialog.appendChild(createEl('h3', { text: 'Feature Requests' }));
    const featureP = document.createElement('p');
    featureP.textContent = 'Have a feature idea? Email us at ';
    const featureLink = document.createElement('a');
    featureLink.href = 'mailto:info@caladandigital.com';
    featureLink.textContent = 'info@caladandigital.com';
    featureP.appendChild(featureLink);
    featureP.appendChild(document.createTextNode('.'));
    dialog.appendChild(featureP);

    // Deactivate (at bottom)
    const deactivateBtn = createEl('button', { text: 'Deactivate License', className: 'modal-btn modal-btn--danger' });
    deactivateBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to deactivate your Pro license on this device?')) {
        clearLicense();
        closeModal();
      }
    });
    deactivateBtn.style.marginTop = '1.5rem';
    dialog.appendChild(deactivateBtn);
  } else {
    dialog.appendChild(createEl('h2', { id: 'licenseModalTitle', text: 'Activate Pro License' }));
    dialog.appendChild(createEl('p', { text: 'Enter your license key and email to unlock Pro features.' }));

    const form = document.createElement('form');
    form.className = 'license-form';
    form.addEventListener('submit', (e) => e.preventDefault());

    const keyLabel = createEl('label', { text: 'License Key', htmlFor: 'licenseKeyInput' });
    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.id = 'licenseKeyInput';
    keyInput.placeholder = 'ACPRO-XXXX-XXXX-XXXX';
    keyInput.setAttribute('aria-label', 'License key');
    keyInput.autocomplete = 'off';

    const emailLabel = createEl('label', { text: 'Email', htmlFor: 'licenseEmailInput' });
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'licenseEmailInput';
    emailInput.placeholder = 'you@example.com';
    emailInput.setAttribute('aria-label', 'Email address');

    const errorEl = createEl('p', { className: 'license-error' });
    errorEl.id = 'licenseError';
    errorEl.setAttribute('role', 'alert');

    const activateBtn = createEl('button', { text: 'Activate', className: 'modal-btn modal-btn--primary' });
    (activateBtn as HTMLButtonElement).type = 'submit';
    activateBtn.addEventListener('click', async () => {
      errorEl.textContent = '';
      activateBtn.textContent = 'Validating...';
      activateBtn.setAttribute('disabled', '');

      const result = await validateLicense(keyInput.value, emailInput.value);

      if (result.valid) {
        storeLicense(keyInput.value, emailInput.value);
        closeModal();
      } else {
        errorEl.textContent = result.error || 'Validation failed.';
        activateBtn.textContent = 'Activate';
        activateBtn.removeAttribute('disabled');
      }
    });

    form.appendChild(keyLabel);
    form.appendChild(keyInput);
    form.appendChild(emailLabel);
    form.appendChild(emailInput);
    form.appendChild(errorEl);
    form.appendChild(activateBtn);
    dialog.appendChild(form);
  }

  const closeBtn = createEl('button', { text: '\u00D7', className: 'modal-close' });
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.addEventListener('click', closeModal);
  dialog.insertBefore(closeBtn, dialog.firstChild);

  return dialog;
}

function openModal(): void {
  modalEl = document.getElementById('licenseModal');
  if (!modalEl) return;

  // Clear and rebuild content
  while (modalEl.firstChild) modalEl.removeChild(modalEl.firstChild);

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.addEventListener('click', closeModal);

  const dialog = buildModalContent();

  modalEl.appendChild(backdrop);
  modalEl.appendChild(dialog);
  modalEl.classList.add('open');

  // Inert main content
  const main = document.querySelector('main');
  if (main) main.setAttribute('inert', '');
  const header = document.querySelector('.site-header');
  if (header) header.setAttribute('inert', '');

  // Focus first input or close button
  const firstInput = dialog.querySelector('input') as HTMLElement | null;
  const closeBtn = dialog.querySelector('.modal-close') as HTMLElement | null;
  (firstInput || closeBtn)?.focus();

  // Trap focus and handle Escape
  document.addEventListener('keydown', handleModalKeydown);
}

function closeModal(): void {
  if (!modalEl) return;
  modalEl.classList.remove('open');

  const main = document.querySelector('main');
  if (main) main.removeAttribute('inert');
  const header = document.querySelector('.site-header');
  if (header) header.removeAttribute('inert');

  document.removeEventListener('keydown', handleModalKeydown);

  // Return focus to badge
  const badge = document.getElementById('proBadge');
  badge?.focus();
}

function handleModalKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    closeModal();
    return;
  }

  if (e.key === 'Tab' && modalEl) {
    const dialog = modalEl.querySelector('.modal-dialog');
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function createEl(
  tag: string,
  opts?: { text?: string; className?: string; id?: string; htmlFor?: string }
): HTMLElement {
  const el = document.createElement(tag);
  if (opts?.text) el.textContent = opts.text;
  if (opts?.className) el.className = opts.className;
  if (opts?.id) el.id = opts.id;
  if (opts?.htmlFor && el instanceof HTMLLabelElement) el.htmlFor = opts.htmlFor;
  return el;
}

/** Set up the Features dropdown in the nav. */
function setupFeaturesDropdown(): void {
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

/** Set up the Pro badge in header and license modal. */
export function setupLicenseUI(): void {
  // Set up Features dropdown
  setupFeaturesDropdown();

  // Add Pro badge to header nav
  const nav = document.querySelector('.site-nav');
  if (nav) {
    nav.appendChild(createProBadge());
  }

  // Listen for status changes
  onProStatusChange(() => {
    updateBadgeState();
  });
}
