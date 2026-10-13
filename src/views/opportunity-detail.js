/**
 * opportunity-detail.js — Single opportunity detail view.
 *
 * @module views/opportunity-detail
 */

import { store } from '../store.js';
import { router } from '../router.js';

/**
 * Render an opportunity detail page.
 *
 * @param {HTMLElement} container
 * @param {{ id: string }} params
 * @returns {Function} Cleanup function
 */
export default async function renderOpportunityDetail(container, params) {
  const opportunities = store.get('opportunities') || [];
  const opp = opportunities.find(o => o.id === params.id);

  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-secondary';
  backBtn.style.marginBottom = '1rem';
  backBtn.textContent = '← Back to Opportunities';
  backBtn.addEventListener('click', () => router.navigate('/opportunities'));
  container.appendChild(backBtn);

  if (!opp) {
    const error = document.createElement('div');
    error.className = 'vm-error';
    error.textContent = 'Opportunity not found.';
    container.appendChild(error);
    return () => {};
  }

  const card = document.createElement('div');
  card.className = 'vm-card';
  card.innerHTML = `
    <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:0.75rem;">${opp.title || 'Untitled'}</h1>
    <p style="color:var(--text-muted);">${opp.description || ''}</p>
  `;
  container.appendChild(card);

  return function cleanup() {};
}
