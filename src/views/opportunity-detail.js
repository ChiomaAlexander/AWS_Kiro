/**
 * opportunity-detail.js — Single opportunity detail + application + matching view.
 *
 * Displays full opportunity details, applicant list, an Apply button for
 * non-creators, and a Volunteer Matching section (creator-only) that calls
 * rankVolunteers() from matcher.js with the correct data shapes.
 *
 * @module views/opportunity-detail
 */

import { store } from '../store.js';
import { auth } from '../auth.js';
import { router } from '../router.js';
import { rankVolunteers, countUnfilledRoles } from '../matcher.js';
import {
  el,
  card,
  badge,
  avatar,
  statusBadge,
  emptyState,
  errorState,
  renderResults,
} from '../ui.js';

// ─── Data-shape converters (CRITICAL — matcher requires specific shapes) ───

/**
 * Convert a store User object to the Volunteer shape expected by rankVolunteers().
 *
 * Volunteer shape: {
 *   id: string,
 *   name: string,          ← user.displayName
 *   skills: string[],
 *   availability: Array<{start, end}>,
 *   assignments: string[]  ← opp IDs where this user has an 'accepted' application
 * }
 *
 * @param {object} user - User object from store.get('users')
 * @param {object[]} allOpps - All opportunities (to find accepted applications)
 * @returns {object} Volunteer-shaped object
 */
function toVolunteer(user, allOpps) {
  // assignments = list of opportunity IDs where this user has been accepted
  const assignments = allOpps
    .filter(opp =>
      (opp.applications || []).some(
        app => app.userId === user.id && app.status === 'accepted'
      )
    )
    .map(opp => opp.id);

  return {
    id: user.id,
    name: user.displayName || user.username || 'Unknown',
    skills: user.skills || [],
    availability: user.availability || [],
    assignments,
  };
}

/**
 * Convert a store Opportunity object to the Task shape expected by rankVolunteers().
 *
 * Task shape: {
 *   id: string,
 *   name: string,               ← opp.title
 *   requiredSkills: string[],
 *   slot: { start: string, end: string },
 *   volunteersNeeded: number,
 *   assignedVolunteers: string[]
 * }
 *
 * @param {object} opp - Opportunity object from the store
 * @returns {object} Task-shaped object
 */
function toTask(opp) {
  return {
    id: opp.id,
    name: opp.title || 'Untitled',
    requiredSkills: opp.requiredSkills || [],
    slot: opp.slot || { start: '', end: '' },
    volunteersNeeded: opp.volunteersNeeded || 1,
    assignedVolunteers: opp.assignedVolunteers || [],
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Format a slot label for display.
 *
 * @param {{ label?: string, start?: string, end?: string }} slot
 * @returns {string}
 */
function formatSlot(slot) {
  if (!slot) return 'No date set';
  if (slot.label) return slot.label;
  if (slot.start && slot.end) {
    const fmt = d =>
      new Date(d).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    return `${fmt(slot.start)} – ${fmt(slot.end)}`;
  }
  return 'Unknown date';
}

// ─── Application status badge ─────────────────────────────────────────────

/**
 * Return a styled span for an application status value.
 *
 * @param {'submitted'|'accepted'|'declined'} status
 * @returns {HTMLSpanElement}
 */
function appStatusBadge(status) {
  const map = {
    submitted: { label: '⏳ Submitted', cls: 'status-pending' },
    accepted: { label: '✅ Accepted', cls: 'status-verified' },
    declined: { label: '❌ Declined', cls: 'status-rejected' },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return el('span', { class: `vm-status-badge ${cls}` }, label);
}

// ─── Applicant list section ────────────────────────────────────────────────

/**
 * Build the applications list section.
 *
 * @param {object} opp - Opportunity object from store
 * @param {object[]} users - All users from store
 * @param {object} currentUser - Logged-in user
 * @param {boolean} isCreator - True if currentUser is the organiser
 * @param {Function} onStatusChange - Called with (userId, newStatus)
 * @returns {HTMLElement}
 */
function buildApplicationsSection(opp, users, currentUser, isCreator, onStatusChange) {
  const apps = opp.applications || [];

  const heading = el('h2', { class: 'vm-section-heading' }, '👥 Applicants');

  if (apps.length === 0) {
    return el(
      'section',
      { 'aria-label': 'Applicants' },
      heading,
      emptyState('📭', 'No applicants yet', 'Be the first to apply!')
    );
  }

  const rows = apps.map(app => {
    const applicant = users.find(u => u.id === app.userId);
    if (!applicant) return null;

    const applicantAvatar = avatar(applicant);
    const nameEl = el(
      'a',
      {
        class: 'vm-app-row__name',
        href: `#/profile/${applicant.username}`,
        'aria-label': `View ${applicant.displayName} profile`,
      },
      applicant.displayName
    );
    const handleEl = el(
      'span',
      { class: 'vm-app-row__handle' },
      `@${applicant.username}`
    );

    const statusEl = appStatusBadge(app.status);

    const actionsEl = el('div', { class: 'vm-app-row__actions' });
    if (isCreator && app.status === 'submitted') {
      const acceptBtn = el(
        'button',
        {
          class: 'btn btn-primary',
          'aria-label': `Accept ${applicant.displayName}`,
          onClick: () => onStatusChange(app.userId, 'accepted'),
        },
        '✅ Accept'
      );
      const declineBtn = el(
        'button',
        {
          class: 'btn btn-danger',
          'aria-label': `Decline ${applicant.displayName}`,
          onClick: () => onStatusChange(app.userId, 'declined'),
        },
        '❌ Decline'
      );
      actionsEl.appendChild(acceptBtn);
      actionsEl.appendChild(declineBtn);
    }

    return el(
      'div',
      { class: 'vm-app-row' },
      applicantAvatar,
      nameEl,
      handleEl,
      statusEl,
      actionsEl
    );
  }).filter(Boolean);

  const list = el('div', { class: 'vm-app-list', role: 'list' }, ...rows.map(r => {
    r.setAttribute('role', 'listitem');
    return r;
  }));

  return el('section', { 'aria-label': 'Applicants' }, heading, list);
}

// ─── Volunteer matching section ────────────────────────────────────────────

/**
 * Build the Volunteer Matching section (creator-only).
 * Converts applicants and all opportunities to the shapes expected by
 * rankVolunteers(), then renders results using ui.js renderResults().
 *
 * @param {object} opp - Current opportunity from store
 * @param {object[]} allOpps - All opportunities from store
 * @param {object[]} users - All users from store
 * @param {Function} onAssign - Called with volunteer ID to assign them
 * @returns {HTMLElement}
 */
function buildMatchingSection(opp, allOpps, users, onAssign) {
  const heading = el('h2', { class: 'vm-section-heading' }, '🏆 Volunteer Matching');

  const apps = opp.applications || [];
  if (apps.length === 0) {
    return el(
      'section',
      { 'aria-label': 'Volunteer Matching' },
      heading,
      emptyState(
        '📊',
        'No applicants to rank',
        'Matching results will appear here once volunteers apply.'
      )
    );
  }

  // Build volunteer shapes from applicants only
  const applicantUsers = apps
    .map(app => users.find(u => u.id === app.userId))
    .filter(Boolean);

  const volunteers = applicantUsers.map(u => toVolunteer(u, allOpps));

  // Build task shape for this opportunity
  const task = toTask(opp);

  // Build all-tasks array (required for conflict detection)
  const allTasks = allOpps.map(toTask);

  // Run the ranking algorithm
  const results = rankVolunteers(volunteers, task, allTasks);
  const unfilledCount = countUnfilledRoles(results, task);

  // Render results into a container div using renderResults from ui.js
  const resultsContainer = el('div', { class: 'vm-matching-results' });

  renderResults(results, task, unfilledCount, (volunteerId) => {
    if (typeof onAssign === 'function') {
      onAssign(volunteerId, 'accepted');
    }
  }, resultsContainer);

  return el('section', { 'aria-label': 'Volunteer Matching' }, heading, resultsContainer);
}

// ─── View entry point ─────────────────────────────────────────────────────

/**
 * Render the opportunity detail view.
 *
 * @param {HTMLElement} container - The #view-root element
 * @param {{ id: string }} params - Route params (opportunity ID)
 * @returns {Function} Cleanup function
 */
export default async function renderOpportunityDetail(container, params) {
  // Auth guard
  auth.requireAuth();

  const currentUser = auth.currentUser();
  if (!currentUser) {
    container.innerHTML = '';
    container.appendChild(errorState('You must be logged in to view this page.'));
    return () => {};
  }

  /** Re-render the whole detail view */
  function renderView() {
    container.innerHTML = '';

    const opportunities = store.get('opportunities') || [];
    const opp = opportunities.find(o => o.id === params.id);
    const users = store.get('users') || [];
    const orgs = store.get('organisations') || [];

    // Back button
    const backBtn = el(
      'button',
      {
        class: 'btn btn-secondary vm-back-btn',
        'aria-label': 'Back to opportunities list',
        onClick: () => router.navigate('/opportunities'),
      },
      '← Back to Opportunities'
    );
    container.appendChild(backBtn);

    // Not found state
    if (!opp) {
      container.appendChild(errorState('Opportunity not found.'));
      return;
    }

    const isCreator = opp.organiserId === currentUser.id;

    // Look up related data
    const org = opp.orgId ? orgs.find(o => o.id === opp.orgId) || null : null;
    const organiser = users.find(u => u.id === opp.organiserId) || null;

    // ── Header section ───────────────────────────────────────────────────────

    const titleEl = el('h1', { class: 'vm-detail-title' }, opp.title || 'Untitled');

    const orgBadge = org
      ? badge(`🏢 ${org.name}`, 'org')
      : null;

    const organiserEl = organiser
      ? el(
          'p',
          { class: 'vm-detail-organiser' },
          'Organised by ',
          el(
            'a',
            {
              href: `#/profile/${organiser.username}`,
              'aria-label': `View ${organiser.displayName} profile`,
            },
            organiser.displayName
          )
        )
      : null;

    const slotEl = el(
      'p',
      { class: 'vm-detail-slot' },
      `📅 ${formatSlot(opp.slot)}`
    );

    const locationEl = opp.location
      ? el('p', { class: 'vm-detail-location' }, `📍 ${opp.location}`)
      : null;

    const metaRow = el(
      'div',
      { class: 'vm-detail-meta' },
      statusBadge(opp.status || 'open'),
      opp.format ? badge(opp.format, 'format') : null,
      opp.category ? badge(opp.category, 'category') : null
    );

    const headerCard = card(
      titleEl,
      orgBadge,
      organiserEl,
      slotEl,
      locationEl,
      metaRow
    );
    container.appendChild(headerCard);

    // ── Description ──────────────────────────────────────────────────────────

    if (opp.description) {
      const descCard = card(
        el('h2', { class: 'vm-section-heading' }, '📄 Description'),
        el('p', { class: 'vm-detail-description' }, opp.description)
      );
      container.appendChild(descCard);
    }

    // ── Required skills ──────────────────────────────────────────────────────

    if ((opp.requiredSkills || []).length > 0) {
      const skillBadges = opp.requiredSkills.map(s => badge(s, 'skill'));
      const skillsCard = card(
        el('h2', { class: 'vm-section-heading' }, '🛠️ Required Skills'),
        el('div', { class: 'vm-detail-skills' }, ...skillBadges)
      );
      container.appendChild(skillsCard);
    }

    // ── Applications section ─────────────────────────────────────────────────

    /** Update an applicant's status (creator only) */
    function handleStatusChange(userId, newStatus) {
      const opps = store.get('opportunities') || [];
      const target = opps.find(o => o.id === params.id);
      if (!target) return;

      const updatedApps = (target.applications || []).map(app =>
        app.userId === userId ? { ...app, status: newStatus } : app
      );

      // If accepting, also add to assignedVolunteers if not already present
      let updatedAssigned = [...(target.assignedVolunteers || [])];
      if (newStatus === 'accepted' && !updatedAssigned.includes(userId)) {
        updatedAssigned.push(userId);
      }
      if (newStatus === 'declined') {
        updatedAssigned = updatedAssigned.filter(id => id !== userId);
      }

      store.patch('opportunities', params.id, {
        applications: updatedApps,
        assignedVolunteers: updatedAssigned,
      });
      renderView();
    }

    const appsSection = buildApplicationsSection(
      opp,
      users,
      currentUser,
      isCreator,
      handleStatusChange
    );
    container.appendChild(card(appsSection));

    // ── Apply / Close buttons ────────────────────────────────────────────────

    const hasApplied = (opp.applications || []).some(
      app => app.userId === currentUser.id
    );
    const isClosed = opp.status === 'closed';

    const actionsCard = card();

    if (!isCreator) {
      // Apply button
      const applyBtn = el(
        'button',
        {
          class: 'btn btn-primary',
          'aria-label': hasApplied
            ? 'You have already applied'
            : isClosed
              ? 'This opportunity is closed'
              : 'Apply for this opportunity',
          disabled: hasApplied || isClosed,
          'aria-disabled': String(hasApplied || isClosed),
          onClick: () => {
            if (hasApplied || isClosed) return;
            const opps = store.get('opportunities') || [];
            const target = opps.find(o => o.id === params.id);
            if (!target) return;

            const newApp = {
              userId: currentUser.id,
              status: 'submitted',
              appliedAt: new Date().toISOString(),
            };
            const updatedApps = [...(target.applications || []), newApp];
            store.patch('opportunities', params.id, { applications: updatedApps });
            renderView();
          },
        },
        hasApplied
          ? '✅ Already Applied'
          : isClosed
            ? '🔒 Opportunity Closed'
            : '🙋 Apply Now'
      );
      actionsCard.appendChild(applyBtn);
    }

    // Close opportunity button (creator only, only if currently open)
    if (isCreator && !isClosed) {
      const closeBtn = el(
        'button',
        {
          class: 'btn btn-danger',
          'aria-label': 'Close this opportunity',
          onClick: () => {
            store.patch('opportunities', params.id, { status: 'closed' });
            renderView();
          },
        },
        '🔒 Close Opportunity'
      );
      actionsCard.appendChild(closeBtn);
    }

    container.appendChild(actionsCard);

    // ── Volunteer matching section (creator only, only if there are applicants) ──
    if (isCreator && (opp.applications || []).length > 0) {
      const allOpps = store.get('opportunities') || [];
      const matchingSection = buildMatchingSection(opp, allOpps, users, handleStatusChange);
      container.appendChild(card(matchingSection));
    }
  }

  renderView();

  return function cleanup() {};
}
