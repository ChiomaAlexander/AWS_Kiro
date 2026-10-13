/**
 * toast.js — Auto-dismissing notification toast component.
 *
 * Usage:
 *   import { showToast } from '../components/toast.js'
 *   showToast('Profile saved!', 'success')
 *   showToast('Something went wrong', 'error')
 *
 * Types: 'info' (default) | 'success' | 'warning' | 'error'
 * Toasts auto-dismiss after 3 000 ms.
 * At most 3 toasts are shown at once — the oldest is dismissed when a 4th arrives.
 *
 * @module components/toast
 */

/** Maximum number of toasts visible simultaneously. */
const MAX_TOASTS = 3;

/** Auto-dismiss delay in milliseconds. */
const DISMISS_DELAY = 3000;

/** Duration of the exit animation (must match CSS). */
const ANIMATION_OUT_MS = 200;

/** Icon map per type. */
const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

/** Module-level list of currently active toast entries. */
const toasts = [];

/** Lazy-created container element anchored to document.body. */
let container = null;

/**
 * Return (and create if needed) the toast container element.
 * @returns {HTMLElement}
 */
function getContainer() {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    container.className = 'vm-toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notifications');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Animate a toast out then remove it from the DOM and the toasts array.
 * @param {{ el: HTMLElement, timerId: number }} entry
 */
function dismiss(entry) {
  clearTimeout(entry.timerId);

  const el = entry.el;
  el.classList.add('dismissing');

  // Wait for exit animation before removing
  setTimeout(() => {
    el.remove();
    const idx = toasts.indexOf(entry);
    if (idx !== -1) toasts.splice(idx, 1);
  }, ANIMATION_OUT_MS);
}

/**
 * Show a notification toast message.
 *
 * @param {string} message - The text to display
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - Visual style
 * @returns {Function} A dismiss function — call it to remove the toast early
 */
export function showToast(message, type = 'info') {
  // Enforce max queue size — dismiss the oldest first
  if (toasts.length >= MAX_TOASTS) {
    dismiss(toasts[0]);
  }

  const c = getContainer();

  // ── Build toast element ─────────────────────────────────────
  const el = document.createElement('div');
  el.className = `vm-toast vm-toast-${type}`;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  // Icon
  const icon = document.createElement('span');
  icon.className = 'vm-toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = ICONS[type] || ICONS.info;
  el.appendChild(icon);

  // Message text
  const msg = document.createElement('span');
  msg.className = 'vm-toast-msg';
  msg.textContent = message;
  el.appendChild(msg);

  // Manual close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'vm-toast-close';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => dismiss(entry));
  el.appendChild(closeBtn);

  c.appendChild(el);

  // ── Auto-dismiss timer ──────────────────────────────────────
  const timerId = setTimeout(() => dismiss(entry), DISMISS_DELAY);

  /** @type {{ el: HTMLElement, timerId: number }} */
  const entry = { el, timerId };
  toasts.push(entry);

  // Return a manual dismiss function for the caller
  return () => dismiss(entry);
}
