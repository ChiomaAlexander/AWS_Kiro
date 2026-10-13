/**
 * auth.js — Login / Sign-up view.
 *
 * @module views/auth
 */

import { auth } from '../auth.js';
import { router } from '../router.js';

/**
 * Render the authentication view.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Function} Cleanup function
 */
export default async function renderAuth(container, _params) {
  container.innerHTML = `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      min-height:80vh;
      padding:2rem;
    ">
      <div class="vm-card" style="width:100%;max-width:24rem;">
        <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1.5rem;">
          Sign In to VolunteerMatch
        </h2>
        <div id="auth-error" class="error-message" role="alert" style="margin-bottom:0.75rem;"></div>
        <div class="form-group">
          <label for="auth-identifier">Username or Email</label>
          <input type="text" id="auth-identifier" placeholder="username or email" autocomplete="username">
        </div>
        <div class="form-group">
          <label for="auth-password">Password</label>
          <input type="password" id="auth-password" placeholder="password" autocomplete="current-password">
        </div>
        <button id="auth-submit" class="btn btn-primary" style="width:100%;margin-top:0.5rem;">
          Sign In
        </button>
        <p style="margin-top:1rem;text-align:center;font-size:0.8rem;color:var(--text-muted);">
          Demo: use any username with password <code>demo</code>
        </p>
      </div>
    </div>
  `;

  const errorEl = container.querySelector('#auth-error');
  const identifierEl = container.querySelector('#auth-identifier');
  const passwordEl = container.querySelector('#auth-password');
  const submitBtn = container.querySelector('#auth-submit');

  function handleSubmit() {
    errorEl.textContent = '';
    const identifier = identifierEl.value.trim();
    const password = passwordEl.value;
    const result = auth.login({ identifier, password });
    if (result.ok) {
      router.navigate('/feed');
    } else {
      errorEl.textContent = result.error;
    }
  }

  submitBtn.addEventListener('click', handleSubmit);
  const keyHandler = e => { if (e.key === 'Enter') handleSubmit(); };
  container.addEventListener('keydown', keyHandler);

  return function cleanup() {
    submitBtn.removeEventListener('click', handleSubmit);
    container.removeEventListener('keydown', keyHandler);
  };
}
