/**
 * opportunities.js — Discover opportunities view.
 *
 * @module views/opportunities
 */

import { store } from '../store.js';

/**
 * Render the opportunities list.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Function} Cleanup function
 */
export default async function renderOpportunities(container, _params) {
  const opportunities = store.get('opportunities') || [];

  container.innerHTML = '';

  const heading = document.createElement('h1');
  heading.textContent = 'Volunteer Opportunities';
  heading.style.cssText = 'font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;';
  container.appendChild(heading);

  if (opportunities.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'vm-empty';
    empty.innerHTML = '<div class="empty-icon">🔍</div><h3>No opportunities found</h3>';
    container.appendChild(empty);
    return;
  }

  for (const opp of opportunities) {
    const card = document.createElement('div');
    card.className = 'vm-card';
    card.style.marginBottom = '1rem';
    card.innerHTML = `
      <h3 style="font-weight:600;margin-bottom:0.5rem;">${opp.title || 'Untitled'}</h3>
      <p style="color:var(--text-muted);font-size:0.875rem;">${opp.description || ''}</p>
    `;
    container.appendChild(card);
  }

  return function cleanup() {};
}
