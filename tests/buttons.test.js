import { describe, it, expect, beforeEach, vi } from 'vitest';
import { router } from '../src/router.js';
import { store } from '../src/store.js';
import { auth } from '../src/auth.js';
import mountNav from '../src/components/nav.js';
import renderLanding from '../src/views/landing.js';
import renderAuth from '../src/views/auth.js';
import renderFeed from '../src/views/feed.js';
import renderOpportunities from '../src/views/opportunities.js';
import renderOpportunityDetail from '../src/views/opportunity-detail.js';

function setupDOM() {
  document.body.innerHTML = `
    <div class="vm-layout">
      <aside id="sidebar"></aside>
      <main id="main-content">
        <div id="view-root"></div>
      </main>
    </div>
  `;
}

describe('Button and interaction workflows', () => {
  beforeEach(() => {
    localStorage.clear();
    setupDOM();
    window.location.hash = '';

    // Register primary routes
    router.register('/landing', renderLanding);
    router.register('/auth', renderAuth);
    router.register('/feed', renderFeed);
    router.register('/opportunities', renderOpportunities);
    router.register('/opportunities/:id', renderOpportunityDetail);

    const sidebarEl = document.getElementById('sidebar');
    mountNav(sidebarEl, null);
  });

  it('landing page buttons navigate to auth login and signup with correct mode query', async () => {
    window.location.hash = '#/landing';
    router._handleRoute();

    const viewRoot = document.getElementById('view-root');
    const buttons = Array.from(viewRoot.querySelectorAll('button'));

    const loginBtn = buttons.find(b => b.textContent.trim() === 'Log In');
    const signupBtn = buttons.find(b => b.textContent.trim() === 'Sign Up');
    const demoBtn = buttons.find(b => b.textContent.includes('One-Click Demo'));

    expect(loginBtn).toBeDefined();
    expect(signupBtn).toBeDefined();
    expect(demoBtn).toBeDefined();

    // Click Log In
    loginBtn.click();
    router._handleRoute();
    expect(window.location.hash).toBe('#/auth?mode=login');
    expect(viewRoot.querySelector('#tab-login').getAttribute('aria-selected')).toBe('true');

    // Return to landing and click Sign Up
    window.location.hash = '#/landing';
    router._handleRoute();
    const freshSignupBtn = Array.from(viewRoot.querySelectorAll('button')).find(b => b.textContent.trim() === 'Sign Up');
    freshSignupBtn.click();
    router._handleRoute();
    expect(window.location.hash).toBe('#/auth?mode=signup');
    expect(viewRoot.querySelector('#tab-signup').getAttribute('aria-selected')).toBe('true');
  });

  it('One-Click Demo button logs in and navigates to feed', async () => {
    window.location.hash = '#/landing';
    router._handleRoute();

    const viewRoot = document.getElementById('view-root');
    const demoBtn = Array.from(viewRoot.querySelectorAll('button')).find(b => b.textContent.includes('One-Click Demo'));

    demoBtn.click();
    router._handleRoute();

    expect(auth.currentUser()).not.toBeNull();
    expect(auth.currentUser().username).toBe('jordan_lee');
    expect(window.location.hash).toBe('#/feed');
  });

  it('auth view tab buttons switch between login and signup', async () => {
    window.location.hash = '#/auth?mode=login';
    router._handleRoute();

    const viewRoot = document.getElementById('view-root');
    const loginTab = viewRoot.querySelector('#tab-login');
    const signupTab = viewRoot.querySelector('#tab-signup');

    expect(loginTab.getAttribute('aria-selected')).toBe('true');

    // Click signup tab
    signupTab.click();
    expect(signupTab.getAttribute('aria-selected')).toBe('true');
    expect(viewRoot.querySelector('#su-username')).toBeDefined();

    // Click login tab
    loginTab.click();
    expect(loginTab.getAttribute('aria-selected')).toBe('true');
    expect(viewRoot.querySelector('#auth-identifier')).toBeDefined();
  });

  it('quick demo login button in auth logs in user', async () => {
    window.location.hash = '#/auth?mode=login';
    router._handleRoute();

    const viewRoot = document.getElementById('view-root');
    const adminQuickBtn = Array.from(viewRoot.querySelectorAll('.vm-auth__quick-fill button'))
      .find(b => b.textContent.includes('Admin'));

    expect(adminQuickBtn).toBeDefined();
    adminQuickBtn.click();
    router._handleRoute();

    expect(auth.currentUser()).not.toBeNull();
    expect(auth.currentUser().username).toBe('admin');
  });

  it('unauthenticated click on sidebar nav item prompts and navigates to auth', async () => {
    window.location.hash = '#/landing';
    router._handleRoute();

    const sidebar = document.getElementById('sidebar');
    const oppNavBtn = Array.from(sidebar.querySelectorAll('.vm-nav-item'))
      .find(b => b.textContent.includes('Opportunities'));

    expect(oppNavBtn).toBeDefined();
    oppNavBtn.click();
    router._handleRoute();

    expect(window.location.hash).toBe('#/auth?mode=login');
  });
});
