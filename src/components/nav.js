/**
 * nav.js — Sidebar and mobile bottom-bar navigation component.
 *
 * Mounts into two separate containers:
 *   - sidebarEl: the full left-sidebar (visible on desktop)
 *   - bottomBarEl: the compact bottom bar (visible on mobile)
 *
 * Marks the active item whenever the hash changes.
 * Shows user avatar, display name and sign-out at the bottom of the sidebar.
 * If no user is logged in, shows a "Sign in" prompt instead.
 *
 * @module components/nav
 */

import { auth } from '../auth.js';
import { router } from '../router.js';
import { showToast } from './toast.js';

/** Primary nav items shown in sidebar and bottom bar. */
const NAV_ITEMS = [
  { icon: '🏠', label: 'Home',          route: '/feed' },
  { icon: '🔍', label: 'Opportunities', route: '/opportunities' },
  { icon: '🏢', label: 'Organisations', route: '/organisations' },
  { icon: '🎁', label: 'Donations',     route: '/donations' },
  { icon: '🩸', label: 'Blood Donation',route: '/blood-donation' },
  { icon: '👤', label: 'My Profile',    route: '/profile/me' },
  { icon: '⚙️', label: 'Settings',      route: '/settings' },
];

/** Icons shown for toast/status types (used by showToast). */
const TYPE_ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

/**
 * Return the initials (up to 2 chars) from a display name string.
 * @param {string} name
 * @returns {string}
 */
function initials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Determine which nav route is currently active based on the hash path.
 * @returns {string} Current path, e.g. '/feed'
 */
function activePath() {
  const current = router.current();
  if (current && current.path) return current.path;
  // Fallback: parse hash directly
  const hash = window.location.hash;
  if (!hash || hash === '#') return '/';
  const path = hash.slice(1);
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Build a single nav item button element.
 * @param {{ icon: string, label: string, route: string }} item
 * @param {boolean} isActive
 * @returns {HTMLButtonElement}
 */
function buildNavItem(item, isActive) {
  const btn = document.createElement('button');
  btn.className = 'vm-nav-item' + (isActive ? ' active' : '');
  btn.setAttribute('aria-label', item.label);
  if (isActive) btn.setAttribute('aria-current', 'page');

  const iconSpan = document.createElement('span');
  iconSpan.className = 'nav-icon';
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.textContent = item.icon;

  const labelSpan = document.createElement('span');
  labelSpan.className = 'nav-label';
  labelSpan.textContent = item.label;

  btn.appendChild(iconSpan);
  btn.appendChild(labelSpan);

  btn.addEventListener('click', () => {
    if (!auth.currentUser()) {
      showToast(`Please sign in to access ${item.label}`, 'info');
      router.navigate('/auth?mode=login');
      return;
    }
    router.navigate(item.route);
  });
  return btn;
}

/**
 * Mount the sidebar navigation into sidebarEl and, if provided,
 * the bottom-bar navigation into bottomBarEl.
 *
 * Returns a teardown function that removes the hashchange listener.
 *
 * @param {HTMLElement} sidebarEl - The aside#sidebar element
 * @param {HTMLElement|null} bottomBarEl - The div#bottom-bar element (or null)
 * @returns {Function} Teardown / cleanup function
 */
export default function mountNav(sidebarEl, bottomBarEl) {
  if (!sidebarEl) return () => {};

  function updateLayout() {
    const isAuthed = Boolean(auth.currentUser());
    const layout = document.querySelector('.vm-layout');
    if (layout) {
      layout.classList.toggle('no-sidebar', !isAuthed);
    }
  }

  /**
   * Build or rebuild the sidebar contents.
   */
  function renderSidebar() {
    updateLayout();
    sidebarEl.innerHTML = '';

    // ── Logo ────────────────────────────────────────────────
    const logo = document.createElement('a');
    logo.className = 'vm-nav-logo';
    logo.href = auth.currentUser() ? '#/feed' : '#/landing';
    logo.setAttribute('aria-label', 'VolunteerMatch — home');
    logo.innerHTML = '<span aria-hidden="true">🤝</span> VolunteerMatch';
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(auth.currentUser() ? '/feed' : '/landing');
    });
    sidebarEl.appendChild(logo);

    // ── Nav items ────────────────────────────────────────────
    const nav = document.createElement('nav');
    nav.className = 'vm-nav-section';
    nav.setAttribute('aria-label', 'Main navigation');

    const path = activePath();
    for (const item of NAV_ITEMS) {
      // Profile route is dynamic (/profile/:username), match prefix
      const isActive = item.route.startsWith('/profile')
        ? path.startsWith('/profile')
        : path === item.route;
      nav.appendChild(buildNavItem(item, isActive));
    }
    sidebarEl.appendChild(nav);

    // ── User section ─────────────────────────────────────────
    const user = auth.currentUser();
    if (user) {
      const userSection = document.createElement('div');
      userSection.className = 'vm-nav-user';

      // Avatar
      const avatar = document.createElement('div');
      avatar.className = 'vm-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = initials(user.displayName);
      userSection.appendChild(avatar);

      // Name + handle
      const info = document.createElement('div');
      info.className = 'vm-nav-user-info';

      const nameEl = document.createElement('div');
      nameEl.className = 'vm-nav-user-name';
      nameEl.textContent = user.displayName || user.username;
      info.appendChild(nameEl);

      const handleEl = document.createElement('div');
      handleEl.className = 'vm-nav-user-handle';
      handleEl.textContent = '@' + user.username;
      info.appendChild(handleEl);

      userSection.appendChild(info);

      // Sign out button
      const signOut = document.createElement('button');
      signOut.className = 'vm-nav-signout';
      signOut.setAttribute('aria-label', 'Sign out');
      signOut.textContent = 'Sign out';
      signOut.addEventListener('click', () => {
        auth.logout();
        router.navigate('/landing');
      });
      userSection.appendChild(signOut);

      sidebarEl.appendChild(userSection);
    } else {
      const prompt = document.createElement('div');
      prompt.className = 'vm-nav-signin-prompt';
      prompt.innerHTML =
        '<a href="#/auth?mode=login" aria-label="Sign in to VolunteerMatch">Sign in to see more →</a>';
      sidebarEl.appendChild(prompt);
    }
  }

  /**
   * Build or rebuild the mobile bottom-bar contents.
   */
  function renderBottomBar() {
    if (!bottomBarEl) return;
    bottomBarEl.innerHTML = '';

    // Show only first 5 items in the bottom bar (space constraint)
    const mobileItems = NAV_ITEMS.slice(0, 5);
    const path = activePath();

    for (const item of mobileItems) {
      const isActive = item.route.startsWith('/profile')
        ? path.startsWith('/profile')
        : path === item.route;
      bottomBarEl.appendChild(buildNavItem(item, isActive));
    }
  }

  // Initial render
  renderSidebar();
  renderBottomBar();

  // Update active state and user info on every hash change
  function onHashChange() {
    renderSidebar();
    renderBottomBar();
  }

  window.addEventListener('hashchange', onHashChange);

  // Teardown — removes the hashchange listener
  return function teardown() {
    window.removeEventListener('hashchange', onHashChange);
  };
}
