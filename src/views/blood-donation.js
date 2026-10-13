/**
 * blood-donation.js — Blood donation coordination view.
 *
 * IMPORTANT: Medical disclaimer must appear on every render.
 *
 * @module views/blood-donation
 */

import { store } from '../store.js';

/**
 * Render the blood donation view.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Function} Cleanup function
 */
export default async function renderBloodDonation(container, _params) {
  container.innerHTML = '';

  // Medical disclaimer — always visible per product rules
  const disclaimer = document.createElement('div');
  disclaimer.style.cssText = `
    background:color-mix(in srgb,var(--info) 10%,transparent);
    border:1px solid color-mix(in srgb,var(--info) 40%,transparent);
    border-radius:var(--radius-sm);
    padding:0.75rem 1rem;
    margin-bottom:1.5rem;
    font-size:0.8rem;
    color:var(--info);
  `;
  disclaimer.innerHTML = '<strong>Medical disclaimer:</strong> VolunteerMatch facilitates connections only. Consult a qualified medical professional before donating blood.';
  container.appendChild(disclaimer);

  const heading = document.createElement('h1');
  heading.textContent = 'Blood Donation';
  heading.style.cssText = 'font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;';
  container.appendChild(heading);

  const requests = store.get('bloodRequests') || [];
  const donors = store.get('bloodDonors') || [];

  // Requests section
  const reqHeading = document.createElement('h2');
  reqHeading.textContent = 'Active Requests';
  reqHeading.style.cssText = 'font-size:1rem;font-weight:600;margin-bottom:0.75rem;';
  container.appendChild(reqHeading);

  if (requests.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'vm-empty';
    empty.innerHTML = '<div class="empty-icon">🩸</div><h3>No active blood requests</h3>';
    container.appendChild(empty);
  } else {
    for (const req of requests) {
      const card = document.createElement('div');
      card.className = 'vm-card';
      card.style.marginBottom = '1rem';
      card.innerHTML = `
        <h3 style="font-weight:600;margin-bottom:0.25rem;">Blood type needed: ${req.bloodType || 'Any'}</h3>
        <p style="color:var(--text-muted);font-size:0.875rem;">${req.notes || ''}</p>
      `;
      container.appendChild(card);
    }
  }

  return function cleanup() {};
}
