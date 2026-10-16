/**
 * firebase.test.js — Unit tests for src/firebase.js, Firebase Auth integration, and Firestore store integration.
 */

import { describe, it, expect } from 'vitest';
import {
  app,
  firebaseConfig,
  firebaseAuth,
  db,
  registerWithFirebase,
  loginWithFirebase,
  saveDocumentToFirestore,
  fetchCollectionFromFirestore,
} from '../src/firebase.js';
import { auth } from '../src/auth.js';
import { store } from '../src/store.js';

describe('Firebase configuration & SDK initialization', () => {
  it('initializes Firebase app with the aws-kiro project configuration', () => {
    expect(firebaseConfig.projectId).toBe('aws-kiro');
    expect(firebaseConfig.authDomain).toBe('aws-kiro.firebaseapp.com');
    expect(firebaseConfig.storageBucket).toBe('aws-kiro.firebasestorage.app');
    expect(firebaseConfig.messagingSenderId).toBe('972941614500');
    expect(firebaseConfig.appId).toBe('1:972941614500:web:f429785d45f01de552b531');
    expect(firebaseConfig.measurementId).toBe('G-VDYC5N2TZK');
    expect(app).toBeDefined();
    expect(app.options.projectId).toBe('aws-kiro');
  });

  it('initializes Firebase Authentication and exposes it on auth', () => {
    expect(firebaseAuth).toBeDefined();
    expect(auth.firebaseAuth).toBe(firebaseAuth);
    expect(typeof auth.loginWithFirebase).toBe('function');
    expect(typeof auth.loginWithGoogle).toBe('function');
    expect(typeof auth.initAuthListener).toBe('function');
  });

  it('initializes Cloud Firestore and exposes it on store', () => {
    expect(db).toBeDefined();
    expect(store.db).toBe(db);
    expect(typeof store.hydrateFromFirestore).toBe('function');
    expect(typeof store.enableRealtimeSync).toBe('function');
  });

  it('safely handles Firebase Auth and Firestore helpers in test environment', async () => {
    const regRes = await registerWithFirebase({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test',
    });
    expect(regRes.ok).toBe(true);

    const loginRes = await loginWithFirebase({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(loginRes.ok).toBe(true);

    const saved = await saveDocumentToFirestore('posts', 'p1', { id: 'p1', text: 'hello' });
    expect(typeof saved).toBe('boolean');

    const docs = await fetchCollectionFromFirestore('posts');
    expect(docs).toBeNull();
  });
});
