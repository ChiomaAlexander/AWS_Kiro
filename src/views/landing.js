/**
 * landing.js — Landing / welcome page view.
 * Shown to unauthenticated visitors.
 *
 * @module views/landing
 */

import { router } from '../router.js';

/**
 * Render the landing page into the given container.
 *
 * @param {HTMLElement} container - The #view-root element
 * @param {object} _params - Route params (unused)
 * @returns {Function} Cleanup function
 */
export default async function renderLanding(container, _params) {
  container.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      min-height:80vh;
      gap:1.5rem;
      text-align:center;
      padding:2rem;
    ">
      <div style="font-size:3.5rem;">🤝</div>
      <h1 style="font-size:2rem;font-weight:800;color:var(--text-main);">VolunteerMatch</h1>
      <p style="color:var(--text-muted);max-width:28rem;font-size:1rem;">
        A trusted community network for volunteering, resource donations,
        and blood-donation coordination.
      </p>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;">
        <button id="landing-login" class="btn btn-primary" style="padding:0.65rem 1.75rem;">
          Log In
        </button>
        <button id="landing-signup" class="btn btn-secondary" style="padding:0.65rem 1.75rem;">
          Sign Up
        </button>
      </div>
    </div>
  `;

  function onLogin() { router.navigate('/auth'); }
  function onSignup() { router.navigate('/auth'); }

  const loginBtn = container.querySelector('#landing-login');
  const signupBtn = container.querySelector('#landing-signup');
  loginBtn.addEventListener('click', onLogin);
  signupBtn.addEventListener('click', onSignup);

  return function cleanup() {
    loginBtn.removeEventListener('click', onLogin);
    signupBtn.removeEventListener('click', onSignup);
  };
}
