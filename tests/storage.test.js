import { describe, it, expect, beforeEach } from 'vitest';
import { saveState, loadState, clearState } from '../src/storage.js';

beforeEach(() => {
  clearState();
});

describe('storage', () => {
  it('saveState + loadState round-trip', () => {
    const data = { volunteers: [{ id: 'v1' }], tasks: [] };
    saveState(data);
    const loaded = loadState();
    expect(loaded).toEqual(data);
  });

  it('clearState removes item', () => {
    saveState({ test: true });
    clearState();
    expect(loadState()).toBeNull();
  });

  it('loadState returns null when nothing stored', () => {
    expect(loadState()).toBeNull();
  });
});
