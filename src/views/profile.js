/**
 * profile.js — User profile view.
 *
 * @module views/profile
 */

import { store } from '../store.js';
import { auth } from '../auth.js';

/**
 * Render a user profile.
 *
 * @param {HTMLElement} container
 * @param {{ username: string }} params
 * @returns {Function} Cleanup function
 */
export default async function renderProfile(container, params) {
  const currentUser = auth.currentUser();
  const users = store.get('users') || [];

  // 'me' resolves to the current user's username
  const username = params.username === 'me'
    ? currentUser?.username
    : params.username;

  const user = users.find(u => u.username === username);

  container.innerHTML = '';

  if (!user) {
    const error = document.createElement('div');
    error.className = 'vm-error';
    error.textContent = 'User not found.';
    container.appendChild(error);
    return () => {};
  }

  const initials = user.displayName
    ? user.displayName.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : user.username[0].toUpperCase();

  const card = document.createElement('div');
  card.className = 'vm-card';
  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
      <div class="vm-avatar avatar-lg">${initials}</div>
      <div>
        <h1 style="font-size:1.25rem;font-weight:700;">${user.displayName || user.username}</h1>
        <div style="color:var(--text-muted);">@${user.username}</div>
      </div>
    </div>
    <p style="color:var(--text-muted);">${user.bio || 'No bio yet.'}</p>
  `;
  container.appendChild(card);

  return function cleanup() {};
}
