/**
 * modal.js — Accessible dialog component with focus trap.
 *
 * Creates a modal overlay with a title, body content area, and optional
 * action buttons. Traps focus within the modal, closes on Escape, and
 * restores focus to the previously focused element when closed.
 *
 * Usage:
 *   import { showModal } from '../components/modal.js'
 *   showModal({ title: 'Confirm', content: 'Are you sure?', actions: [
 *     { label: 'Yes', onClick: handleYes, variant: 'primary' },
 *     { label: 'Cancel', onClick: null, variant: 'secondary' },
 *   ]})
 *
 * @module components/modal
 */

/**
 * All focusable element selectors (used for focus trapping).
 */
const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Collect all focusable elements within a container.
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function getFocusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    el => !el.closest('[hidden]') && el.offsetParent !== null
  );
}

/**
 * Mount an accessible modal dialog into the DOM.
 *
 * @param {object} options
 * @param {string} options.title - Modal heading text
 * @param {string|HTMLElement} [options.content] - Body content: HTML string or Element
 * @param {Function} [options.onClose] - Called when the modal is closed
 * @param {Array<{ label: string, onClick: Function|null, variant: string }>} [options.actions]
 *   Footer buttons. variant is 'primary' | 'secondary' | 'danger'.
 *   If onClick is null, clicking the button only closes the modal.
 * @returns {{ close: Function }} Object with a close() method
 */
export default function mountModal({ title, content, onClose, actions = [] }) {
  // Remember what was focused before the modal opened
  const previouslyFocused = document.activeElement;

  // ── Overlay ────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.className = 'vm-modal-overlay';

  // Clicking the backdrop closes the modal
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  // ── Dialog ─────────────────────────────────────────────────
  const dialog = document.createElement('div');
  dialog.className = 'vm-modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'vm-modal-title');

  // ── Header ─────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'vm-modal-header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'vm-modal-title';
  titleEl.id = 'vm-modal-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'vm-modal-close';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', close);
  header.appendChild(closeBtn);

  dialog.appendChild(header);

  // ── Body ────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'vm-modal-body';

  if (content instanceof HTMLElement) {
    body.appendChild(content);
  } else if (typeof content === 'string') {
    body.innerHTML = content;
  }

  dialog.appendChild(body);

  // ── Footer actions ──────────────────────────────────────────
  if (actions.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'vm-modal-footer';

    for (const action of actions) {
      const btn = document.createElement('button');
      btn.className = `btn btn-${action.variant || 'secondary'}`;
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        if (typeof action.onClick === 'function') {
          action.onClick();
        }
        close();
      });
      footer.appendChild(btn);
    }

    dialog.appendChild(footer);
  }

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // ── Focus management ────────────────────────────────────────
  // Focus the first focusable element inside the dialog
  const focusable = getFocusable(dialog);
  if (focusable.length > 0) {
    focusable[0].focus();
  } else {
    dialog.setAttribute('tabindex', '-1');
    dialog.focus();
  }

  // ── Key handlers ───────────────────────────────────────────
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === 'Tab') {
      const focusableEls = getFocusable(dialog);
      if (focusableEls.length === 0) return;

      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  document.addEventListener('keydown', onKeyDown);

  /**
   * Close and remove the modal. Restores focus to the previously focused element.
   */
  function close() {
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();

    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }

    if (typeof onClose === 'function') {
      onClose();
    }
  }

  return { close };
}

/**
 * Convenience wrapper — mounts a modal and returns the close handle.
 *
 * @param {object} options - Same as mountModal options
 * @returns {{ close: Function }}
 */
export function showModal(options) {
  return mountModal(options);
}
