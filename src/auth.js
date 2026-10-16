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
import {
  firebaseAuth,
  registerWithFirebase,
  loginWithFirebase as firebaseSignIn,
  signInWithGoogleFirebase,
  logoutFromFirebase,
  onFirebaseAuthChange,
  saveDocumentToFirestore,
  getDocumentFromFirestore,
} from './firebase.js';

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
 * @param {string} [token]
 */
function writeSession(userId, token) {
  const session = {
    userId,
    token: token || makeDemoToken(userId),
    expiresAt: null,
  };
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
 * Ensure a Firebase-authenticated user exists in the local store and Firestore.
 * @param {object} fbUser - Firebase Auth User object
 * @returns {Promise<object>} Local user object
 */
async function syncFirebaseUserToStore(fbUser) {
  const users = store.get('users') || [];
  const lowerEmail = (fbUser.email || '').toLowerCase();

  let user = users.find(
    u =>
      u.firebaseUid === fbUser.uid ||
      u.id === fbUser.uid ||
      (lowerEmail && u.email?.toLowerCase() === lowerEmail)
  );

  if (!user) {
    // Try fetching from Firestore users collection first
    const remoteUser = await getDocumentFromFirestore('users', fbUser.uid);
    if (remoteUser) {
      user = remoteUser;
    } else {
      const baseUsername = (
        fbUser.email ? fbUser.email.split('@')[0] : `user_${fbUser.uid.slice(0, 6)}`
      )
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 20);

      user = {
        id: fbUser.uid,
        firebaseUid: fbUser.uid,
        username: baseUsername || `user_${Date.now()}`,
        email: lowerEmail,
        passwordHash: `DEMO_HASH_${baseUsername}`,
        displayName: fbUser.displayName || baseUsername || 'Volunteer',
        bio: '',
        avatar: fbUser.photoURL || null,
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
      await saveDocumentToFirestore('users', user.id, user);
    }
    const latestUsers = store.get('users') || [];
    if (!latestUsers.some(u => u.id === user.id)) {
      store.set('users', [...latestUsers, user]);
    }
  } else if (!user.firebaseUid) {
    store.patch('users', user.id, { firebaseUid: fbUser.uid });
  }

  return user;
}

/**
 * auth — Authentication helpers object (supports both synchronous local/demo auth
 * and Firebase Authentication + Firestore profile persistence).
 */
export const auth = {
  /** Reference to the underlying Firebase Auth instance */
  firebaseAuth,

  /**
   * Create a new user account, start a session, and register with Firebase Auth + Firestore.
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
      // Demo-only password storage — stripped before saving to Firestore
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

    // Persist to store (also syncs to Firestore via store.set)
    store.set('users', [...users, newUser]);

    // Start session
    writeSession(newUser.id);

    // Register with Firebase Authentication & save profile in Firestore in background
    registerWithFirebase({
      email: lowerEmail,
      password,
      displayName,
      userProfile: newUser,
    }).then(res => {
      if (res && res.ok && res.uid) {
        store.patch('users', newUser.id, { firebaseUid: res.uid });
      }
    });

    return { ok: true, user: newUser };
  },

  /**
   * Log in with a username or email plus a password.
   * Accepts password === 'demo' as a convenience shortcut for any user.
   * Also accepts the exact hash string (DEMO_HASH_<username>) and syncs with Firebase Auth.
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

    // If logging in with a non-demo password and user has an email, sign in to Firebase Auth
    if (password !== 'demo' && user.email) {
      firebaseSignIn({ email: user.email, password }).catch(() => {});
    }

    return { ok: true, user };
  },

  /**
   * Authenticate via Firebase Authentication (Email/Password) with fallback to local demo auth.
   * Allows users created in Firebase Auth on any device to sign in.
   *
   * @param {{ identifier: string, password: string }} params
   * @returns {Promise<{ ok: true, user: object }|{ ok: false, error: string }>}
   */
  async loginWithFirebase({ identifier, password }) {
    // First check local/demo login (handles 'demo' password and local accounts immediately)
    const localResult = this.login({ identifier, password });
    if (localResult.ok) {
      return localResult;
    }

    if (!identifier || !password) {
      return { ok: false, error: 'Username/email and password are required.' };
    }

    // Resolve identifier to an email if it matches a known username
    const users = store.get('users') || [];
    const lower = identifier.toLowerCase();
    const matchedUser = users.find(
      u => u.username.toLowerCase() === lower || u.email.toLowerCase() === lower
    );
    const emailToTry = matchedUser ? matchedUser.email : identifier;

    if (!emailToTry.includes('@')) {
      return localResult;
    }

    const fbRes = await firebaseSignIn({ email: emailToTry, password });
    if (!fbRes.ok || !fbRes.firebaseUser) {
      return { ok: false, error: 'Invalid username or password.' };
    }

    const syncedUser = await syncFirebaseUserToStore(fbRes.firebaseUser);
    writeSession(syncedUser.id, fbRes.firebaseUser.uid);
    return { ok: true, user: syncedUser };
  },

  /**
   * Sign in with Google using Firebase Authentication and sync profile to Firestore + store.
   *
   * @returns {Promise<{ ok: true, user: object }|{ ok: false, error: string }>}
   */
  async loginWithGoogle() {
    const res = await signInWithGoogleFirebase();
    if (!res.ok || !res.firebaseUser) {
      return { ok: false, error: res.error || 'Google sign-in failed.' };
    }

    const user = await syncFirebaseUserToStore(res.firebaseUser);
    writeSession(user.id, res.firebaseUser.uid);
    return { ok: true, user };
  },

  /**
   * Subscribe to Firebase Auth state changes and keep local session in sync.
   * @returns {Function} Unsubscribe function
   */
  initAuthListener() {
    return onFirebaseAuthChange(async fbUser => {
      if (fbUser) {
        const user = await syncFirebaseUserToStore(fbUser);
        if (!readSession()) {
          writeSession(user.id, fbUser.uid);
        }
      }
    });
  },

  /**
   * End the current session by removing the session record from localStorage
   * and signing out of Firebase Auth.
   */
  logout() {
    localStorage.removeItem(SESSION_KEY);
    logoutFromFirebase();
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
