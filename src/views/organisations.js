/**
 * organisations.js — Organisations directory view.
 *
 * @module views/organisations
 */

import { store } from '../store.js';

/**
 * Render the organisations list.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Function} Cleanup function
 */
export default async function renderOrganisations(container, _params) {
  const orgs = store.get('organisations') || [];

  container.innerHTML = '';

  const heading = document.createElement('h1');
  heading.textContent = 'Organisations';
  heading.style.cssText = 'font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;';
  container.appendChild(heading);

  if (orgs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'vm-empty';
    empty.innerHTML = '<div class="empty-icon">🏢</div><h3>No organisations yet</h3>';
    container.appendChild(empty);
    return;
  }

  for (const org of orgs) {
    const card = document.createElement('div');
    card.className = 'vm-card';
    card.style.marginBottom = '1rem';

    const statusClass = `status-${org.verificationStatus || 'draft'}`;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <h3 style="font-weight:600;">${org.name || 'Unnamed Org'}</h3>
        <span class="vm-badge ${statusClass}">${org.verificationStatus || 'draft'}</span>
      </div>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-top:0.5rem;">${org.description || ''}</p>
    `;
    container.appendChild(card);
  }

  return function cleanup() {};
}
