/**
 * donations.js — Donations & fundraising view.
 *
 * @module views/donations
 */

import { store } from '../store.js';

/**
 * Render the donations view.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Function} Cleanup function
 */
export default async function renderDonations(container, _params) {
  const donations = store.get('donationRequests') || [];

  container.innerHTML = '';

  // Demo-only banner (always visible per product rules)
  const banner = document.createElement('div');
  banner.style.cssText = `
    background:color-mix(in srgb,var(--warning) 12%,transparent);
    border:1px solid color-mix(in srgb,var(--warning) 40%,transparent);
    border-radius:var(--radius-sm);
    padding:0.65rem 1rem;
    margin-bottom:1.5rem;
    font-size:0.8rem;
    color:var(--warning);
  `;
  banner.textContent = '⚠ Demo only — no real transactions are processed.';
  container.appendChild(banner);

  const heading = document.createElement('h1');
  heading.textContent = 'Donations & Fundraising';
  heading.style.cssText = 'font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;';
  container.appendChild(heading);

  if (donations.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'vm-empty';
    empty.innerHTML = '<div class="empty-icon">🎁</div><h3>No active donation requests</h3>';
    container.appendChild(empty);
    return;
  }

  for (const req of donations) {
    const card = document.createElement('div');
    card.className = 'vm-card';
    card.style.marginBottom = '1rem';
    card.innerHTML = `
      <h3 style="font-weight:600;margin-bottom:0.5rem;">${req.title || 'Untitled'}</h3>
      <p style="color:var(--text-muted);font-size:0.875rem;">${req.description || ''}</p>
    `;
    container.appendChild(card);
  }

  return function cleanup() {};
}
