/**
 * feed.js — Community feed view.
 *
 * @module views/feed
 */

import { store } from '../store.js';
import { auth } from '../auth.js';

/**
 * Render the community feed.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Function} Cleanup function
 */
export default async function renderFeed(container, _params) {
  const user = auth.currentUser();
  const posts = store.get('posts') || [];

  container.innerHTML = '';

  const heading = document.createElement('h1');
  heading.textContent = user ? `Welcome back, ${user.displayName || user.username}!` : 'Community Feed';
  heading.style.cssText = 'font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;';
  container.appendChild(heading);

  if (posts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'vm-empty';
    empty.innerHTML = `
      <div class="empty-icon">📭</div>
      <h3>No posts yet</h3>
      <p>Be the first to share a community update.</p>
    `;
    container.appendChild(empty);
    return;
  }

  const users = store.get('users') || [];

  for (const post of posts) {
    const author = users.find(u => u.id === post.authorId);
    const card = document.createElement('div');
    card.className = 'vm-card';
    card.style.marginBottom = '1rem';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
        <div class="vm-avatar">${(author?.displayName || '?')[0].toUpperCase()}</div>
        <div>
          <div style="font-weight:600;font-size:0.9rem;">${author?.displayName || 'Unknown'}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">@${author?.username || '?'}</div>
        </div>
      </div>
      <p style="color:var(--text-muted);font-size:0.9rem;">${post.body || ''}</p>
    `;
    container.appendChild(card);
  }

  return function cleanup() {};
}
