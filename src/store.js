/**
 * store.js — AppStore singleton for VolunteerMatch.
 *
 * Single source of truth for all application state. Persists to localStorage
 * under the key 'volunteerMatch_v2'. Seeded from sample data on first load.
 *
 * Usage:
 *   import { store } from './store.js'
 *   store.get('users')
 *   store.set('posts', updatedPosts)
 *   store.patch('users', 'u1', { bio: 'New bio' })
 *   const unsub = store.subscribe('posts', fn)
 */

import {
  getSampleUsers,
  getSampleOrgs,
  getSamplePosts,
  getSampleOpportunities,
  getSampleDonations,
  getSampleBloodDonors,
  getSampleBloodRequests,
} from './data.js';
import {
  db,
  saveDocumentToFirestore,
  syncCollectionToFirestore,
  fetchCollectionFromFirestore,
  deleteDocumentFromFirestore,
  subscribeToFirestoreCollection,
} from './firebase.js';

/** localStorage key for the platform store */
const STORE_KEY = 'volunteerMatch_v2';

/** Firestore-backed collection keys */
const FIRESTORE_COLLECTIONS = [
  'users',
  'organisations',
  'posts',
  'opportunities',
  'donationRequests',
  'bloodDonors',
  'bloodRequests',
  'notifications',
];

/**
 * Shape of the initial application state.
 * All collections are arrays; scalars default to null.
 * @returns {object}
 */
function buildInitialState() {
  return {
    users: getSampleUsers(),
    currentUserId: null,
    organisations: getSampleOrgs(),
    posts: getSamplePosts(),
    opportunities: getSampleOpportunities(),
    donationRequests: getSampleDonations(),
    bloodDonors: getSampleBloodDonors(),
    bloodRequests: getSampleBloodRequests(),
    notifications: [],
  };
}

/**
 * Merge remote Firestore documents into a local collection array by `id`.
 * Remote documents override matching local documents, while preserving local-only seed items.
 *
 * @param {Array<object>} localItems
 * @param {Array<object>} remoteItems
 * @returns {Array<object>}
 */
function mergeCollectionsById(localItems = [], remoteItems = []) {
  const map = new Map();
  for (const item of localItems) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const rItem of remoteItems) {
    if (rItem && rItem.id) {
      const existing = map.get(rItem.id) || {};
      map.set(rItem.id, Object.assign({}, existing, rItem));
    }
  }
  return Array.from(map.values());
}

/**
 * AppStore — localStorage + Cloud Firestore reactive state container.
 */
class AppStore {
  constructor() {
    /** @type {object} The in-memory state object */
    this._state = {};

    /**
     * Listeners keyed by state key.
     * @type {Map<string, Set<Function>>}
     */
    this._listeners = new Map();

    /** @type {Array<Function>} Active Firestore snapshot unsubscribers */
    this._firestoreUnsubs = [];

    /** Expose Firestore db instance */
    this.db = db;

    this._load();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Load state from localStorage. Seeds from sample data if nothing is stored
   * or if any expected top-level key is missing.
   * @private
   */
  _load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge parsed state with initial shape so new keys added in later
        // releases are always present.
        const initial = buildInitialState();
        this._state = Object.assign({}, initial, parsed);
      } else {
        this._state = buildInitialState();
        this._save();
      }
    } catch {
      // Corrupt storage — reset to sample data.
      this._state = buildInitialState();
      this._save();
    }
  }

  /**
   * Persist the current in-memory state to localStorage.
   * @private
   */
  _save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(this._state));
  }

  /**
   * Notify all subscribers listening to `key`.
   * @param {string} key
   * @private
   */
  _notify(key) {
    const fns = this._listeners.get(key);
    if (fns) {
      const value = this._state[key];
      fns.forEach(fn => fn(value));
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Read a top-level state key.
   * @param {string} key
   * @returns {*} The stored value, or undefined if the key does not exist.
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Set a top-level state key to a new value, persist to localStorage + Firestore,
   * and notify subscribers.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const prevValue = this._state[key];
    this._state[key] = value;
    this._save();
    this._notify(key);

    // Sync array collections to Cloud Firestore in the background
    if (FIRESTORE_COLLECTIONS.includes(key) && Array.isArray(value)) {
      if (Array.isArray(prevValue)) {
        const newIds = new Set(value.filter(i => i && i.id).map(i => i.id));
        prevValue.forEach(oldItem => {
          if (oldItem && oldItem.id && !newIds.has(oldItem.id)) {
            deleteDocumentFromFirestore(key, oldItem.id);
          }
        });
      }
      syncCollectionToFirestore(key, value);
    }
  }

  /**
   * Partially update an item in an array collection by id.
   * Finds the item where item.id === id, merges delta using Object.assign,
   * then persists (localStorage + Firestore) and notifies subscribers.
   *
   * @param {string} collection - Top-level state key holding an array
   * @param {string} id - The item's id property value
   * @param {object} delta - Properties to merge into the item
   */
  patch(collection, id, delta) {
    const arr = this._state[collection];
    if (!Array.isArray(arr)) return;

    const idx = arr.findIndex(item => item.id === id);
    if (idx === -1) return;

    // Merge — do not mutate original item in place (keeps array ref fresh)
    const updated = Object.assign({}, arr[idx], delta);
    const newArr = [...arr];
    newArr[idx] = updated;

    this._state[collection] = newArr;
    this._save();
    this._notify(collection);

    // Persist updated document to Cloud Firestore
    if (FIRESTORE_COLLECTIONS.includes(collection)) {
      saveDocumentToFirestore(collection, id, updated);
    }
  }

  /**
   * Hydrate in-memory and localStorage state from Cloud Firestore collections,
   * and seed Firestore with initial collections if empty.
   *
   * @returns {Promise<void>}
   */
  async hydrateFromFirestore() {
    for (const colName of FIRESTORE_COLLECTIONS) {
      const remoteDocs = await fetchCollectionFromFirestore(colName);
      if (remoteDocs === null) continue; // Offline or test env

      const localDocs = this._state[colName] || [];
      if (remoteDocs.length > 0) {
        const merged = mergeCollectionsById(localDocs, remoteDocs);
        this._state[colName] = merged;
        this._save();
        this._notify(colName);
      } else if (localDocs.length > 0) {
        // Seed Firestore with initial sample data when the remote collection is empty
        await syncCollectionToFirestore(colName, localDocs);
      }
    }
  }

  /**
   * Subscribe to real-time Cloud Firestore snapshots for all platform collections.
   */
  enableRealtimeSync() {
    this.disableRealtimeSync();
    for (const colName of FIRESTORE_COLLECTIONS) {
      const unsub = subscribeToFirestoreCollection(colName, remoteDocs => {
        if (!Array.isArray(remoteDocs) || remoteDocs.length === 0) return;
        const localDocs = this._state[colName] || [];
        const merged = mergeCollectionsById(localDocs, remoteDocs);
        this._state[colName] = merged;
        this._save();
        this._notify(colName);
      });
      this._firestoreUnsubs.push(unsub);
    }
  }

  /**
   * Unsubscribe from active Firestore snapshot listeners.
   */
  disableRealtimeSync() {
    this._firestoreUnsubs.forEach(unsub => {
      try {
        unsub();
      } catch {
        // Ignore
      }
    });
    this._firestoreUnsubs = [];
  }

  /**
   * Register a listener for changes to a state key.
   * The listener is called immediately with the current value, then on every
   * future mutation.
   *
   * @param {string} key - State key to watch
   * @param {Function} fn - Callback receiving the new value
   * @returns {Function} Unsubscribe function — call it to remove the listener
   */
  subscribe(key, fn) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(fn);

    // Immediately invoke with the current value so the caller can initialise.
    fn(this._state[key]);

    return () => {
      const fns = this._listeners.get(key);
      if (fns) fns.delete(fn);
    };
  }

  /**
   * Reset the store to seed data and clear localStorage.
   * Useful for "Reset Demo" functionality.
   */
  reset() {
    this._state = buildInitialState();
    this._save();
    // Notify all subscribed keys
    this._listeners.forEach((_, key) => this._notify(key));
  }
}

/** Singleton export — the single store instance used across the whole app */
export const store = new AppStore();
