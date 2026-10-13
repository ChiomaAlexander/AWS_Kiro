/**
 * landing.js — Public landing page view.
 *
 * Shown to unauthenticated visitors. Explains the platform purpose and provides
 * clear Log In / Sign Up calls to action. If the user is already logged in,
 * a "Go to Feed" shortcut is shown instead.
 *
 * @module views/landing
 */

import { auth } from '../auth.js';
import { router } from '../router.js';
import { store } from '../store.js';
import { el } from '../ui.js';

/**
 * Render the landing page into the given container.
 *
 * @param {HTMLElement} container - The #view-root element
 * @param {object} _params - Route params (unused)
 * @returns {Function} Cleanup function
 */
export default async function renderLanding(container, _params) {
  container.innerHTML = '';

  // ── Dynamic stats pulled from the store ──────────────────────────────────
  const users    = store.get('users') || [];
  const orgs     = store.get('organisations') || [];
  const opps     = store.get('opportunities') || [];

  const statText = `${users.length} volunteers · ${orgs.length} organisations · ${opps.length} opportunities`;

  // ── Check whether user is already logged in ───────────────────────────────
  const loggedIn = Boolean(auth.currentUser());

  // ── Hero CTA buttons ─────────────────────────────────────────────────────
  const ctaButtons = [];

  if (loggedIn) {
    const feedBtn = el('button', {
      class: 'btn btn-primary',
      'aria-label': 'Go to your community feed',
      onClick: () => router.navigate('/feed'),
    }, 'Go to Feed →');
    ctaButtons.push(feedBtn);
  } else {
    const loginBtn = el('button', {
      class: 'btn btn-primary',
      'aria-label': 'Log in to VolunteerMatch',
      onClick: () => router.navigate('/auth?mode=login'),
    }, 'Log In');

    const signupBtn = el('button', {
      class: 'btn btn-secondary',
      'aria-label': 'Sign up for VolunteerMatch',
      onClick: () => router.navigate('/auth?mode=signup'),
    }, 'Sign Up');

    ctaButtons.push(loginBtn, signupBtn);
  }

  // ── Feature columns ───────────────────────────────────────────────────────
  const features = [
    {
      icon: '🙋',
      title: 'Volunteer',
      body: 'Browse open opportunities, apply your skills, and track your community impact over time.',
    },
    {
      icon: '🏢',
      title: 'Organise',
      body: 'Create events, recruit volunteers, and manage your community group or verified organisation.',
    },
    {
      icon: '🎁',
      title: 'Donate',
      body: 'Contribute resources, essential supplies, or financial support to legitimate campaigns.',
    },
    {
      icon: '🩸',
      title: 'Blood Donation',
      body: 'Connect blood donors with urgent requests in a privacy-conscious, verified workflow.',
    },
  ];

  const featureCols = features.map(f =>
    el('div', { class: 'vm-feature-card' },
      el('div', { class: 'vm-feature-icon', 'aria-hidden': 'true' }, f.icon),
      el('h3', { class: 'vm-feature-title' }, f.title),
      el('p',  { class: 'vm-feature-body'  }, f.body),
    )
  );

  // ── Layout assembly ───────────────────────────────────────────────────────
  const page = el('div', { class: 'vm-landing' },

    // Hero
    el('section', { class: 'vm-landing__hero', 'aria-label': 'Welcome to VolunteerMatch' },
      el('div', { class: 'vm-landing__hero-icon', 'aria-hidden': 'true' }, '🤝'),
      el('h1', { class: 'vm-landing__title' }, 'VolunteerMatch 🤝'),
      el('p',  { class: 'vm-landing__tagline' }, 'Connect. Serve. Impact.'),
      el('p',  { class: 'vm-landing__description' },
        'A trusted community network for volunteering, resource donations, ' +
        'and blood-donation coordination. No server, no sign-up required to browse.'
      ),
      el('div', { class: 'vm-landing__cta-row' }, ...ctaButtons),
    ),

    // Feature grid
    el('section', { class: 'vm-feature-grid', 'aria-label': 'Platform features' },
      ...featureCols,
    ),

    // Stats bar
    el('section', { class: 'vm-landing__stats', 'aria-label': 'Platform statistics' },
      el('p', { class: 'vm-landing__stats-text' }, statText),
    ),

    // Footer note
    el('footer', { class: 'vm-landing__footer' },
      el('p', {}, 'Demo application — no real data is stored externally.'),
    ),
  );

  container.appendChild(page);

  // No cleanup needed — no global event listeners added
  return function cleanup() {};
}
