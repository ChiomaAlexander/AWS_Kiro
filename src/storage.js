/**
 * storage.js — localStorage helpers for VolunteerMatch state persistence.
 */

const KEY = 'volunteerMatch_state';

/**
 * Saves the full application state to localStorage.
 * @param {object} state
 */
export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

/**
 * Loads the saved application state from localStorage.
 * @returns {object|null} Parsed state, or null if nothing is stored.
 */
export function loadState() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Removes the saved state from localStorage.
 */
export function clearState() {
  localStorage.removeItem(KEY);
}
