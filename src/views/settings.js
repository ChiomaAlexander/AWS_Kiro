/**
 * settings.js — Application settings view.
 *
 * @module views/settings
 */

import { auth } from '../auth.js';
import { router } from '../router.js';
import { store } from '../store.js';

/**
 * Render the settings view.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Function} Cleanup function
 */
export default async function renderSettings(container, _params) {
  container.innerHTML = '';

  const heading = document.createElement('h1');
  heading.textContent = 'Settings';
  heading.style.cssText = 'font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;';
  container.appendChild(heading);

  const card = document.createElement('div');
  card.className = 'vm-card';

  // Reset demo button
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary';
  resetBtn.textContent = '↺ Reset Demo Data';
  resetBtn.setAttribute('aria-label', 'Reset demo data to initial state');
  resetBtn.addEventListener('click', () => {
    store.reset();
    auth.logout();
    router.navigate('/landing');
  });
  card.appendChild(resetBtn);

  const hint = document.createElement('p');
  hint.style.cssText = 'color:var(--text-muted);font-size:0.8rem;margin-top:0.75rem;';
  hint.textContent = 'Resetting will clear all local data and return to the landing page.';
  card.appendChild(hint);

  container.appendChild(card);

  return function cleanup() {};
}
