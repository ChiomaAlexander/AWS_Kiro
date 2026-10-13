/**
 * opportunities.js — Discover & create volunteering opportunities view.
 *
 * Displays a filterable list of opportunities and a create form for
 * logged-in users. Navigates to /opportunities/:id on "View Details".
 *
 * @module views/opportunities
 */

import { store } from '../store.js';
import { auth } from '../auth.js';
import { router } from '../router.js';
import { SKILLS } from '../data.js';
import {
  el,
  card,
  badge,
  statusBadge,
  emptyState,
  errorState,
} from '../ui.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Format a slot label for display. Falls back to ISO strings if label missing.
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

/**
 * Count how many volunteer slots are still available.
 *
 * @param {object} opp - Opportunity object from the store
 * @returns {number}
 */
function slotsRemaining(opp) {
  const filled = (opp.assignedVolunteers || []).length;
  return Math.max(0, (opp.volunteersNeeded || 0) - filled);
}

// ─── Opportunity card ──────────────────────────────────────────────────────

/**
 * Build a single opportunity card element.
 *
 * @param {object} opp - Opportunity object
 * @param {object|null} org - Organisation object for this opp (or null)
 * @returns {HTMLElement}
 */
function buildOppCard(opp, org) {
  const filled = (opp.assignedVolunteers || []).length;
  const needed = opp.volunteersNeeded || 0;
  const remaining = slotsRemaining(opp);

  const titleEl = el('h3', { class: 'vm-opp-card__title' }, opp.title || 'Untitled');

  const orgBadge = org
    ? badge(`🏢 ${org.name}`, 'org')
    : null;

  const slotEl = el(
    'p',
    { class: 'vm-opp-card__slot' },
    `📅 ${formatSlot(opp.slot)}`
  );

  const locationEl = opp.location
    ? el('p', { class: 'vm-opp-card__location' }, `📍 ${opp.location}`)
    : null;

  // Required skills
  const skillTags = (opp.requiredSkills || []).map(s => badge(s, 'skill'));
  const skillsRow = el('div', { class: 'vm-opp-card__skills' }, ...skillTags);

  // Volunteer fill stat
  const fillStat = el(
    'p',
    { class: 'vm-opp-card__fill' },
    `👥 ${filled} of ${needed} volunteer${needed !== 1 ? 's' : ''} filled`
  );
  if (remaining === 0 && needed > 0) {
    fillStat.style.color = 'var(--success)';
  } else if (remaining <= 2 && remaining > 0) {
    fillStat.style.color = 'var(--warning)';
  }

  // Status + meta badges row
  const metaRow = el(
    'div',
    { class: 'vm-opp-card__meta' },
    statusBadge(opp.status || 'open'),
    opp.format ? badge(opp.format, 'format') : null,
    opp.category ? badge(opp.category, 'category') : null
  );

  // View details button
  const detailBtn = el(
    'button',
    {
      class: 'btn btn-primary vm-opp-card__cta',
      'aria-label': `View details for ${opp.title}`,
      onClick: () => router.navigate(`/opportunities/${opp.id}`),
    },
    '🔍 View Details'
  );

  return card(
    titleEl,
    orgBadge,
    slotEl,
    locationEl,
    skillsRow,
    fillStat,
    metaRow,
    detailBtn
  );
}

// ─── Create-opportunity form ───────────────────────────────────────────────

/**
 * Build the create-opportunity inline form.
 *
 * @param {object} currentUser - Logged-in user object
 * @param {Function} onSubmit - Called with the new opportunity object
 * @returns {HTMLElement}
 */
function buildCreateForm(currentUser, onSubmit) {
  const orgs = store.get('organisations') || [];
  // User can link an opp to any org they are a member or owner of
  const myOrgs = orgs.filter(
    o => o.ownerId === currentUser.id || (o.members || []).includes(currentUser.id)
  );

  // Heading
  const heading = el('h2', { class: 'vm-form-heading' }, '📋 Create Opportunity');

  // Title
  const titleErr = el('p', { class: 'error-message', role: 'alert', id: 'err-opp-title' });
  const titleInput = el('input', {
    type: 'text',
    id: 'opp-title',
    placeholder: 'Opportunity title',
    'aria-label': 'Opportunity title',
    'aria-describedby': 'err-opp-title',
    required: true,
  });
  const titleGroup = el(
    'div',
    { class: 'form-group' },
    el('label', { for: 'opp-title' }, 'Title *'),
    titleInput,
    titleErr
  );

  // Description
  const descInput = el('textarea', {
    id: 'opp-desc',
    placeholder: 'Describe what volunteers will do…',
    rows: '3',
    'aria-label': 'Opportunity description',
  });
  const descGroup = el(
    'div',
    { class: 'form-group' },
    el('label', { for: 'opp-desc' }, 'Description'),
    descInput
  );

  // Org select
  const orgOptions = [el('option', { value: '' }, '— None (individual event) —')];
  myOrgs.forEach(o => {
    orgOptions.push(el('option', { value: o.id }, o.name));
  });
  const orgSelect = el('select', {
    id: 'opp-org',
    'aria-label': 'Associated organisation',
  }, ...orgOptions);
  const orgGroup = el(
    'div',
    { class: 'form-group' },
    el('label', { for: 'opp-org' }, 'Organisation'),
    orgSelect
  );

  // Required skills (checkboxes)
  const skillsErr = el('p', { class: 'error-message', role: 'alert', id: 'err-opp-skills' });
  const skillCheckboxes = SKILLS.map(skill => {
    const cb = el('input', {
      type: 'checkbox',
      name: 'opp-skills',
      value: skill,
      id: `opp-skill-${skill}`,
      'aria-label': skill,
    });
    return el(
      'label',
      { class: 'vm-skill-checkbox', for: `opp-skill-${skill}` },
      cb,
      ` ${skill}`
    );
  });
  const skillsGrid = el('div', { class: 'skills-grid' }, ...skillCheckboxes);
  const skillsGroup = el(
    'div',
    { class: 'form-group' },
    el('label', {}, 'Required Skills *'),
    skillsGrid,
    skillsErr
  );

  // Slot start / end
  const slotErr = el('p', { class: 'error-message', role: 'alert', id: 'err-opp-slot' });
  const startInput = el('input', {
    type: 'datetime-local',
    id: 'opp-start',
    'aria-label': 'Opportunity start time',
    'aria-describedby': 'err-opp-slot',
  });
  const endInput = el('input', {
    type: 'datetime-local',
    id: 'opp-end',
    'aria-label': 'Opportunity end time',
    'aria-describedby': 'err-opp-slot',
  });
  const slotGroup = el(
    'div',
    { class: 'form-group' },
    el('label', { for: 'opp-start' }, 'Start Time *'),
    startInput,
    el('label', { for: 'opp-end' }, 'End Time *'),
    endInput,
    slotErr
  );

  // Volunteers needed
  const volErr = el('p', { class: 'error-message', role: 'alert', id: 'err-opp-vol' });
  const volInput = el('input', {
    type: 'number',
    id: 'opp-vol',
    min: '1',
    value: '1',
    'aria-label': 'Number of volunteers needed',
    'aria-describedby': 'err-opp-vol',
  });
  const volGroup = el(
    'div',
    { class: 'form-group' },
    el('label', { for: 'opp-vol' }, 'Volunteers Needed *'),
    volInput,
    volErr
  );

  // Location
  const locInput = el('input', {
    type: 'text',
    id: 'opp-loc',
    placeholder: 'e.g. Lagos Food Bank, Victoria Island',
    'aria-label': 'Opportunity location',
  });
  const locGroup = el(
    'div',
    { class: 'form-group' },
    el('label', { for: 'opp-loc' }, 'Location'),
    locInput
  );

  // Format
  const formatSelect = el(
    'select',
    { id: 'opp-format', 'aria-label': 'Opportunity format' },
    el('option', { value: 'in-person' }, 'In-Person'),
    el('option', { value: 'online' }, 'Online'),
    el('option', { value: 'hybrid' }, 'Hybrid')
  );
  const formatGroup = el(
    'div',
    { class: 'form-group' },
    el('label', { for: 'opp-format' }, 'Format'),
    formatSelect
  );

  // Category
  const categorySelect = el(
    'select',
    { id: 'opp-cat', 'aria-label': 'Opportunity category' },
    el('option', { value: 'community' }, 'Community'),
    el('option', { value: 'education' }, 'Education'),
    el('option', { value: 'health' }, 'Health'),
    el('option', { value: 'food-security' }, 'Food Security'),
    el('option', { value: 'environment' }, 'Environment'),
    el('option', { value: 'other' }, 'Other')
  );
  const categoryGroup = el(
    'div',
    { class: 'form-group' },
    el('label', { for: 'opp-cat' }, 'Category'),
    categorySelect
  );

  // Deadline
  const deadlineInput = el('input', {
    type: 'datetime-local',
    id: 'opp-deadline',
    'aria-label': 'Application deadline',
  });
  const deadlineGroup = el(
    'div',
    { class: 'form-group' },
    el('label', { for: 'opp-deadline' }, 'Application Deadline'),
    deadlineInput
  );

  // Submit
  const submitBtn = el(
    'button',
    { class: 'btn btn-primary', type: 'submit' },
    '✅ Create Opportunity'
  );

  const form = el(
    'form',
    {
      class: 'task-form',
      'aria-label': 'Create a new opportunity',
      onSubmit: (e) => {
        e.preventDefault();

        // Clear all errors
        titleErr.textContent = '';
        skillsErr.textContent = '';
        slotErr.textContent = '';
        volErr.textContent = '';

        let valid = true;

        // Validate title
        const title = titleInput.value.trim();
        if (!title) {
          titleErr.textContent = 'Title is required.';
          titleInput.focus();
          valid = false;
        }

        // Validate skills (at least one)
        const checkedSkills = Array.from(
          form.querySelectorAll('input[name="opp-skills"]:checked')
        ).map(cb => cb.value);
        if (checkedSkills.length === 0) {
          skillsErr.textContent = 'Select at least one required skill.';
          valid = false;
        }

        // Validate slot
        const startVal = startInput.value;
        const endVal = endInput.value;
        if (!startVal || !endVal) {
          slotErr.textContent = 'Start and end times are required.';
          valid = false;
        } else if (startVal >= endVal) {
          slotErr.textContent = 'End time must be after start time.';
          valid = false;
        }

        // Validate volunteers needed
        const volunteersNeeded = parseInt(volInput.value, 10);
        if (isNaN(volunteersNeeded) || volunteersNeeded < 1) {
          volErr.textContent = 'At least 1 volunteer is required.';
          valid = false;
        }

        if (!valid) return;

        // Build slot label
        const fmt = d =>
          new Date(d).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });
        const slotLabel = `${fmt(startVal)} – ${fmt(endVal)}`;

        const newOpp = {
          id: `opp_${Date.now()}`,
          title,
          description: descInput.value.trim(),
          organiserId: currentUser.id,
          orgId: orgSelect.value || null,
          requiredSkills: checkedSkills,
          slot: { label: slotLabel, start: startVal, end: endVal },
          volunteersNeeded,
          assignedVolunteers: [],
          location: locInput.value.trim(),
          format: formatSelect.value,
          category: categorySelect.value,
          deadline: deadlineInput.value || null,
          status: 'open',
          applications: [],
        };

        onSubmit(newOpp);
      },
    },
    heading,
    titleGroup,
    descGroup,
    orgGroup,
    skillsGroup,
    slotGroup,
    volGroup,
    locGroup,
    formatGroup,
    categoryGroup,
    deadlineGroup,
    submitBtn
  );

  return card(form);
}

// ─── Filter bar ────────────────────────────────────────────────────────────

/**
 * Build the filter controls bar.
 *
 * @param {object} filters - Current filter state { category, format, skill }
 * @param {Function} onChange - Called with (newFilters) when any filter changes
 * @returns {HTMLElement}
 */
function buildFilterBar(filters, onChange) {
  const categorySelect = el(
    'select',
    {
      id: 'filter-category',
      'aria-label': 'Filter by category',
      onChange: () => onChange({
        ...filters,
        category: categorySelect.value,
      }),
    },
    el('option', { value: 'all' }, 'All Categories'),
    el('option', { value: 'food-security' }, 'Food Security'),
    el('option', { value: 'education' }, 'Education'),
    el('option', { value: 'health' }, 'Health'),
    el('option', { value: 'environment' }, 'Environment'),
    el('option', { value: 'community' }, 'Community'),
    el('option', { value: 'other' }, 'Other')
  );
  categorySelect.value = filters.category;

  const formatSelect = el(
    'select',
    {
      id: 'filter-format',
      'aria-label': 'Filter by format',
      onChange: () => onChange({
        ...filters,
        format: formatSelect.value,
      }),
    },
    el('option', { value: 'all' }, 'All Formats'),
    el('option', { value: 'in-person' }, 'In-Person'),
    el('option', { value: 'online' }, 'Online'),
    el('option', { value: 'hybrid' }, 'Hybrid')
  );
  formatSelect.value = filters.format;

  const skillInput = el('input', {
    type: 'text',
    id: 'filter-skill',
    placeholder: 'Search by skill…',
    'aria-label': 'Search by skill',
    value: filters.skill,
    onInput: () => onChange({ ...filters, skill: skillInput.value }),
  });

  return el(
    'div',
    { class: 'vm-filter-bar', role: 'search', 'aria-label': 'Filter opportunities' },
    el('label', { for: 'filter-category', class: 'vm-filter-bar__label' }, 'Category:'),
    categorySelect,
    el('label', { for: 'filter-format', class: 'vm-filter-bar__label' }, 'Format:'),
    formatSelect,
    el('label', { for: 'filter-skill', class: 'vm-filter-bar__label' }, 'Skill:'),
    skillInput
  );
}

// ─── View entry point ─────────────────────────────────────────────────────

/**
 * Render the opportunities list view.
 *
 * @param {HTMLElement} container - The #view-root element
 * @param {object} _params - Route params (unused)
 * @returns {Function} Cleanup function
 */
export default async function renderOpportunities(container, _params) {
  // Auth guard
  auth.requireAuth();

  const currentUser = auth.currentUser();
  if (!currentUser) {
    container.innerHTML = '';
    container.appendChild(errorState('You must be logged in to view opportunities.'));
    return () => {};
  }

  // Filter state
  let filters = { category: 'all', format: 'all', skill: '' };
  // Whether the create form is visible
  let showForm = false;

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Apply filters to the full opportunities list */
  function getFiltered() {
    const opps = store.get('opportunities') || [];
    return opps.filter(opp => {
      if (filters.category !== 'all' && opp.category !== filters.category) return false;
      if (filters.format !== 'all' && opp.format !== filters.format) return false;
      if (filters.skill) {
        const q = filters.skill.toLowerCase().trim();
        const hasSkill = (opp.requiredSkills || []).some(s =>
          s.toLowerCase().includes(q)
        );
        if (!hasSkill) return false;
      }
      return true;
    });
  }

  /** Handle new opportunity submission */
  function handleCreateOpp(newOpp) {
    const existing = store.get('opportunities') || [];
    store.set('opportunities', [...existing, newOpp]);
    router.navigate(`/opportunities/${newOpp.id}`);
  }

  /** Re-render the whole view */
  function renderView() {
    container.innerHTML = '';

    const heading = el('h1', { class: 'vm-view-title' }, '🔍 Volunteer Opportunities');

    // Header row: heading + create button
    const createBtn = el(
      'button',
      {
        class: `btn ${showForm ? 'btn-secondary' : 'btn-primary'}`,
        'aria-label': showForm ? 'Close create form' : 'Create a new opportunity',
        'aria-expanded': String(showForm),
        onClick: () => {
          showForm = !showForm;
          renderView();
        },
      },
      showForm ? '✖ Cancel' : '➕ Create Opportunity'
    );

    const headerRow = el(
      'div',
      { class: 'vm-view-header' },
      heading,
      createBtn
    );
    container.appendChild(headerRow);

    // Create form (shown/hidden)
    if (showForm) {
      container.appendChild(buildCreateForm(currentUser, handleCreateOpp));
    }

    // Filter bar
    container.appendChild(
      buildFilterBar(filters, newFilters => {
        filters = newFilters;
        renderView();
      })
    );

    // Opportunity cards
    const filtered = getFiltered();
    const orgs = store.get('organisations') || [];

    if (filtered.length === 0) {
      container.appendChild(
        emptyState(
          '🔍',
          'No opportunities found',
          'Try adjusting your filters or create the first one.',
          null,
          null
        )
      );
      return;
    }

    const listEl = el('div', { class: 'vm-opp-list', role: 'list' });
    for (const opp of filtered) {
      const org = opp.orgId ? orgs.find(o => o.id === opp.orgId) || null : null;
      const oppCard = buildOppCard(opp, org);
      oppCard.setAttribute('role', 'listitem');
      listEl.appendChild(oppCard);
    }
    container.appendChild(listEl);
  }

  renderView();

  return function cleanup() {};
}
