/**
 * auth.test.js — Unit tests for src/auth.js authentication helpers.
 *
 * Uses jsdom (configured in vitest.config.js) so localStorage is available.
 * Each test resets the store to sample data for isolation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../src/store.js';
import { auth  } from '../src/auth.js';

// Reset state before each test so tests don't interfere with each other
beforeEach(() => {
  localStorage.clear();
  store.reset();
});

// ── Sign up ───────────────────────────────────────────────────────────────────

describe('auth.signup', () => {
  it('creates a new user and starts a session', () => {
    const result = auth.signup({
      username   : 'testuser99',
      email      : 'test99@example.com',
      password   : 'password123',
      displayName: 'Test User',
    });

    expect(result.ok).toBe(true);
    expect(result.user.username).toBe('testuser99');
    expect(result.user.email).toBe('test99@example.com');
    expect(result.user.displayName).toBe('Test User');
    expect(result.user.role).toBe('user');
    expect(result.user.onboarded).toBe(false);

    // Should now be the current user
    expect(auth.currentUser()?.username).toBe('testuser99');
  });

  it('rejects a duplicate username (case-insensitive)', () => {
    // jordan_lee is in the sample data
    const result = auth.signup({
      username   : 'JORDAN_LEE', // uppercase variant
      email      : 'different@example.com',
      password   : 'password123',
      displayName: 'Jordan Copy',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/taken/i);
  });

  it('rejects a duplicate email (case-insensitive)', () => {
    // Sign up once
    auth.signup({
      username: 'firstuser', email: 'unique@x.com',
      password: 'pass1234', displayName: 'First',
    });
    auth.logout();

    // Try same email with different username
    const result = auth.signup({
      username: 'seconduser', email: 'UNIQUE@X.COM',
      password: 'pass5678', displayName: 'Second',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/email/i);
  });

  it('rejects when required fields are missing', () => {
    const result = auth.signup({
      username: 'nopassword', email: 'np@x.com',
      password: '', displayName: 'No Pass',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('stores user in the store after signup', () => {
    auth.signup({
      username: 'storecheck', email: 'sc@x.com',
      password: 'abc12345', displayName: 'Store Check',
    });
    const users = store.get('users');
    expect(users.some(u => u.username === 'storecheck')).toBe(true);
  });

  it('does not store the password in plain text', () => {
    auth.signup({
      username: 'pwcheck', email: 'pw@x.com',
      password: 'mySecretPassword', displayName: 'PW Check',
    });
    const users = store.get('users');
    const newUser = users.find(u => u.username === 'pwcheck');
    expect(newUser.passwordHash).not.toBe('mySecretPassword');
    // Should be the demo hash format
    expect(newUser.passwordHash).toBe('DEMO_HASH_pwcheck');
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('auth.login', () => {
  it('logs in with username and "demo" password', () => {
    // jordan_lee is a sample user — demo password always works
    const result = auth.login({ identifier: 'jordan_lee', password: 'demo' });
    expect(result.ok).toBe(true);
    expect(result.user.username).toBe('jordan_lee');
  });

  it('logs in with email and "demo" password', () => {
    // Get a sample user's email
    const users = store.get('users');
    const sampleUser = users.find(u => u.username === 'jordan_lee');
    if (!sampleUser) return; // skip if sample data shape changed

    const result = auth.login({ identifier: sampleUser.email, password: 'demo' });
    expect(result.ok).toBe(true);
    expect(result.user.username).toBe('jordan_lee');
  });

  it('logs in with the exact DEMO_HASH password', () => {
    const result = auth.login({ identifier: 'jordan_lee', password: 'DEMO_HASH_jordan_lee' });
    expect(result.ok).toBe(true);
  });

  it('rejects unknown username', () => {
    const result = auth.login({ identifier: 'nobody_at_all_xyz', password: 'demo' });
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects wrong password', () => {
    const result = auth.login({ identifier: 'jordan_lee', password: 'wrongpassword' });
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects empty credentials', () => {
    const result = auth.login({ identifier: '', password: '' });
    expect(result.ok).toBe(false);
  });

  it('is case-insensitive for identifier', () => {
    const result = auth.login({ identifier: 'JORDAN_LEE', password: 'demo' });
    expect(result.ok).toBe(true);
  });
});

// ── Session & logout ──────────────────────────────────────────────────────────

describe('auth.currentUser / auth.logout', () => {
  it('currentUser returns null when no session exists', () => {
    localStorage.removeItem('vm_session');
    expect(auth.currentUser()).toBeNull();
  });

  it('currentUser returns the logged-in user after login', () => {
    auth.login({ identifier: 'jordan_lee', password: 'demo' });
    const user = auth.currentUser();
    expect(user).not.toBeNull();
    expect(user.username).toBe('jordan_lee');
  });

  it('logout clears the session', () => {
    auth.login({ identifier: 'jordan_lee', password: 'demo' });
    expect(auth.currentUser()).not.toBeNull();

    auth.logout();
    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('vm_session')).toBeNull();
  });

  it('currentUser returns null when session references a non-existent userId', () => {
    // Write a session with a bogus userId
    localStorage.setItem('vm_session', JSON.stringify({ userId: 'ghost_user_xyz', token: 'x' }));
    expect(auth.currentUser()).toBeNull();
  });
});
