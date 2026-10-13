/**
 * settings.js — Account settings and danger-zone view.
 *
 * Sections:
 *   (a) Account — email + displayName read-only labels.
 *   (b) Privacy — profile visibility toggle, blood donor discoverability toggle.
 *   (c) Danger Zone — Sign Out, Delete Account (coming soon), Export Data (coming soon).
 *   (d) Reset Demo — clears volunteerMatch_v2 and reloads.
 *
 * Requires authentication; calls auth.requireAuth() at the top.
 *
 * @module views/settings
 */

import { auth }   from '../auth.js';
import { router } from '../router.js';
import { store }  from '../store.js';
import { el, card, comingSoon } from '../ui.js';
import { showToast } from '../components/toast.js';

/** localStorage key for the main store — kept in sync with store.js */
const STORE_KEY = 'volunteerMatch_v2';

/**
 * Build a labelled read-only info row for the Account section.
 *
 * @param {string} label
 * @param {string} value
 * @returns {HTMLElement}
 */
function infoRow(label, value) {
  return el('div', { class: 'vm-settings__row' },
    el('span', { class: 'vm-settings__label' }, label),
    el('span', { class: 'vm-settings__value' }, value || '—'),
  );
}

/**
 * Build a toggle switch row.
 *
 * @param {string}   id         - Unique input id
 * @param {string}   labelText  - Visible label
 * @param {string}   hint       - Sub-text description
 * @param {boolean}  checked    - Initial checked state
 * @param {Function} onChange   - Called with new boolean on change
 * @returns {HTMLElement}
 */
function toggleRow(id, labelText, hint, checked, onChange) {
  const cb = el('input', {
    type: 'checkbox',
    id,
    class: 'vm-toggle',
    checked,
    'aria-describedby': `${id}-hint`,
    onChange: (e) => onChange(e.target.checked),
  });
  const labelEl = el('label', { for: id, class: 'vm-settings__toggle-label' },
    cb,
    el('span', { class: 'vm-settings__toggle-text' }, labelText),
  );
  const hintEl  = el('p', { id: `${id}-hint`, class: 'vm-text-muted vm-text-small' }, hint);
  return el('div', { class: 'vm-settings__toggle-row' }, labelEl, hintEl);
}

/**
 * Render the settings view.
 *
 * @param {HTMLElement} container - The #view-root element
 * @param {object}     _params   - Route params (unused)
 * @returns {Function} Cleanup function
 */
export default async function renderSettings(container, _params) {
  auth.requireAuth();

  const user = auth.currentUser();

  container.innerHTML = '';

  const wrap = el('div', { class: 'vm-settings' });

  // ── Page heading ────────────────────────────────────────────────────────
  wrap.appendChild(el('h1', { class: 'vm-settings__heading' }, '⚙️ Settings'));

  // ── (a) Account ─────────────────────────────────────────────────────────
  if (user) {
    const accountCard = el('div', { class: 'vm-card vm-settings__section' },
      el('h2', { class: 'vm-settings__section-title' }, 'Account'),
      el('p', { class: 'vm-text-muted vm-text-small' }, 'Demo — changes are not sent to any server.'),
      infoRow('Display Name', user.displayName),
      infoRow('Username',     `@${user.username}`),
      infoRow('Email',        user.email),
      infoRow('Role',         user.role || 'user'),
    );
    wrap.appendChild(accountCard);

    // ── (b) Privacy ──────────────────────────────────────────────────────
    const privacyCard = el('div', { class: 'vm-card vm-settings__section' },
      el('h2', { class: 'vm-settings__section-title' }, 'Privacy'),
    );

    privacyCard.appendChild(
      toggleRow(
        'toggle-profile-public',
        'Public profile',
        'Allow other users to view your profile and contributions.',
        user.profilePublic !== false,   // default true
        (val) => {
          store.patch('users', user.id, { profilePublic: val });
          showToast(`Profile visibility set to ${val ? 'public' : 'private'}`, 'info');
        },
      )
    );

    privacyCard.appendChild(
      toggleRow(
        'toggle-blood-donor',
        'Blood donor discoverability',
        'Allow blood-donation requests to find and contact you.',
        Boolean(user.bloodDonor),
        (val) => {
          store.patch('users', user.id, { bloodDonor: val });
          showToast(`Blood donor status ${val ? 'enabled' : 'disabled'}`, 'info');
        },
      )
    );

    wrap.appendChild(privacyCard);
  }

  // ── (c) Danger Zone ──────────────────────────────────────────────────────
  const dangerCard = el('div', { class: 'vm-card vm-settings__section vm-settings__danger' },
    el('h2', { class: 'vm-settings__section-title vm-settings__danger-title' }, '⚠️ Danger Zone'),
  );

  // Sign Out
  const signOutBtn = el('button', {
    class: 'btn btn-danger',
    'aria-label': 'Sign out of your account',
    onClick: () => {
      auth.logout();
      router.navigate('/landing');
    },
  }, 'Sign Out');

  dangerCard.appendChild(
    el('div', { class: 'vm-settings__danger-row' },
      el('div', {},
        el('strong', {}, 'Sign Out'),
        el('p', { class: 'vm-text-muted vm-text-small' }, 'End your current session on this device.'),
      ),
      signOutBtn,
    )
  );

  // Delete Account (coming soon)
  const deleteWrap = el('div', { class: 'vm-settings__danger-row' },
    el('div', {},
      el('strong', {}, 'Delete Account'),
      el('p', { class: 'vm-text-muted vm-text-small' }, 'Permanently remove your account and data.'),
    ),
  );
  const deleteBtn = el('button', {
    class: 'btn btn-secondary',
    'aria-label': 'Delete account (coming soon)',
    onClick: () => {
      deleteWrap.appendChild(comingSoon('Account Deletion'));
    },
  }, 'Delete Account');
  deleteWrap.appendChild(deleteBtn);
  dangerCard.appendChild(deleteWrap);

  // Export Data (coming soon)
  const exportWrap = el('div', { class: 'vm-settings__danger-row' },
    el('div', {},
      el('strong', {}, 'Export My Data'),
      el('p', { class: 'vm-text-muted vm-text-small' }, 'Download a copy of all your stored data.'),
    ),
  );
  const exportBtn = el('button', {
    class: 'btn btn-secondary',
    'aria-label': 'Export data (coming soon)',
    onClick: () => {
      exportWrap.appendChild(comingSoon('Data Export'));
    },
  }, 'Export My Data');
  exportWrap.appendChild(exportBtn);
  dangerCard.appendChild(exportWrap);

  wrap.appendChild(dangerCard);

  // ── (d) Reset Demo ────────────────────────────────────────────────────────
  const resetCard = el('div', { class: 'vm-card vm-settings__section' },
    el('h2', { class: 'vm-settings__section-title' }, '🔄 Reset Demo'),
    el('p', { class: 'vm-text-muted' },
      'Clears all local data and reloads the app with the original sample data.'
    ),
  );

  const resetBtn = el('button', {
    class: 'btn btn-secondary',
    'aria-label': 'Reset demo data to initial state',
    onClick: () => {
      localStorage.removeItem(STORE_KEY);
      auth.logout();
      location.reload();
    },
  }, '↺ Reset Demo Data');

  const resetHint = el('p', { class: 'vm-text-muted vm-text-small', style: 'margin-top:0.5rem;' },
    'This action cannot be undone — all local changes will be lost.'
  );

  resetCard.appendChild(resetBtn);
  resetCard.appendChild(resetHint);
  wrap.appendChild(resetCard);

  container.appendChild(wrap);

  return function cleanup() {};
}
