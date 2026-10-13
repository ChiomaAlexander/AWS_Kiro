/**
 * auth.js — Session-based authentication helpers for VolunteerMatch.
 *
 * Demo-only: passwords are stored as DEMO_HASH_<username> in the user record.
 * The login method accepts either the hash string or the literal string 'demo'
 * so testers can log in without knowing the exact hash.
 *
 * Real deployment should replace this with Firebase Auth — see DECISIONS.md.
 *
 * Session is stored in localStorage under the key 'vm_session' as:
 *   { userId, token, expiresAt: null }
 *
 * The main store (volunteerMatch_v2) is separate.
 *
 * Usage:
 *   import { auth } from './auth.js'
 *   auth.login({ identifier: 'jordan_lee', password: 'demo' })
 *   auth.currentUser()
 *   auth.logout()
 */

import { store } from './store.js';

/** localStorage key for the active session */
const SESSION_KEY = 'vm_session';

/**
 * Generates a simple demo token string (not cryptographically secure).
 * @param {string} userId
 * @returns {string}
 */
function makeDemoToken(userId) {
  return `demo_token_${userId}`;
}

/**
 * Writes a session record to localStorage.
 * @param {string} userId
 */
function writeSession(userId) {
  const session = { userId, token: makeDemoToken(userId), expiresAt: null };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Reads the raw session object from localStorage, or null if absent / corrupt.
 * @returns {{ userId: string, token: string, expiresAt: null }|null}
 */
function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * auth — Authentication helpers object (not a class, not a singleton class;
 * just a plain object with methods that close over imported singletons).
 */
export const auth = {
  /**
   * Create a new user account and start a session.
   *
   * Validates:
   * - username is not already taken
   * - email is not already registered
   * - required fields are present
   *
   * @param {{ username: string, email: string, password: string, displayName: string }} params
   * @returns {{ ok: true, user: object }|{ ok: false, error: string }}
   */
  signup({ username, email, password, displayName }) {
    if (!username || !email || !password || !displayName) {
      return { ok: false, error: 'All fields are required.' };
    }

    const users = store.get('users') || [];

    // Check for duplicate username (case-insensitive)
    const lowerUsername = username.toLowerCase();
    const dupUsername = users.find(
      u => u.username.toLowerCase() === lowerUsername
    );
    if (dupUsername) {
      return { ok: false, error: 'Username is already taken.' };
    }

    // Check for duplicate email (case-insensitive)
    const lowerEmail = email.toLowerCase();
    const dupEmail = users.find(u => u.email.toLowerCase() === lowerEmail);
    if (dupEmail) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    // Build new user object
    const newUser = {
      id: `u_${Date.now()}`,
      username: lowerUsername,
      email: lowerEmail,
      // Demo-only password storage — not for production
      passwordHash: `DEMO_HASH_${lowerUsername}`,
      displayName,
      bio: '',
      avatar: null,
      location: '',
      skills: [],
      languages: [],
      availability: [],
      interests: [],
      role: 'user',
      bloodDonor: false,
      createdAt: new Date().toISOString(),
      onboarded: false,
    };

    // Persist to store
    store.set('users', [...users, newUser]);

    // Start session
    writeSession(newUser.id);

    return { ok: true, user: newUser };
  },

  /**
   * Log in with a username or email plus a password.
   * Accepts password === 'demo' as a convenience shortcut for any user.
   * Also accepts the exact hash string (DEMO_HASH_<username>).
   *
   * @param {{ identifier: string, password: string }} params
   *   identifier may be either a username or an email address
   * @returns {{ ok: true, user: object }|{ ok: false, error: string }}
   */
  login({ identifier, password }) {
    if (!identifier || !password) {
      return { ok: false, error: 'Username/email and password are required.' };
    }

    const users = store.get('users') || [];
    const lower = identifier.toLowerCase();

    // Find by username or email
    const user = users.find(
      u => u.username.toLowerCase() === lower || u.email.toLowerCase() === lower
    );

    if (!user) {
      return { ok: false, error: 'Invalid username or password.' };
    }

    // Accept the literal string 'demo' OR the exact stored hash
    const validPassword =
      password === 'demo' || password === user.passwordHash;

    if (!validPassword) {
      return { ok: false, error: 'Invalid username or password.' };
    }

    // Start session
    writeSession(user.id);

    return { ok: true, user };
  },

  /**
   * End the current session by removing the session record from localStorage.
   */
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  /**
   * Return the currently logged-in user object, or null if no valid session.
   * Reads the session from localStorage, then looks up the user in the store.
   *
   * @returns {object|null}
   */
  currentUser() {
    const session = readSession();
    if (!session || !session.userId) return null;

    const users = store.get('users') || [];
    return users.find(u => u.id === session.userId) || null;
  },

  /**
   * Redirect to /landing if the user is not authenticated.
   * Views call this at the top of their render function to protect routes.
   * Imports router lazily to avoid a circular dependency at module parse time.
   */
  requireAuth() {
    if (!auth.currentUser()) {
      // Lazy import to avoid circular dependency: auth → router → auth
      import('./router.js').then(({ router }) => {
        router.navigate('/landing');
      });
    }
  },
};
