/**
 * router.test.js — Unit tests for src/router.js hash router singleton.
 *
 * The router renders views into #view-root, so each test that calls
 * _handleRoute() must create that element in the jsdom document first.
 *
 * Tests cover:
 * - Route pattern matching (static + :params)
 * - navigate() updates window.location.hash
 * - _isAuthed() reads vm_session correctly
 * - Auth guard redirects unauthenticated users from protected routes
 * - Public routes are accessible without a session
 * - Teardown is called when navigating away from a view
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Setup helpers ─────────────────────────────────────────────────────────────

/**
 * Ensure #view-root exists in the jsdom document.
 * The router renders views into this element; without it, _handleRoute() bails.
 */
function ensureViewRoot() {
  if (!document.getElementById('view-root')) {
    const div = document.createElement('div');
    div.id = 'view-root';
    document.body.appendChild(div);
  }
}

/** Clear session and reset hash before each test. */
beforeEach(() => {
  localStorage.removeItem('vm_session');
  window.location.hash = '';
  ensureViewRoot();
});

// ── Route matching — static routes ───────────────────────────────────────────

describe('router — static route matching', () => {
  it('matches a static route and calls its renderFn', async () => {
    const { router } = await import('../src/router.js');
    ensureViewRoot();

    // Give the router an authenticated session so the guard passes
    localStorage.setItem('vm_session', JSON.stringify({ userId: 'u1', token: 'x' }));

    const renderFn = vi.fn();
    router.register('/vm-static-test', renderFn);

    window.location.hash = '#/vm-static-test';
    router._handleRoute();

    expect(renderFn).toHaveBeenCalled();
  });

  it('sets current() path after matching', async () => {
    const { router } = await import('../src/router.js');
    ensureViewRoot();

    localStorage.setItem('vm_session', JSON.stringify({ userId: 'u1', token: 'x' }));

    const renderFn = vi.fn();
    router.register('/vm-current-test', renderFn);

    window.location.hash = '#/vm-current-test';
    router._handleRoute();

    expect(router.current()?.path).toBe('/vm-current-test');
  });
});

// ── Route matching — dynamic :params ─────────────────────────────────────────

describe('router — dynamic param extraction', () => {
  it('extracts a single :param', async () => {
    const { router } = await import('../src/router.js');
    ensureViewRoot();

    localStorage.setItem('vm_session', JSON.stringify({ userId: 'u1', token: 'x' }));

    const renderFn = vi.fn();
    router.register('/vm-profile/:username', renderFn);

    window.location.hash = '#/vm-profile/jordan_lee';
    router._handleRoute();

    const current = router.current();
    expect(current?.path).toBe('/vm-profile/jordan_lee');
    expect(current?.params?.username).toBe('jordan_lee');
  });

  it('extracts multiple :params', async () => {
    const { router } = await import('../src/router.js');
    ensureViewRoot();

    localStorage.setItem('vm_session', JSON.stringify({ userId: 'u1', token: 'x' }));

    const renderFn = vi.fn();
    router.register('/vm-section/:area/:id', renderFn);

    window.location.hash = '#/vm-section/opportunities/opp1';
    router._handleRoute();

    const current = router.current();
    expect(current?.params?.area).toBe('opportunities');
    expect(current?.params?.id).toBe('opp1');
  });

  it('passes params as second argument to renderFn', async () => {
    const { router } = await import('../src/router.js');
    ensureViewRoot();

    localStorage.setItem('vm_session', JSON.stringify({ userId: 'u1', token: 'x' }));

    const renderFn = vi.fn();
    router.register('/vm-item/:id', renderFn);

    window.location.hash = '#/vm-item/abc123';
    router._handleRoute();

    expect(renderFn).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ id: 'abc123' })
    );
  });
});

// ── navigate() ───────────────────────────────────────────────────────────────

describe('router — navigate()', () => {
  it('sets window.location.hash with # prefix', async () => {
    const { router } = await import('../src/router.js');
    router.navigate('/feed');
    expect(window.location.hash).toBe('#/feed');
  });

  it('navigate to /landing sets correct hash', async () => {
    const { router } = await import('../src/router.js');
    router.navigate('/landing');
    expect(window.location.hash).toBe('#/landing');
  });
});

// ── _isAuthed() ───────────────────────────────────────────────────────────────

describe('router — _isAuthed()', () => {
  it('returns false when no session exists', async () => {
    const { router } = await import('../src/router.js');
    localStorage.removeItem('vm_session');
    expect(router._isAuthed()).toBe(false);
  });

  it('returns true when vm_session has a userId', async () => {
    const { router } = await import('../src/router.js');
    localStorage.setItem('vm_session', JSON.stringify({ userId: 'u1', token: 'demo_token_u1' }));
    expect(router._isAuthed()).toBe(true);
  });

  it('returns false when vm_session is corrupt JSON', async () => {
    const { router } = await import('../src/router.js');
    localStorage.setItem('vm_session', 'NOT_VALID_JSON{{{');
    expect(router._isAuthed()).toBe(false);
  });

  it('returns false when userId is missing from session', async () => {
    const { router } = await import('../src/router.js');
    localStorage.setItem('vm_session', JSON.stringify({ token: 'some-token' }));
    expect(router._isAuthed()).toBe(false);
  });
});

// ── Auth guard ────────────────────────────────────────────────────────────────

describe('router — auth guard', () => {
  it('redirects unauthenticated user to /landing from a protected route', async () => {
    const { router } = await import('../src/router.js');
    ensureViewRoot();

    localStorage.removeItem('vm_session'); // not logged in

    // Register a "landing" handler so the redirect doesn't fall through to unknown route
    router.register('/landing', vi.fn());

    window.location.hash = '#/feed';
    router._handleRoute();

    // Hash should now be #/landing (guard redirected)
    expect(window.location.hash).toBe('#/landing');
  });

  it('allows unauthenticated access to /landing', async () => {
    const { router } = await import('../src/router.js');
    ensureViewRoot();

    localStorage.removeItem('vm_session');

    // The router singleton may already have /landing registered from app.js seeding
    // or other tests. We verify the observable: current() path is /landing (not
    // redirected elsewhere), proving the public route was honoured.
    window.location.hash = '#/landing';
    router._handleRoute();

    // The router should NOT have redirected away from /landing
    expect(window.location.hash).toBe('#/landing');
  });

  it('allows unauthenticated access to /auth with query params', async () => {
    const { router } = await import('../src/router.js');
    ensureViewRoot();

    localStorage.removeItem('vm_session');

    const authFn = vi.fn();
    router.register('/auth', authFn);

    window.location.hash = '#/auth?mode=signup';
    router._handleRoute();

    expect(authFn).toHaveBeenCalled();
    expect(router.current()?.path).toBe('/auth');
    expect(router.current()?.query?.get('mode')).toBe('signup');
  });
});

// ── Teardown ──────────────────────────────────────────────────────────────────

describe('router — teardown', () => {
  it('calls teardown from the previous view on navigation', async () => {
    const { router } = await import('../src/router.js');
    ensureViewRoot();

    // Authenticated
    localStorage.setItem('vm_session', JSON.stringify({ userId: 'u1', token: 'x' }));

    const teardownFn = vi.fn();
    const viewA = vi.fn().mockReturnValue(teardownFn);
    const viewB = vi.fn();

    router.register('/vm-teardown-a', viewA);
    router.register('/vm-teardown-b', viewB);

    // Navigate to A — stores teardownFn
    window.location.hash = '#/vm-teardown-a';
    router._handleRoute();
    expect(viewA).toHaveBeenCalled();

    // Navigate to B — should call teardownFn first
    window.location.hash = '#/vm-teardown-b';
    router._handleRoute();

    expect(teardownFn).toHaveBeenCalledOnce();
    expect(viewB).toHaveBeenCalled();
  });
});
