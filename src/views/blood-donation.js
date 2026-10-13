/**
 * blood-donation.js — Blood Donation coordination view.
 *
 * Three sections:
 *   1. Become a Donor — opt-in form / profile editor for current user
 *   2. Open Requests  — browse active requests with compatibility filter
 *   3. Submit Request — form to post a new blood request
 *
 * SAFETY REQUIREMENTS (enforced on every render):
 *  - Medical disclaimer banner is always visible.
 *  - Donor contact details are never exposed; only "I Can Help" in-app notes.
 *  - A clear label marks matched/fulfilled requests so users don't contact them.
 *
 * @module views/blood-donation
 */

import { store }      from '../store.js';
import { auth }       from '../auth.js';
import { el, badge, emptyState, statusBadge } from '../ui.js';
import { showToast }  from '../components/toast.js';

// ── Blood group data ──────────────────────────────────────────────────────────

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Very simplified compatibility table for display purposes only.
 * Key = required blood group, value = blood groups that can donate.
 * Real medical compatibility is far more nuanced — this is for UI hints only.
 *
 * @type {Record<string, string[]>}
 */
const CAN_DONATE_TO = {
  'O-' : ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+' : ['O+', 'A+', 'B+', 'AB+'],
  'A-' : ['A-', 'A+', 'AB-', 'AB+'],
  'A+' : ['A+', 'AB+'],
  'B-' : ['B-', 'B+', 'AB-', 'AB+'],
  'B+' : ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

/** Urgency badge colours */
const URGENCY_COLOURS = {
  routine  : 'muted',
  urgent   : 'warning',
  critical : 'danger',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Check compatibility between a donor's blood group and a required group.
 * Returns 'compatible' | 'incompatible' | 'unknown'
 *
 * @param {string|null|undefined} donorGroup
 * @param {string|null|undefined} requiredGroup
 * @returns {'compatible'|'incompatible'|'unknown'}
 */
function checkCompatibility(donorGroup, requiredGroup) {
  if (!donorGroup || !requiredGroup) return 'unknown';
  const canDonateTo = CAN_DONATE_TO[donorGroup] || [];
  return canDonateTo.includes(requiredGroup) ? 'compatible' : 'incompatible';
}

/**
 * Get user's display name from the store.
 * @param {string} userId
 * @returns {string}
 */
function userName(userId) {
  const users = store.get('users') || [];
  const u = users.find(u => u.id === userId);
  return u ? u.displayName : 'Unknown User';
}

// ── Medical disclaimer ────────────────────────────────────────────────────────

/**
 * Build the required medical disclaimer element.
 * Must appear on every render of this view.
 * @returns {HTMLElement}
 */
function buildDisclaimer() {
  return el('div', {
    class: 'vm-blood-disclaimer',
    role: 'note',
    'aria-label': 'Medical disclaimer',
  },
    el('span', { class: 'vm-blood-disclaimer-icon', 'aria-hidden': 'true' }, '⚕️'),
    el('div', null,
      el('strong', null, 'Medical Disclaimer: '),
      'This tool facilitates connections only. It does not replace professional medical advice, ',
      'certified blood bank services, or hospital staff. For urgent needs, ',
      el('strong', null, 'contact your nearest hospital or blood bank immediately. '),
      'Any match shown here must be confirmed by qualified healthcare professionals before donation.'
    )
  );
}

// ── Donor section ─────────────────────────────────────────────────────────────

/**
 * Build the "Become a Donor" / "My Donor Profile" section.
 *
 * @param {object} currentUser
 * @param {Function} onUpdate
 * @returns {HTMLElement}
 */
function buildDonorSection(currentUser, onUpdate) {
  const donors = store.get('bloodDonors') || [];
  const myProfile = donors.find(d => d.userId === currentUser.id);

  const wrap = el('div', { class: 'vm-card vm-blood-section' });
  wrap.appendChild(el('h2', { class: 'vm-blood-section-title' },
    myProfile ? '🩸 My Donor Profile' : '🩸 Become a Blood Donor'
  ));

  if (myProfile) {
    // Show current profile with edit / pause
    const statusLine = el('p', { class: myProfile.active ? 'vm-blood-donor-active' : 'vm-blood-donor-paused' },
      myProfile.active ? '✅ Active donor' : '⏸ Participation paused'
    );

    const details = el('ul', { class: 'vm-blood-donor-details' },
      el('li', null, `Blood group: ${myProfile.bloodGroup || 'Not specified'}`),
      el('li', null, `Location: ${myProfile.location || 'Not specified'}`),
      el('li', null, `Last updated: ${myProfile.lastUpdated || '—'}`)
    );

    const toggleBtn = el('button', {
      class: `btn ${myProfile.active ? 'btn-secondary' : 'btn-primary'}`,
      'aria-label': myProfile.active ? 'Pause blood donor participation' : 'Resume blood donor participation',
      onClick: () => {
        const updated = donors.map(d =>
          d.userId === currentUser.id ? { ...d, active: !d.active, lastUpdated: new Date().toISOString().slice(0,10) } : d
        );
        store.set('bloodDonors', updated);
        showToast(myProfile.active ? 'Donor participation paused.' : 'Donor participation resumed!', 'info');
        onUpdate();
      },
    }, myProfile.active ? '⏸ Pause Participation' : '▶ Resume Participation');

    const withdrawBtn = el('button', {
      class: 'btn btn-danger vm-blood-withdraw-btn',
      'aria-label': 'Withdraw from blood donor programme',
      onClick: () => {
        if (!confirm('Remove yourself from the donor registry? You can re-enroll at any time.')) return;
        store.set('bloodDonors', donors.filter(d => d.userId !== currentUser.id));
        showToast('You have been removed from the donor registry.', 'info');
        onUpdate();
      },
    }, '✕ Withdraw');

    wrap.appendChild(statusLine);
    wrap.appendChild(details);
    wrap.appendChild(el('div', { class: 'vm-blood-donor-actions' }, toggleBtn, withdrawBtn));
    return wrap;
  }

  // Opt-in form
  wrap.appendChild(
    el('p', { class: 'vm-blood-optin-intro' },
      'Voluntarily register as a potential blood donor. Your contact details are never made public. ',
      'Requesters can only send you an anonymous in-app note.'
    )
  );

  const bloodGroupSelect = el('select', { class: 'vm-form-control', id: 'bd-group' });
  bloodGroupSelect.appendChild(el('option', { value: '' }, 'I prefer not to say'));
  BLOOD_GROUPS.forEach(g => bloodGroupSelect.appendChild(el('option', { value: g }, g)));

  const locationInput = el('input', {
    type: 'text', class: 'vm-form-control', id: 'bd-location',
    placeholder: 'City / State (broad area only)',
  });

  const errEl = el('p', { class: 'error-message', role: 'alert' });

  const form = el('form', {
    novalidate: true,
    onSubmit: (e) => {
      e.preventDefault();
      errEl.textContent = '';

      const location = locationInput.value.trim();
      if (!location) {
        errEl.textContent = 'Please enter a broad location (city or state).';
        locationInput.focus();
        return;
      }

      const newProfile = {
        userId     : currentUser.id,
        bloodGroup : bloodGroupSelect.value || null,
        location,
        active     : true,
        lastUpdated: new Date().toISOString().slice(0, 10),
      };

      store.set('bloodDonors', [...donors, newProfile]);
      showToast('You are now registered as a blood donor. Thank you!', 'success');
      onUpdate();
    },
  });

  function row(labelText, inputEl) {
    return el('div', { class: 'form-group' },
      el('label', { class: 'vm-form-label', for: inputEl.id }, labelText),
      inputEl
    );
  }

  form.appendChild(row('Blood Group (optional)', bloodGroupSelect));
  form.appendChild(row('Broad Location *', locationInput));
  form.appendChild(errEl);
  form.appendChild(
    el('button', { type: 'submit', class: 'btn btn-primary' }, '🩸 Register as Donor')
  );

  wrap.appendChild(form);
  return wrap;
}

// ── Request card ──────────────────────────────────────────────────────────────

/**
 * Build a single blood-request card.
 *
 * @param {object} req
 * @param {object|null} currentUser
 * @param {string|null} myBloodGroup - Current user's blood group (may be null)
 * @param {Function} onUpdate
 * @returns {HTMLElement}
 */
function buildRequestCard(req, currentUser, myBloodGroup, onUpdate) {
  const compatibility = checkCompatibility(myBloodGroup, req.bloodGroup);

  const urgencyBadge = badge(
    (req.urgency || 'routine').toUpperCase(),
    URGENCY_COLOURS[req.urgency] || 'muted'
  );
  const statusEl = statusBadge(req.status);

  // Compatibility indicator (informational only — always shown with caveats)
  let compatEl;
  if (!myBloodGroup) {
    compatEl = el('span', { class: 'vm-blood-compat vm-blood-compat-unknown' },
      '❓ Set your blood group to see compatibility'
    );
  } else if (compatibility === 'compatible') {
    compatEl = el('span', { class: 'vm-blood-compat vm-blood-compat-yes' },
      '✅ Potentially compatible (confirm with medical staff)'
    );
  } else {
    compatEl = el('span', { class: 'vm-blood-compat vm-blood-compat-no' },
      '❌ Likely incompatible'
    );
  }

  const isOpen = req.status === 'open';

  const header = el('div', { class: 'vm-blood-card-header' },
    el('div', { class: 'vm-blood-card-badges' }, urgencyBadge, statusEl),
    el('h3', { class: 'vm-blood-card-group' },
      `Blood group needed: ${req.bloodGroup || 'Any'}`
    )
  );

  const body = el('div', { class: 'vm-blood-card-body' },
    el('p', null,
      el('strong', null, '🏥 Facility: '), req.facility || '—'
    ),
    el('p', null,
      el('strong', null, '📍 Location: '), req.location || '—'
    ),
    el('p', null,
      el('strong', null, '⏰ Required by: '),
      req.requiredBy ? new Date(req.requiredBy).toLocaleString('en-NG', {
        dateStyle: 'medium', timeStyle: 'short'
      }) : '—'
    ),
    el('p', null,
      el('strong', null, '📞 Contact: '), req.contactMethod || 'In-app only'
    ),
    compatEl
  );

  // "I Can Help" button — only for open requests, only if not the requester
  const isOwn = currentUser && req.requesterId === currentUser.id;
  const canHelp = currentUser && isOpen && !isOwn;

  const helpBtn = el('button', {
    class: 'btn btn-primary',
    'aria-label': `Offer to help with blood request from ${req.facility}`,
    disabled: !canHelp,
    title: isOwn ? 'This is your own request' : (isOpen ? '' : 'Request is no longer open'),
    onClick: canHelp ? () => {
      // Store an in-app notification — never reveal donor details
      const notifs = store.get('notifications') || [];
      store.set('notifications', [...notifs, {
        id       : `n_${Date.now()}`,
        toUserId : req.requesterId,
        fromUserId: currentUser.id,
        type     : 'blood-offer',
        message  : `A registered donor has offered to help with your blood request at ${req.facility}. Contact them through the platform.`,
        createdAt: new Date().toISOString(),
        read     : false,
      }]);
      showToast('Your offer has been sent anonymously. The requester will be notified.', 'success');
    } : null,
  }, isOwn ? '📋 Your Request' : (isOpen ? '🙋 I Can Help' : '✓ Closed'));

  // Per-card disclaimer (required on every card)
  const cardDisclaimer = el('p', { class: 'vm-blood-card-disclaimer' },
    '⚕️ Confirm medical compatibility with hospital staff before donating.'
  );

  const card = el('div', { class: 'vm-card vm-blood-card' },
    header, body,
    el('div', { class: 'vm-blood-card-footer' }, helpBtn),
    cardDisclaimer
  );

  return card;
}

// ── Submit request form ───────────────────────────────────────────────────────

/**
 * Build the "Submit a Blood Request" form.
 *
 * @param {object} currentUser
 * @param {Function} onCreated
 * @returns {HTMLElement}
 */
function buildRequestForm(currentUser, onCreated) {
  const wrap = el('div', { class: 'vm-card vm-blood-request-form' });
  wrap.appendChild(el('h2', { class: 'vm-blood-section-title' }, '📋 Submit a Blood Request'));
  wrap.appendChild(
    el('p', { class: 'vm-blood-form-note' },
      'Use this form to connect with potential donors through the platform. ',
      'Always coordinate final arrangements through your hospital or blood bank.'
    )
  );

  const bloodGroupSelect = el('select', { class: 'vm-form-control', id: 'br-group' });
  bloodGroupSelect.appendChild(el('option', { value: '' }, 'Any / Unknown'));
  BLOOD_GROUPS.forEach(g => bloodGroupSelect.appendChild(el('option', { value: g }, g)));

  const facilityInput = el('input', {
    type: 'text', class: 'vm-form-control', id: 'br-facility',
    placeholder: 'Hospital or authorised care facility name', required: true,
  });
  const locationInput = el('input', {
    type: 'text', class: 'vm-form-control', id: 'br-location',
    placeholder: 'City / State', required: true,
  });
  const urgencySelect = el('select', { class: 'vm-form-control', id: 'br-urgency' });
  [['routine','Routine'],['urgent','Urgent'],['critical','Critical — life-threatening']].forEach(([v,t]) =>
    urgencySelect.appendChild(el('option', { value: v }, t))
  );
  const requiredByInput = el('input', {
    type: 'datetime-local', class: 'vm-form-control', id: 'br-required-by',
  });
  const contactInput = el('input', {
    type: 'text', class: 'vm-form-control', id: 'br-contact',
    placeholder: 'e.g. In-app message only, or ward contact number',
  });

  const errEl = el('p', { class: 'error-message', role: 'alert' });

  function row(labelText, inputEl) {
    return el('div', { class: 'form-group' },
      el('label', { class: 'vm-form-label', for: inputEl.id }, labelText),
      inputEl
    );
  }

  const form = el('form', {
    novalidate: true,
    onSubmit: (e) => {
      e.preventDefault();
      errEl.textContent = '';

      const facility = facilityInput.value.trim();
      const location = locationInput.value.trim();
      if (!facility) { errEl.textContent = 'Facility name is required.'; facilityInput.focus(); return; }
      if (!location) { errEl.textContent = 'Location is required.'; locationInput.focus(); return; }

      const newReq = {
        id            : `br_${Date.now()}`,
        requesterId   : currentUser.id,
        bloodGroup    : bloodGroupSelect.value || null,
        facility,
        location,
        urgency       : urgencySelect.value,
        requiredBy    : requiredByInput.value || null,
        contactMethod : contactInput.value.trim() || 'In-app message only',
        status        : 'open',
        verifiedByAdmin: false,
        createdAt     : new Date().toISOString(),
      };

      const requests = store.get('bloodRequests') || [];
      store.set('bloodRequests', [...requests, newReq]);
      showToast('Blood request submitted. Matching donors will be notified.', 'success');
      onCreated();
    },
  });

  form.appendChild(row('Blood Group Needed', bloodGroupSelect));
  form.appendChild(row('Hospital / Facility *', facilityInput));
  form.appendChild(row('Location *', locationInput));
  form.appendChild(row('Urgency', urgencySelect));
  form.appendChild(row('Required By', requiredByInput));
  form.appendChild(row('Contact Method', contactInput));
  form.appendChild(errEl);
  form.appendChild(
    el('button', { type: 'submit', class: 'btn btn-primary' }, '📤 Submit Request')
  );
  form.appendChild(
    el('p', { class: 'vm-blood-form-note', style: 'margin-top:0.75rem;' },
      '⚕️ Remember: all donations must be medically cleared by qualified staff.'
    )
  );

  wrap.appendChild(form);
  return wrap;
}

// ── Main render ───────────────────────────────────────────────────────────────

/**
 * Render the Blood Donation view.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Function} Cleanup function
 */
export default async function renderBloodDonation(container, _params) {
  auth.requireAuth();

  const currentUser = auth.currentUser();
  if (!currentUser) return;

  let showRequestForm = false;

  function render() {
    container.innerHTML = '';

    // REQUIRED: disclaimer on every render
    container.appendChild(buildDisclaimer());

    // Page title
    container.appendChild(
      el('h1', { class: 'vm-page-title', style: 'margin-bottom:1.25rem;' }, '🩸 Blood Donation')
    );

    // ── Donor section ────────────────────────────────────────────────────────
    container.appendChild(buildDonorSection(currentUser, render));

    // ── Open Requests section ────────────────────────────────────────────────
    container.appendChild(
      el('h2', { class: 'vm-blood-section-title', style: 'margin-top:1.5rem;' }, '📋 Active Requests')
    );

    // Get current user's blood group (from donor profile if opted in)
    const donors = store.get('bloodDonors') || [];
    const myDonorProfile = donors.find(d => d.userId === currentUser.id);
    const myBloodGroup = myDonorProfile ? myDonorProfile.bloodGroup : null;

    const allRequests = store.get('bloodRequests') || [];
    const activeRequests = allRequests.filter(r => r.status !== 'cancelled');

    if (activeRequests.length === 0) {
      container.appendChild(
        emptyState('🩸', 'No active blood requests',
          'When someone submits a request, it will appear here.')
      );
    } else {
      activeRequests.forEach(req => {
        container.appendChild(buildRequestCard(req, currentUser, myBloodGroup, render));
      });
    }

    // ── Submit Request section ───────────────────────────────────────────────
    const reqActionRow = el('div', {
      class: 'vm-page-actions-row',
      style: 'margin-top:1.5rem;',
    });
    const toggleFormBtn = el('button', {
      class: 'btn btn-primary',
      onClick: () => { showRequestForm = !showRequestForm; render(); },
    }, showRequestForm ? '✕ Cancel Request' : '+ Submit a Blood Request');
    reqActionRow.appendChild(toggleFormBtn);
    container.appendChild(reqActionRow);

    if (showRequestForm) {
      container.appendChild(
        buildRequestForm(currentUser, () => {
          showRequestForm = false;
          render();
        })
      );
    }
  }

  render();
  return () => {};
}
