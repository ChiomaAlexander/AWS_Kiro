/**
 * store.test.js — Unit tests for src/store.js AppStore singleton.
 *
 * Uses jsdom (configured in vitest.config.js) so localStorage is available.
 * Each test clears localStorage before running to ensure isolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Isolation helpers ─────────────────────────────────────────────────────────

/**
 * Reset the store module singleton between tests by clearing localStorage
 * and re-importing a fresh instance using dynamic import with a cache-busting
 * query string. Vitest caches ES modules, so we clear the store's persisted
 * state and call reset() instead.
 */
async function freshStore() {
  // Clear persisted state so the new instance seeds from sample data
  localStorage.clear();

  // Re-import — Vitest caches modules, so we get the same instance.
  // Reset it to sample data to simulate a clean load.
  const { store } = await import('../src/store.js');
  store.reset();
  return store;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppStore — get / set', () => {
  it('get returns initial users array seeded from sample data', async () => {
    const store = await freshStore();
    const users = store.get('users');
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it('set replaces a top-level key and persists to localStorage', async () => {
    const store = await freshStore();
    const newUsers = [{ id: 'test1', displayName: 'Test User' }];
    store.set('users', newUsers);

    expect(store.get('users')).toEqual(newUsers);

    // Verify localStorage was updated
    const persisted = JSON.parse(localStorage.getItem('volunteerMatch_v2'));
    expect(persisted.users).toEqual(newUsers);
  });

  it('get returns undefined for an unknown key', async () => {
    const store = await freshStore();
    expect(store.get('nonExistentKey_xyz')).toBeUndefined();
  });
});

describe('AppStore — patch', () => {
  it('merges a delta into an item by id', async () => {
    const store = await freshStore();
    store.set('organisations', [
      { id: 'org1', name: 'Test Org', verificationStatus: 'draft' },
    ]);

    store.patch('organisations', 'org1', { verificationStatus: 'pending' });

    const updated = store.get('organisations').find(o => o.id === 'org1');
    expect(updated.verificationStatus).toBe('pending');
    expect(updated.name).toBe('Test Org'); // other fields preserved
  });

  it('does nothing when the id is not found', async () => {
    const store = await freshStore();
    store.set('organisations', [{ id: 'org1', name: 'Existing' }]);

    // Should not throw
    store.patch('organisations', 'nonexistent', { name: 'Changed' });

    expect(store.get('organisations')[0].name).toBe('Existing');
  });

  it('does nothing when the collection is not an array', async () => {
    const store = await freshStore();
    store.set('currentUserId', 'u1');

    // Should not throw
    store.patch('currentUserId', 'u1', { name: 'Changed' });

    expect(store.get('currentUserId')).toBe('u1');
  });

  it('persists patched data to localStorage', async () => {
    const store = await freshStore();
    store.set('organisations', [{ id: 'org1', verificationStatus: 'draft' }]);
    store.patch('organisations', 'org1', { verificationStatus: 'verified' });

    const persisted = JSON.parse(localStorage.getItem('volunteerMatch_v2'));
    expect(persisted.organisations[0].verificationStatus).toBe('verified');
  });
});

describe('AppStore — subscribe', () => {
  it('calls the listener immediately with the current value', async () => {
    const store = await freshStore();
    store.set('posts', [{ id: 'p1', text: 'Hello' }]);

    let received;
    const unsub = store.subscribe('posts', val => { received = val; });

    expect(received).toEqual([{ id: 'p1', text: 'Hello' }]);
    unsub();
  });

  it('calls the listener on set()', async () => {
    const store = await freshStore();
    const calls = [];
    const unsub = store.subscribe('posts', val => calls.push(val));
    calls.length = 0; // Ignore the immediate call

    store.set('posts', [{ id: 'p2', text: 'Update' }]);
    expect(calls.length).toBe(1);
    expect(calls[0][0].id).toBe('p2');
    unsub();
  });

  it('unsubscribe stops future calls', async () => {
    const store = await freshStore();
    const calls = [];
    const unsub = store.subscribe('posts', val => calls.push(val));
    calls.length = 0;

    unsub();
    store.set('posts', [{ id: 'p99' }]);
    expect(calls.length).toBe(0);
  });
});

describe('AppStore — persist round-trip', () => {
  it('loadState restores data from localStorage on reset()', async () => {
    const store = await freshStore();

    // Manually write known data into localStorage as if a previous session saved it
    const fakeState = {
      users: [{ id: 'u_saved', displayName: 'Saved User', username: 'saved' }],
      organisations: [],
      posts: [],
      opportunities: [],
      donationRequests: [],
      bloodDonors: [],
      bloodRequests: [],
      notifications: [],
      currentUserId: null,
    };
    localStorage.setItem('volunteerMatch_v2', JSON.stringify(fakeState));

    // Reload the store from localStorage (simulate page refresh)
    store._load();

    // The store should have the saved user
    const users = store.get('users');
    expect(users.some(u => u.id === 'u_saved')).toBe(true);
  });

  it('handles corrupt localStorage gracefully by resetting to sample data', async () => {
    const store = await freshStore();
    localStorage.setItem('volunteerMatch_v2', '{corrupt json{{{{');

    store._load(); // Should not throw

    const users = store.get('users');
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });
});

describe('AppStore — reset', () => {
  it('restores sample data and clears mutations', async () => {
    const store = await freshStore();
    store.set('posts', []);
    store.reset();

    const posts = store.get('posts');
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0); // sample data has posts
  });
});
