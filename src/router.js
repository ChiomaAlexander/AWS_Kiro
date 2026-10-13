/**
 * router.js — Hash-based client-side router singleton for VolunteerMatch.
 *
 * Routes are registered with router.register(pattern, renderFn).
 * Navigation is performed with router.navigate(path).
 *
 * Hash format: #/feed, #/opportunities/opp1, #/profile/jordan_lee
 *
 * Pattern matching: /opportunities/:id → params = { id: 'opp1' }
 *
 * Auth guard: all routes except /landing and /auth redirect to /landing
 * when no session is active.
 *
 * Usage:
 *   import { router } from './router.js'
 *   router.register('/feed', renderFeed)
 *   router.navigate('/feed')
 *   router.start()
 */

/** Routes that do not require authentication */
const PUBLIC_ROUTES = new Set(['/landing', '/auth']);

/**
 * Try to match a URL path against a registered route pattern.
 * Returns the extracted params object on a match, or null if no match.
 *
 * @param {string} pattern - e.g. '/opportunities/:id'
 * @param {string} urlPath  - e.g. '/opportunities/opp1'
 * @returns {object|null}
 */
function matchRoute(pattern, urlPath) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = urlPath.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const seg = patternParts[i];
    if (seg.startsWith(':')) {
      // Named param — capture value
      params[seg.slice(1)] = pathParts[i];
    } else if (seg !== pathParts[i]) {
      // Static segment mismatch
      return null;
    }
  }
  return params;
}

/**
 * Parse the current window.location.hash into a clean path string.
 * '#/feed' → '/feed'   |   '' or '#' → '/'
 *
 * @returns {string}
 */
function currentHashPath() {
  const hash = window.location.hash;
  if (!hash || hash === '#') return '/';
  // Strip leading '#'
  const path = hash.slice(1);
  // Ensure leading slash
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Router singleton.
 */
class Router {
  constructor() {
    /**
     * Registered routes as an array of { pattern, renderFn } objects.
     * Order matters: first match wins.
     * @type {Array<{ pattern: string, renderFn: Function }>}
     */
    this._routes = [];

    /**
     * Teardown function returned by the previous view render, if any.
     * @type {Function|null}
     */
    this._teardown = null;

    /**
     * The most recently rendered route info.
     * @type {{ path: string, params: object }|null}
     */
    this._current = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Register a route pattern to a render function.
   * The render function signature is: renderFn(container, params) → teardown|void
   *
   * @param {string} pattern - e.g. '/feed' or '/opportunities/:id'
   * @param {Function} renderFn - Called when the route is matched
   */
  register(pattern, renderFn) {
    this._routes.push({ pattern, renderFn });
  }

  /**
   * Navigate to a path by updating window.location.hash.
   * Triggers a hashchange event which start() is already listening to.
   *
   * @param {string} path - e.g. '/feed' or '/opportunities/opp1'
   */
  navigate(path) {
    window.location.hash = `#${path}`;
  }

  /**
   * Return the current route info ({ path, params }), or null before start().
   *
   * @returns {{ path: string, params: object }|null}
   */
  current() {
    return this._current;
  }

  /**
   * Start the router: listen for hashchange events and render the current route.
   * Should be called once from app.js after all routes have been registered.
   */
  start() {
    window.addEventListener('hashchange', () => this._handleRoute());
    // Render whatever is in the hash right now (handles page refresh / direct links)
    this._handleRoute();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /**
   * Determine if the current user is authenticated.
   * Reads vm_session from localStorage to avoid a circular import with auth.js.
   * @returns {boolean}
   * @private
   */
  _isAuthed() {
    try {
      const raw = localStorage.getItem('vm_session');
      if (!raw) return false;
      const session = JSON.parse(raw);
      return Boolean(session && session.userId);
    } catch {
      return false;
    }
  }

  /**
   * Match the current hash path and render the appropriate view.
   * Applies the auth guard before rendering.
   * @private
   */
  _handleRoute() {
    const path = currentHashPath();

    // Auth guard — protect all routes except public ones
    if (!PUBLIC_ROUTES.has(path) && !this._isAuthed()) {
      // Redirect without adding a history entry for the guarded path
      this.navigate('/landing');
      return;
    }

    // Find matching route
    let matchedRoute = null;
    let matchedParams = null;

    for (const route of this._routes) {
      const params = matchRoute(route.pattern, path);
      if (params !== null) {
        matchedRoute = route;
        matchedParams = params;
        break;
      }
    }

    if (!matchedRoute) {
      // Unknown route: go to feed if authed, landing if not
      this.navigate(this._isAuthed() ? '/feed' : '/landing');
      return;
    }

    // Teardown previous view
    if (typeof this._teardown === 'function') {
      try {
        this._teardown();
      } catch {
        // Ignore teardown errors — they should not prevent navigation
      }
      this._teardown = null;
    }

    // Render matched view into #view-root
    const container = document.getElementById('view-root');
    if (!container) return;

    this._current = { path, params: matchedParams };

    // Render — may be async; we handle the teardown either way
    const result = matchedRoute.renderFn(container, matchedParams);

    if (result && typeof result.then === 'function') {
      // Async render — save teardown when it resolves
      result.then(teardown => {
        if (typeof teardown === 'function') {
          this._teardown = teardown;
        }
      });
    } else if (typeof result === 'function') {
      this._teardown = result;
    }

    // Manage focus for accessibility: focus the view root after navigation
    if (container) {
      container.setAttribute('tabindex', '-1');
      container.focus({ preventScroll: false });
    }
  }
}

/** Singleton export — the single router instance used across the whole app */
export const router = new Router();
