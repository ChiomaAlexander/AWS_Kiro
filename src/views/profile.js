/**
 * profile.js — User profile view (view mode, edit mode, and onboarding flow).
 *
 * Route: #/profile/:username
 * Optional query: ?onboarding=true  → show simplified onboarding card first.
 *
 * - 'me' as username resolves to the logged-in user's username.
 * - Viewing own profile shows an "Edit Profile" button.
 * - Editing is inline (no separate route).
 * - Onboarding card is shown after fresh sign-up.
 *
 * @module views/profile
 */

import { store } from '../store.js';
import { auth }  from '../auth.js';
import { router } from '../router.js';
import { el, badge, avatar, emptyState, errorState } from '../ui.js';
import { SKILLS } from '../data.js';
import { showToast } from '../components/toast.js';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse a query string from the current hash URL.
 * @returns {URLSearchParams}
 */
function hashQuery() {
  const hash = window.location.hash || '';
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(qIdx + 1));
}

/**
 * Render a comma-separated list of text badges into a container div.
 * Returns the container element.
 *
 * @param {string[]} items
 * @param {string}   badgeType
 * @returns {HTMLElement}
 */
function badgeList(items, badgeType) {
  if (!items || items.length === 0) {
    return el('span', { class: 'vm-text-muted' }, '—');
  }
  const wrap = el('div', { class: 'vm-badge-row' });
  items.forEach(item => wrap.appendChild(badge(item, badgeType)));
  return wrap;
}

/**
 * Build a labelled profile field row.
 *
 * @param {string}      label
 * @param {HTMLElement|string} content
 * @returns {HTMLElement}
 */
function profileField(label, content) {
  const labelEl = el('dt', { class: 'vm-profile__label' }, label);
  const valueEl = el('dd', { class: 'vm-profile__value' });
  if (typeof content === 'string') {
    valueEl.textContent = content || '—';
  } else {
    valueEl.appendChild(content);
  }
  return el('div', { class: 'vm-profile__field' }, labelEl, valueEl);
}

// ── View mode ──────────────────────────────────────────────────────────────

/**
 * Render the read-only profile view.
 *
 * @param {HTMLElement} container
 * @param {object}      user         - User record from the store
 * @param {boolean}     isOwnProfile - Whether the viewer owns this profile
 * @param {Function}    onEdit       - Called when "Edit Profile" is clicked
 */
function renderViewMode(container, user, isOwnProfile, onEdit) {
  container.innerHTML = '';

  const posts  = store.get('posts') || [];
  const myPostCount = posts.filter(p => p.authorId === user.id).length;

  // Avatar + header
  const avatarEl = avatar(user);
  avatarEl.classList.add('vm-avatar--lg');

  const headerInfo = el('div', { class: 'vm-profile__header-info' },
    el('h1', { class: 'vm-profile__name' },  user.displayName || user.username),
    el('p',  { class: 'vm-profile__handle' }, `@${user.username}`),
    user.location ? el('p', { class: 'vm-profile__location' }, `📍 ${user.location}`) : null,
  );

  const editBtn = isOwnProfile
    ? el('button', {
        class: 'btn btn-secondary vm-profile__edit-btn',
        'aria-label': 'Edit your profile',
        onClick: onEdit,
      }, '✏️ Edit Profile')
    : null;

  const header = el('div', { class: 'vm-profile__header' },
    avatarEl,
    headerInfo,
    editBtn,
  );

  // Bio
  const bio = el('p', { class: 'vm-profile__bio' }, user.bio || 'No bio yet.');

  // Stats
  const statsBar = el('div', { class: 'vm-profile__stats' },
    el('span', { class: 'vm-profile__stat' }, `${myPostCount} post${myPostCount !== 1 ? 's' : ''}`),
    el('span', { class: 'vm-profile__stat' }, `${(user.skills || []).length} skill${(user.skills || []).length !== 1 ? 's' : ''}`),
    user.bloodDonor ? el('span', { class: 'vm-profile__stat vm-profile__stat--blood' }, '🩸 Blood Donor') : null,
  );

  // Details section
  const details = el('dl', { class: 'vm-profile__details' },
    profileField('Skills',       badgeList(user.skills,    'skill')),
    profileField('Languages',    badgeList(user.languages, 'lang')),
    profileField('Interests',    badgeList(user.interests, 'interest')),
    profileField('Availability', badgeList(
      Array.isArray(user.availability)
        ? user.availability.map(a => (typeof a === 'string' ? a : a.label))
        : [],
      'avail'
    )),
  );

  const profileCard = el('div', { class: 'vm-card vm-profile__card' },
    header,
    bio,
    statsBar,
    details,
  );

  container.appendChild(profileCard);
}

// ── Edit mode ──────────────────────────────────────────────────────────────

/**
 * Render the inline edit form for the current user's profile.
 *
 * @param {HTMLElement} container
 * @param {object}      user     - Current user record
 * @param {Function}    onCancel - Called when user cancels
 * @param {Function}    onSaved  - Called after a successful save
 */
function renderEditMode(container, user, onCancel, onSaved) {
  container.innerHTML = '';

  // ── Field helper ────────────────────────────────────────────────────────
  function textField(id, labelText, value, type = 'text') {
    const label = el('label', { for: id }, labelText);
    const input = el('input', { type, id, class: 'vm-input', value: value || '' });
    return { group: el('div', { class: 'form-group' }, label, input), input };
  }

  function textareaField(id, labelText, value) {
    const label = el('label', { for: id }, labelText);
    const ta    = el('textarea', { id, class: 'vm-input', rows: '3', 'aria-label': labelText });
    ta.value = value || '';
    return { group: el('div', { class: 'form-group' }, label, ta), input: ta };
  }

  const nameF  = textField('ep-name',     'Display Name',  user.displayName);
  const locF   = textField('ep-location', 'Location',      user.location);
  const bioF   = textareaField('ep-bio',  'Bio',           user.bio);
  const langF  = textField('ep-langs',    'Languages (comma-separated)', (user.languages || []).join(', '));
  const intF   = textField('ep-ints',     'Interests (comma-separated)', (user.interests || []).join(', '));
  const availF = textField('ep-avail',    'Availability (comma-separated)', (user.availability || [])
    .map(a => typeof a === 'string' ? a : a.label).join(', '));

  // Skills checkboxes
  const skillsLabel = el('fieldset', { class: 'vm-profile__skills-fs' },
    el('legend', {}, 'Skills'),
  );
  const skillsGrid  = el('div', { class: 'skills-grid' });

  SKILLS.forEach(skill => {
    const checked = (user.skills || []).includes(skill);
    const cb = el('input', {
      type: 'checkbox',
      id: `ep-skill-${skill}`,
      name: 'ep-skills',
      value: skill,
      checked,
      'aria-label': skill,
    });
    const lbl = el('label', { for: `ep-skill-${skill}` }, el('span', {}, ` ${skill}`));
    lbl.prepend(cb);
    skillsGrid.appendChild(lbl);
  });
  skillsLabel.appendChild(skillsGrid);

  // Blood donor toggle
  const bdCb = el('input', {
    type: 'checkbox',
    id: 'ep-blood-donor',
    checked: user.bloodDonor || false,
    'aria-describedby': 'ep-blood-hint',
  });
  const bdLabel = el('label', { for: 'ep-blood-donor', class: 'vm-profile__bd-label' },
    bdCb, ' I am a blood donor'
  );
  const bdHint = el('p', { id: 'ep-blood-hint', class: 'vm-text-muted vm-text-small' },
    'Opting in makes you discoverable to blood-donation requests.'
  );
  const bdGroup = el('div', { class: 'form-group' }, bdLabel, bdHint);

  // Buttons
  const saveBtn = el('button', {
    type: 'button',
    class: 'btn btn-primary',
    'aria-label': 'Save profile changes',
  }, 'Save Profile');

  const cancelBtn = el('button', {
    type: 'button',
    class: 'btn btn-secondary',
    style: 'margin-left:0.5rem;',
    'aria-label': 'Cancel editing',
  }, 'Cancel');

  const btnRow = el('div', { class: 'vm-profile__btn-row' }, saveBtn, cancelBtn);

  // Save handler
  saveBtn.addEventListener('click', () => {
    const selectedSkills = Array.from(
      skillsGrid.querySelectorAll('input[name="ep-skills"]:checked')
    ).map(cb => cb.value);

    const langVal  = langF.input.value.trim();
    const intVal   = intF.input.value.trim();
    const availVal = availF.input.value.trim();

    const delta = {
      displayName: nameF.input.value.trim() || user.displayName,
      location:    locF.input.value.trim(),
      bio:         bioF.input.value.trim(),
      skills:      selectedSkills,
      languages:   langVal  ? langVal.split(',').map(s => s.trim()).filter(Boolean)  : [],
      interests:   intVal   ? intVal.split(',').map(s => s.trim()).filter(Boolean)   : [],
      availability: availVal ? availVal.split(',').map(s => s.trim()).filter(Boolean) : [],
      bloodDonor:  bdCb.checked,
      onboarded:   true,
    };

    store.patch('users', user.id, delta);
    showToast('Profile updated ✓', 'success');
    onSaved();
  });

  cancelBtn.addEventListener('click', onCancel);

  const editCard = el('div', { class: 'vm-card vm-profile__card' },
    el('h2', { class: 'vm-profile__edit-heading' }, 'Edit Profile'),
    nameF.group,
    locF.group,
    bioF.group,
    skillsLabel,
    langF.group,
    intF.group,
    availF.group,
    bdGroup,
    btnRow,
  );

  container.appendChild(editCard);
}

// ── Onboarding flow ────────────────────────────────────────────────────────

/**
 * Render the simplified onboarding card shown after sign-up.
 *
 * @param {HTMLElement} container
 * @param {object}      user
 * @param {Function}    onComplete - Called after "Complete Setup" is clicked
 */
function renderOnboarding(container, user, onComplete) {
  container.innerHTML = '';

  const bioLabel = el('label', { for: 'ob-bio' }, 'Short Bio');
  const bioInput = el('textarea', { id: 'ob-bio', class: 'vm-input', rows: '3', 'aria-label': 'Short bio' });
  bioInput.value = user.bio || '';

  const availLabel = el('label', { for: 'ob-avail' }, 'Availability (comma-separated, e.g. Weekends, Evenings)');
  const availInput = el('input', { type: 'text', id: 'ob-avail', class: 'vm-input', placeholder: 'Weekends, Evenings' });

  // Skills checkboxes
  const skillsLegend = el('fieldset', { class: 'vm-profile__skills-fs' },
    el('legend', {}, 'Skills — select what you can offer'),
  );
  const skillsGrid = el('div', { class: 'skills-grid' });
  SKILLS.forEach(skill => {
    const cb  = el('input', { type: 'checkbox', id: `ob-skill-${skill}`, name: 'ob-skills', value: skill, 'aria-label': skill });
    const lbl = el('label', { for: `ob-skill-${skill}` }, el('span', {}, ` ${skill}`));
    lbl.prepend(cb);
    skillsGrid.appendChild(lbl);
  });
  skillsLegend.appendChild(skillsGrid);

  const completeBtn = el('button', {
    type: 'button',
    class: 'btn btn-primary',
    style: 'width:100%;margin-top:1rem;',
    'aria-label': 'Complete profile setup',
  }, 'Complete Setup →');

  completeBtn.addEventListener('click', () => {
    const selectedSkills = Array.from(
      skillsGrid.querySelectorAll('input[name="ob-skills"]:checked')
    ).map(cb => cb.value);

    const availVal = availInput.value.trim();

    store.patch('users', user.id, {
      bio:         bioInput.value.trim(),
      skills:      selectedSkills,
      availability: availVal ? availVal.split(',').map(s => s.trim()).filter(Boolean) : [],
      onboarded:   true,
    });

    showToast('Welcome to VolunteerMatch! 🎉', 'success');
    onComplete();
  });

  const skipLink = el('p', { class: 'vm-auth__back', style: 'margin-top:0.75rem;text-align:center;' },
    el('a', {
      href: '#/feed',
      'aria-label': 'Skip onboarding and go to feed',
    }, 'Skip for now →')
  );

  const card = el('div', { class: 'vm-card vm-profile__card' },
    el('h2', { class: 'vm-profile__edit-heading' }, `Welcome, ${user.displayName || user.username}! 👋`),
    el('p', { class: 'vm-text-muted' }, 'Tell us a bit about yourself to get started.'),
    el('div', { class: 'form-group' }, bioLabel, bioInput),
    skillsLegend,
    el('div', { class: 'form-group' }, availLabel, availInput),
    completeBtn,
    skipLink,
  );

  container.appendChild(card);
}

// ── Main render ────────────────────────────────────────────────────────────

/**
 * Render the profile view.
 *
 * @param {HTMLElement} container - The #view-root element
 * @param {{ username: string }} params - Route params
 * @returns {Function} Cleanup function
 */
export default async function renderProfile(container, params) {
  auth.requireAuth();

  const currentUser = auth.currentUser();
  const users = store.get('users') || [];

  // 'me' resolves to the logged-in user's username
  const cleanUsername = (params.username || '').split('?')[0];
  const username = cleanUsername === 'me'
    ? currentUser?.username
    : cleanUsername;

  let user = users.find(u => u.username === username);

  container.innerHTML = '';

  if (!user) {
    container.appendChild(errorState('Profile not found.'));
    return () => {};
  }

  const isOwnProfile = Boolean(currentUser && currentUser.id === user.id);
  const isOnboarding = isOwnProfile && hashQuery().get('onboarding') === 'true' && !user.onboarded;

  // ── Mode tracking ────────────────────────────────────────────────────────
  let mode = isOnboarding ? 'onboarding' : 'view';

  function getUser() {
    // Re-read from store to pick up patches
    return (store.get('users') || []).find(u => u.id === user.id) || user;
  }

  function showView() {
    mode = 'view';
    renderViewMode(container, getUser(), isOwnProfile, showEdit);
  }

  function showEdit() {
    mode = 'edit';
    renderEditMode(container, getUser(), showView, showView);
  }

  function showOnboarding() {
    renderOnboarding(container, getUser(), () => router.navigate('/feed'));
  }

  // Initial render
  if (mode === 'onboarding') {
    showOnboarding();
  } else {
    showView();
  }

  return function cleanup() {};
}
