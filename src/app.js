/**
 * app.js — Platform bootstrap for VolunteerMatch.
 *
 * Responsibilities:
 *   1. Initialise the store (seeds from sample data on first load).
 *   2. Register all routes with the router.
 *   3. Mount the navigation component into sidebar + bottom bar.
 *   4. Start the router (handles the current hash and subsequent changes).
 *
 * All imports use explicit .js extensions (required for native ES modules).
 *
 * @module app
 */

import './firebase.js';
import { store } from './store.js';
import { auth } from './auth.js';
import { router } from './router.js';
import mountNav from './components/nav.js';

// ── View imports ────────────────────────────────────────────────────────────
import renderLanding          from './views/landing.js';
import renderAuth             from './views/auth.js';
import renderFeed             from './views/feed.js';
import renderOpportunities    from './views/opportunities.js';
import renderOpportunityDetail from './views/opportunity-detail.js';
import renderProfile          from './views/profile.js';
import renderOrganisations    from './views/organisations.js';
import renderDonations        from './views/donations.js';
import renderBloodDonation    from './views/blood-donation.js';
import renderSettings         from './views/settings.js';

/**
 * Register all application routes.
 * Order matters: more specific patterns before wildcards.
 */
function registerRoutes() {
  router.register('/',                  renderLanding);
  router.register('/landing',           renderLanding);
  router.register('/auth',              renderAuth);
  router.register('/feed',              renderFeed);
  router.register('/opportunities',     renderOpportunities);
  router.register('/opportunities/:id', renderOpportunityDetail);
  router.register('/profile/:username', renderProfile);
  router.register('/organisations',     renderOrganisations);
  router.register('/donations',         renderDonations);
  router.register('/blood-donation',    renderBloodDonation);
  router.register('/settings',          renderSettings);
}

/**
 * Ensure the mobile bottom bar element exists in the DOM.
 * app.js creates it dynamically so that index.html stays minimal.
 *
 * @returns {HTMLElement}
 */
function ensureBottomBar() {
  let bar = document.getElementById('bottom-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'bottom-bar';
    bar.className = 'vm-bottom-bar';
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', 'Mobile navigation');
    document.body.appendChild(bar);
  }
  return bar;
}

/**
 * Bootstrap function — called once the DOM is ready.
 */
function initApp() {
  // Subscribe to Firebase Auth state changes and hydrate collections from Firestore.
  auth.initAuthListener();
  store.hydrateFromFirestore().then(() => {
    store.enableRealtimeSync();
  });

  // Register all routes before starting the router.
  registerRoutes();

  // Mount navigation into sidebar and bottom bar.
  const sidebarEl   = document.getElementById('sidebar');
  const bottomBarEl = ensureBottomBar();

  if (sidebarEl) {
    mountNav(sidebarEl, bottomBarEl);
  }

  // Start the router: handles the current hash and listens for hashchange.
  router.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
