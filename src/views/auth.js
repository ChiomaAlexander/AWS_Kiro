/**
 * auth.js — Login / Sign-up view.
 *
 * Renders a two-tab form: Log In and Sign Up.
 * The active tab is determined by the ?mode= query param in the hash
 * (default: 'login').
 *
 * Sign-up fields: displayName, username, email, password, confirmPassword.
 * Login fields: identifier (username or email), password.
 *
 * Validation errors are shown inline with role="alert" and aria-describedby.
 *
 * @module views/auth
 */

import { auth } from '../auth.js';
import { router } from '../router.js';
import { el } from '../ui.js';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse a query string out of the current window.location.hash.
 * e.g. #/auth?mode=signup  →  { mode: 'signup' }
 *
 * @returns {URLSearchParams}
 */
function hashQuery() {
  const hash = window.location.hash || '';
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(qIdx + 1));
}

/**
 * Show or hide an inline error message and associate it with an input.
 *
 * @param {HTMLElement} msgEl - The element with role="alert"
 * @param {string}      msg   - Error text (empty string clears the error)
 */
function setError(msgEl, msg) {
  msgEl.textContent = msg;
  msgEl.style.display = msg ? 'block' : 'none';
}

/**
 * Render the login form section.
 *
 * @param {HTMLElement} formWrap - Container for form fields
 * @param {HTMLElement} submitBtn
 * @param {HTMLElement} globalErrorEl
 */
function buildLoginForm(formWrap, submitBtn, globalErrorEl) {
  formWrap.innerHTML = '';

  // Identifier
  const idLabel = el('label', { for: 'auth-identifier' }, 'Username or Email');
  const idInput = el('input', {
    type: 'text',
    id: 'auth-identifier',
    class: 'vm-input',
    placeholder: 'username or email',
    autocomplete: 'username',
    required: true,
    'aria-describedby': 'err-identifier',
  });
  const idErr = el('p', {
    id: 'err-identifier',
    class: 'error-message',
    role: 'alert',
    style: 'display:none',
  });

  // Password
  const pwLabel = el('label', { for: 'auth-password' }, 'Password');
  const pwInput = el('input', {
    type: 'password',
    id: 'auth-password',
    class: 'vm-input',
    placeholder: 'password',
    autocomplete: 'current-password',
    required: true,
    'aria-describedby': 'err-password-login',
  });
  const pwErr = el('p', {
    id: 'err-password-login',
    class: 'error-message',
    role: 'alert',
    style: 'display:none',
  });

  formWrap.appendChild(el('div', { class: 'form-group' }, idLabel, idInput, idErr));
  formWrap.appendChild(el('div', { class: 'form-group' }, pwLabel, pwInput, pwErr));

  // Hint & quick demo logins
  const hint = el('p', { class: 'vm-auth__hint' },
    'Demo: use any username with password ', el('code', {}, 'demo')
  );
  formWrap.appendChild(hint);

  const demoAccounts = [
    { label: 'Admin', user: 'admin' },
    { label: 'Volunteer (Jordan)', user: 'jordan_lee' },
    { label: 'Org Rep (Amaka)', user: 'amaka_obi' },
  ];
  const quickFillRow = el('div', { class: 'vm-auth__quick-fill', style: 'display:flex;gap:0.4rem;flex-wrap:wrap;margin:0.5rem 0 0.75rem;' },
    el('span', { class: 'vm-text-muted vm-text-small', style: 'width:100%;font-size:0.8rem;' }, 'Quick Demo Logins:'),
    ...demoAccounts.map(acc => el('button', {
      type: 'button',
      class: 'btn btn-secondary',
      style: 'font-size:0.75rem;padding:0.3rem 0.6rem;cursor:pointer;',
      'aria-label': `Quick login as ${acc.label}`,
      onClick: () => {
        idInput.value = acc.user;
        pwInput.value = 'demo';
        if (submitBtn.onclick) submitBtn.onclick();
      }
    }, `⚡ ${acc.label}`))
  );
  formWrap.appendChild(quickFillRow);

  const googleBtn = el('button', {
    type: 'button',
    class: 'btn btn-secondary',
    style: 'width:100%;margin-bottom:0.5rem;',
    'aria-label': 'Continue with Google via Firebase Auth',
    onClick: async () => {
      setError(globalErrorEl, '');
      const res = await auth.loginWithGoogle();
      if (res.ok) {
        router.navigate('/feed');
      } else {
        setError(globalErrorEl, res.error || 'Google sign-in failed.');
      }
    },
  }, '🔐 Continue with Google');
  formWrap.appendChild(googleBtn);

  // Submit handler
  submitBtn.textContent = 'Log In';
  submitBtn.onclick = () => {
    setError(globalErrorEl, '');
    setError(idErr, '');
    setError(pwErr, '');

    const identifier = idInput.value.trim();
    const password   = pwInput.value;
    let valid = true;

    if (!identifier) { setError(idErr, 'Username or email is required.'); valid = false; }
    if (!password)   { setError(pwErr, 'Password is required.'); valid = false; }
    if (!valid) return;

    const result = auth.login({ identifier, password });
    if (result.ok) {
      router.navigate('/feed');
    } else if (identifier.includes('@') && password !== 'demo') {
      auth.loginWithFirebase({ identifier, password }).then(fbResult => {
        if (fbResult.ok) {
          router.navigate('/feed');
        } else {
          setError(globalErrorEl, fbResult.error || result.error);
        }
      });
    } else {
      setError(globalErrorEl, result.error);
    }
  };
}

/**
 * Render the sign-up form section.
 *
 * @param {HTMLElement} formWrap
 * @param {HTMLElement} submitBtn
 * @param {HTMLElement} globalErrorEl
 */
function buildSignupForm(formWrap, submitBtn, globalErrorEl) {
  formWrap.innerHTML = '';

  // ── Field factory helper ────────────────────────────────────────────────
  function field(id, labelText, inputAttrs, errId) {
    const label  = el('label', { for: id }, labelText);
    const input  = el('input', Object.assign({ id, class: 'vm-input', 'aria-describedby': errId }, inputAttrs));
    const errEl  = el('p', { id: errId, class: 'error-message', role: 'alert', style: 'display:none' });
    return { group: el('div', { class: 'form-group' }, label, input, errEl), input, errEl };
  }

  const nameF = field('su-name',     'Display Name',      { type: 'text',     placeholder: 'Your full name',      required: true, autocomplete: 'name' },             'err-su-name');
  const userF = field('su-username', 'Username',          { type: 'text',     placeholder: 'e.g. jordan_lee',     required: true, autocomplete: 'username',
                                                             maxlength: '20', pattern: '[a-zA-Z0-9_]+' },                                                              'err-su-username');
  const mailF = field('su-email',    'Email',             { type: 'email',    placeholder: 'you@example.com',     required: true, autocomplete: 'email' },             'err-su-email');
  const pw1F  = field('su-pw',       'Password',          { type: 'password', placeholder: 'min 8 characters',   required: true, autocomplete: 'new-password' },       'err-su-pw');
  const pw2F  = field('su-pw2',      'Confirm Password',  { type: 'password', placeholder: 'repeat password',    required: true, autocomplete: 'new-password' },       'err-su-pw2');

  formWrap.appendChild(nameF.group);
  formWrap.appendChild(userF.group);
  formWrap.appendChild(mailF.group);
  formWrap.appendChild(pw1F.group);
  formWrap.appendChild(pw2F.group);

  const demoAccounts = [
    { label: 'Admin', user: 'admin' },
    { label: 'Volunteer (Jordan)', user: 'jordan_lee' },
    { label: 'Org Rep (Amaka)', user: 'amaka_obi' },
  ];
  const quickFillRow = el('div', { class: 'vm-auth__quick-fill', style: 'display:flex;gap:0.4rem;flex-wrap:wrap;margin:0.5rem 0 0.75rem;' },
    el('span', { class: 'vm-text-muted vm-text-small', style: 'width:100%;font-size:0.8rem;' }, 'Or instant demo login:'),
    ...demoAccounts.map(acc => el('button', {
      type: 'button',
      class: 'btn btn-secondary',
      style: 'font-size:0.75rem;padding:0.3rem 0.6rem;cursor:pointer;',
      'aria-label': `Quick login as ${acc.label}`,
      onClick: () => {
        auth.login({ identifier: acc.user, password: 'demo' });
        router.navigate('/feed');
      }
    }, `⚡ ${acc.label}`))
  );
  formWrap.appendChild(quickFillRow);

  // Submit handler
  submitBtn.textContent = 'Create Account';
  submitBtn.onclick = () => {
    setError(globalErrorEl, '');
    [nameF, userF, mailF, pw1F, pw2F].forEach(f => setError(f.errEl, ''));

    const displayName = nameF.input.value.trim();
    const username    = userF.input.value.trim();
    const email       = mailF.input.value.trim();
    const password    = pw1F.input.value;
    const confirm     = pw2F.input.value;
    let valid = true;

    if (!displayName) { setError(nameF.errEl, 'Display name is required.'); valid = false; }

    if (!username) {
      setError(userF.errEl, 'Username is required.'); valid = false;
    } else if (!/^[a-zA-Z0-9_]{1,20}$/.test(username)) {
      setError(userF.errEl, 'Username: 1–20 characters, letters, numbers or underscore.'); valid = false;
    }

    if (!email) {
      setError(mailF.errEl, 'Email is required.'); valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(mailF.errEl, 'Enter a valid email address.'); valid = false;
    }

    if (!password) {
      setError(pw1F.errEl, 'Password is required.'); valid = false;
    } else if (password.length < 8) {
      setError(pw1F.errEl, 'Password must be at least 8 characters.'); valid = false;
    }

    if (!confirm) {
      setError(pw2F.errEl, 'Please confirm your password.'); valid = false;
    } else if (password && confirm !== password) {
      setError(pw2F.errEl, 'Passwords do not match.'); valid = false;
    }

    if (!valid) return;

    const result = auth.signup({ username, email, password, displayName });
    if (result.ok) {
      router.navigate(`/profile/${result.user.username}?onboarding=true`);
    } else {
      // Map errors back to the right field if recognisable
      const errMsg = result.error || 'Sign-up failed.';
      if (errMsg.toLowerCase().includes('username')) {
        setError(userF.errEl, errMsg);
      } else if (errMsg.toLowerCase().includes('email')) {
        setError(mailF.errEl, errMsg);
      } else {
        setError(globalErrorEl, errMsg);
      }
    }
  };
}

// ── Main render ────────────────────────────────────────────────────────────

/**
 * Render the auth view (login + signup tabs).
 *
 * @param {HTMLElement} container - The #view-root element
 * @param {object} _params - Route params (unused; we read ?mode= from the hash)
 * @returns {Function} Cleanup function
 */
export default async function renderAuth(container, _params) {
  container.innerHTML = '';

  // Determine initial mode from query param
  let mode = hashQuery().get('mode') || 'login';
  if (mode !== 'signup') mode = 'login';

  // ── Shell ──────────────────────────────────────────────────────────────
  const globalError = el('div', {
    id: 'auth-global-error',
    class: 'error-message',
    role: 'alert',
    style: 'display:none;margin-bottom:0.75rem;',
  });

  const formWrap = el('div', { class: 'vm-auth__fields' });

  const submitBtn = el('button', {
    type: 'button',
    class: 'btn btn-primary',
    style: 'width:100%;margin-top:0.5rem;',
    'aria-label': 'Submit form',
  });

  // Tab buttons
  const loginTab  = el('button', {
    type: 'button',
    class: 'vm-auth__tab',
    id: 'tab-login',
    role: 'tab',
    'aria-selected': mode === 'login' ? 'true' : 'false',
    'aria-controls': 'auth-panel',
    'aria-label': 'Log in tab',
  }, 'Log In');

  const signupTab = el('button', {
    type: 'button',
    class: 'vm-auth__tab',
    id: 'tab-signup',
    role: 'tab',
    'aria-selected': mode === 'signup' ? 'true' : 'false',
    'aria-controls': 'auth-panel',
    'aria-label': 'Sign up tab',
  }, 'Sign Up');

  const tabRow = el('div', {
    class: 'vm-auth__tabs',
    role: 'tablist',
    'aria-label': 'Authentication options',
  }, loginTab, signupTab);

  const panel = el('div', {
    id: 'auth-panel',
    class: 'vm-auth__panel',
    role: 'tabpanel',
    'aria-labelledby': mode === 'login' ? 'tab-login' : 'tab-signup',
  }, globalError, formWrap, submitBtn);

  const backLink = el('p', { class: 'vm-auth__back' },
    el('a', {
      href: '#/landing',
      'aria-label': 'Back to home page',
    }, '← Back to Home')
  );

  const authCard = el('div', { class: 'vm-card vm-auth__card' },
    el('h2', { class: 'vm-auth__heading' }, 'VolunteerMatch'),
    tabRow,
    panel,
    backLink,
  );

  const wrapper = el('div', { class: 'vm-auth__wrapper' }, authCard);
  container.appendChild(wrapper);

  // ── Switch mode logic ──────────────────────────────────────────────────
  function switchMode(newMode) {
    mode = newMode;
    loginTab.setAttribute('aria-selected', newMode === 'login' ? 'true' : 'false');
    signupTab.setAttribute('aria-selected', newMode === 'signup' ? 'true' : 'false');
    loginTab.classList.toggle('active', newMode === 'login');
    signupTab.classList.toggle('active', newMode === 'signup');
    panel.setAttribute('aria-labelledby', newMode === 'login' ? 'tab-login' : 'tab-signup');
    setError(globalError, '');

    if (newMode === 'login') {
      buildLoginForm(formWrap, submitBtn, globalError);
    } else {
      buildSignupForm(formWrap, submitBtn, globalError);
    }
  }

  // Wire tabs
  loginTab.addEventListener('click', () => switchMode('login'));
  signupTab.addEventListener('click', () => switchMode('signup'));

  // Allow Enter key to submit
  const keyHandler = (e) => {
    if (e.key === 'Enter' && submitBtn.onclick) submitBtn.onclick();
  };
  container.addEventListener('keydown', keyHandler);

  // Initial render
  switchMode(mode);

  // Listen for hash changes (user pastes a link with ?mode=signup)
  function onHashChange() {
    const newMode = hashQuery().get('mode') || 'login';
    if (newMode !== mode) switchMode(newMode === 'signup' ? 'signup' : 'login');
  }
  window.addEventListener('hashchange', onHashChange);

  return function cleanup() {
    container.removeEventListener('keydown', keyHandler);
    window.removeEventListener('hashchange', onHashChange);
  };
}
