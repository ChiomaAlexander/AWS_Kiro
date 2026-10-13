/**
 * organisations.js — Organisations directory view.
 *
 * Displays the organisation list with filters, inline detail expansion,
 * verification workflow controls, and a "Create Organisation" form.
 *
 * Security: Admin action buttons (Approve / Reject / Request More Info)
 * are NEVER rendered unless auth.currentUser().role === 'admin'.
 * The check happens at render time; the elements are not in the DOM at all
 * if the role condition is false.
 *
 * @module views/organisations
 */

import { store }      from '../store.js';
import { auth }       from '../auth.js';
import { router }     from '../router.js';
import {
  el, badge, statusBadge, emptyState, avatar, loadingState,
} from '../ui.js';
import { showToast }  from '../components/toast.js';
import mountModal     from '../components/modal.js';

// ── Type / status labels ──────────────────────────────────────────────────────

const TYPE_LABELS = {
  orphanage : 'Orphanage',
  shelter   : 'Shelter',
  ngo       : 'NGO',
  community : 'Community Group',
  other     : 'Other',
};

const STATUS_ORDER = ['draft', 'pending', 'more-info', 'verified', 'rejected'];

// ── Blood-group compatibility (used in detail header) ─────────────────────────

/**
 * Resolve a user id to a display name from the store.
 * @param {string} userId
 * @returns {string}
 */
function userName(userId) {
  const users = store.get('users') || [];
  const u = users.find(u => u.id === userId);
  return u ? u.displayName : userId;
}

// ── Verification timeline strip ───────────────────────────────────────────────

/**
 * Build a visual verification timeline for an organisation.
 * Steps: Draft → Pending → (More Info) → Verified / Rejected
 * Active step is highlighted with the accent colour.
 *
 * @param {string} status
 * @returns {HTMLElement}
 */
function buildTimeline(status) {
  const steps = [
    { key: 'draft',     label: '📝 Draft' },
    { key: 'pending',   label: '⏳ Pending' },
    { key: 'more-info', label: '❓ More Info' },
    { key: 'verified',  label: '✅ Verified' },
  ];

  // For rejected, show Draft → Pending → Rejected
  const displaySteps = status === 'rejected'
    ? [
        { key: 'draft',    label: '📝 Draft' },
        { key: 'pending',  label: '⏳ Pending' },
        { key: 'rejected', label: '❌ Rejected' },
      ]
    : steps;

  const timeline = el('div', { class: 'vm-org-timeline' });

  displaySteps.forEach((step, idx) => {
    const isCurrent = step.key === status;
    const isPast = STATUS_ORDER.indexOf(step.key) < STATUS_ORDER.indexOf(status)
                   && status !== 'rejected';

    const stepEl = el('div', {
      class: `vm-org-timeline-step${isCurrent ? ' current' : ''}${isPast ? ' past' : ''}`,
      'aria-current': isCurrent ? 'step' : undefined,
    }, step.label);

    timeline.appendChild(stepEl);

    // Connector (not after last item)
    if (idx < displaySteps.length - 1) {
      timeline.appendChild(el('div', { class: 'vm-org-timeline-connector' }, '→'));
    }
  });

  return timeline;
}

// ── Detail panel ──────────────────────────────────────────────────────────────

/**
 * Build and return the detail section DOM for an organisation.
 * Handles: Submit for Review, Admin actions, verification note display.
 *
 * @param {object} org
 * @param {object} currentUser
 * @param {function} onUpdate - Called after a state mutation to trigger re-render
 * @returns {HTMLElement}
 */
function buildDetail(org, currentUser, onUpdate) {
  const wrap = el('div', { class: 'vm-org-detail' });

  // ── Header info ───────────────────────────────────────────────────────────
  wrap.appendChild(el('p', { class: 'vm-org-detail-field' },
    el('strong', null, 'Mission: '), org.mission || '—'
  ));
  wrap.appendChild(el('p', { class: 'vm-org-detail-field' },
    el('strong', null, 'Contact: '), org.contact || '—'
  ));
  if (org.website) {
    wrap.appendChild(el('p', { class: 'vm-org-detail-field' },
      el('strong', null, 'Website: '),
      el('a', { href: org.website, target: '_blank', rel: 'noopener noreferrer' }, org.website)
    ));
  }
  wrap.appendChild(el('p', { class: 'vm-org-detail-field' },
    el('strong', null, 'Operating area: '), org.operatingArea || '—'
  ));
  wrap.appendChild(el('p', { class: 'vm-org-detail-field' },
    el('strong', null, 'Representative: '), userName(org.representative)
  ));
  wrap.appendChild(el('p', { class: 'vm-org-detail-field' },
    el('strong', null, 'Created: '), org.createdAt ? org.createdAt.slice(0, 10) : '—'
  ));

  // ── Verification timeline ─────────────────────────────────────────────────
  wrap.appendChild(el('div', { class: 'vm-org-section-label' }, 'Verification Progress'));
  wrap.appendChild(buildTimeline(org.verificationStatus));

  // ── Verification note ─────────────────────────────────────────────────────
  if (org.verificationNote) {
    wrap.appendChild(
      el('div', { class: 'vm-org-verification-note' },
        el('strong', null, 'Note: '),
        org.verificationNote
      )
    );
  }

  // ── Owner: Submit for Review ──────────────────────────────────────────────
  const isOwner  = currentUser && org.ownerId === currentUser.id;
  const isDraft  = org.verificationStatus === 'draft';

  if (isOwner && isDraft) {
    const submitBtn = el('button', {
      class: 'btn btn-primary vm-org-action-btn',
      'aria-label': `Submit ${org.name} for verification review`,
      onClick: () => {
        store.patch('organisations', org.id, { verificationStatus: 'pending' });
        showToast('Organisation submitted for review.', 'success');
        onUpdate();
      },
    }, '📤 Submit for Review');
    wrap.appendChild(submitBtn);
  }

  // ── Admin panel ───────────────────────────────────────────────────────────
  // SECURITY: these buttons are only added to the DOM when role === 'admin'.
  // If the condition is false, the elements are never created or appended.
  if (currentUser && currentUser.role === 'admin') {
    const adminPanel = el('div', { class: 'vm-admin-panel' });
    adminPanel.appendChild(el('div', { class: 'vm-admin-panel-label' }, '🛡️ Admin Actions'));

    // Approve
    const approveBtn = el('button', {
      class: 'btn btn-primary vm-org-action-btn',
      'aria-label': `Approve ${org.name}`,
      onClick: () => {
        store.patch('organisations', org.id, {
          verificationStatus: 'verified',
          verificationNote: '',
        });
        showToast(`${org.name} has been approved.`, 'success');
        onUpdate();
      },
    }, '✅ Approve');

    // Reject — prompts for a note via a modal
    const rejectBtn = el('button', {
      class: 'btn btn-danger vm-org-action-btn',
      'aria-label': `Reject ${org.name}`,
      onClick: () => {
        const textarea = el('textarea', {
          class: 'vm-form-control',
          placeholder: 'Reason for rejection (shown to the organisation owner)…',
          rows: 3,
          style: 'width:100%;margin-top:0.5rem;',
        });

        const modalRef = mountModal({
          title: `Reject: ${org.name}`,
          content: el('div', null,
            el('p', null, 'Enter a note explaining the rejection (required):'),
            textarea
          ),
          actions: [
            {
              label: 'Confirm Rejection',
              variant: 'danger',
              onClick: () => {
                const note = textarea.value.trim();
                if (!note) {
                  showToast('Please enter a rejection note.', 'warning');
                  return;
                }
                store.patch('organisations', org.id, {
                  verificationStatus: 'rejected',
                  verificationNote: note,
                });
                showToast(`${org.name} has been rejected.`, 'info');
                onUpdate();
                modalRef.close();
              },
            },
            { label: 'Cancel', variant: 'secondary', onClick: null },
          ],
        });
      },
    }, '❌ Reject');

    // Request More Info
    const moreInfoBtn = el('button', {
      class: 'btn btn-secondary vm-org-action-btn',
      'aria-label': `Request more information from ${org.name}`,
      onClick: () => {
        const textarea = el('textarea', {
          class: 'vm-form-control',
          placeholder: 'What additional information is needed?…',
          rows: 3,
          style: 'width:100%;margin-top:0.5rem;',
        });

        const modalRef = mountModal({
          title: `Request More Info: ${org.name}`,
          content: el('div', null,
            el('p', null, 'Describe the information required:'),
            textarea
          ),
          actions: [
            {
              label: 'Send Request',
              variant: 'primary',
              onClick: () => {
                const note = textarea.value.trim();
                store.patch('organisations', org.id, {
                  verificationStatus: 'more-info',
                  verificationNote: note || 'Please provide additional documentation.',
                });
                showToast(`More information requested from ${org.name}.`, 'info');
                onUpdate();
                modalRef.close();
              },
            },
            { label: 'Cancel', variant: 'secondary', onClick: null },
          ],
        });
      },
    }, '❓ Request More Info');

    adminPanel.appendChild(approveBtn);
    adminPanel.appendChild(rejectBtn);
    adminPanel.appendChild(moreInfoBtn);
    wrap.appendChild(adminPanel);
  }

  return wrap;
}

// ── Organisation card ─────────────────────────────────────────────────────────

/**
 * Build a single organisation card with expand/collapse detail support.
 *
 * @param {object} org
 * @param {object} currentUser
 * @param {function} onUpdate
 * @returns {HTMLElement}
 */
function buildOrgCard(org, currentUser, onUpdate) {
  let detailVisible = false;
  let detailEl = null;

  const typeLabel    = TYPE_LABELS[org.type] || org.type || 'Organisation';
  const statusEl     = statusBadge(org.verificationStatus || 'draft');
  const typeBadgeEl  = badge(typeLabel, 'type');

  const nameRow = el('div', { class: 'vm-org-card-header' },
    el('h3', { class: 'vm-org-card-name' }, org.name || 'Unnamed Organisation'),
    el('div', { class: 'vm-org-card-badges' }, typeBadgeEl, statusEl)
  );

  const areaEl = el('p', { class: 'vm-org-card-area' },
    el('span', { 'aria-hidden': 'true' }, '📍 '),
    org.operatingArea || '—'
  );

  const descEl = el('p', { class: 'vm-org-card-desc' }, org.description || '');

  const toggleBtn = el('button', {
    class: 'btn btn-secondary vm-org-toggle-btn',
    'aria-expanded': 'false',
    'aria-controls': `org-detail-${org.id}`,
    'aria-label': `View details for ${org.name}`,
    onClick: () => {
      detailVisible = !detailVisible;
      toggleBtn.setAttribute('aria-expanded', String(detailVisible));
      toggleBtn.textContent = detailVisible ? '▲ Hide Details' : '▼ View Details';

      if (detailVisible) {
        if (!detailEl) {
          detailEl = buildDetail(org, currentUser, onUpdate);
          detailEl.id = `org-detail-${org.id}`;
        }
        cardEl.appendChild(detailEl);
      } else {
        if (detailEl && detailEl.parentNode === cardEl) {
          cardEl.removeChild(detailEl);
        }
      }
    },
  }, '▼ View Details');

  const footer = el('div', { class: 'vm-org-card-footer' }, toggleBtn);

  const cardEl = el('div', { class: 'vm-card vm-org-card' },
    nameRow, areaEl, descEl, footer
  );

  return cardEl;
}

// ── Create organisation form ──────────────────────────────────────────────────

/**
 * Build the inline create-organisation form.
 *
 * @param {object} currentUser
 * @param {function} onCreated - Called after successful creation
 * @returns {HTMLElement}
 */
function buildCreateForm(currentUser, onCreated) {
  const wrap = el('div', { class: 'vm-org-create-form vm-card' });
  wrap.appendChild(el('h2', { class: 'vm-form-title' }, '🏢 Create New Organisation'));

  /** @param {string} id @param {string} labelText @param {HTMLElement} input */
  function formGroup(id, labelText, input) {
    const group = el('div', { class: 'form-group' });
    const lbl   = el('label', { for: id, class: 'vm-form-label' }, labelText);
    input.id = id;
    group.appendChild(lbl);
    group.appendChild(input);
    return group;
  }

  const nameInput = el('input', { type: 'text', class: 'vm-form-control',
    placeholder: 'Organisation name', required: true, 'aria-required': 'true' });

  const typeSelect = el('select', { class: 'vm-form-control' });
  [['orphanage','Orphanage'],['shelter','Shelter'],['ngo','NGO'],
   ['community','Community Group'],['other','Other']].forEach(([v, t]) => {
    typeSelect.appendChild(el('option', { value: v }, t));
  });

  const descInput = el('textarea', { class: 'vm-form-control', rows: 3,
    placeholder: 'Brief description of your organisation' });

  const missionInput = el('textarea', { class: 'vm-form-control', rows: 3,
    placeholder: 'Your mission statement' });

  const contactInput = el('input', { type: 'email', class: 'vm-form-control',
    placeholder: 'Contact email' });

  const websiteInput = el('input', { type: 'url', class: 'vm-form-control',
    placeholder: 'https://example.org (optional)' });

  const areaInput = el('input', { type: 'text', class: 'vm-form-control',
    placeholder: 'e.g. Lagos, Nigeria' });

  const repInput = el('input', { type: 'text', class: 'vm-form-control',
    placeholder: 'Representative full name' });

  const errEl = el('p', { class: 'error-message', role: 'alert', id: 'org-create-error' });

  const submitBtn = el('button', { type: 'submit', class: 'btn btn-primary' },
    '✅ Create Organisation');

  const cancelBtn = el('button', { type: 'button', class: 'btn btn-secondary',
    onClick: () => wrap.remove(),
  }, '✕ Cancel');

  const form = el('form', {
    novalidate: true,
    onSubmit: (e) => {
      e.preventDefault();
      errEl.textContent = '';

      const name = nameInput.value.trim();
      if (!name) {
        errEl.textContent = 'Organisation name is required.';
        nameInput.focus();
        return;
      }

      const orgs     = store.get('organisations') || [];
      const newOrg = {
        id              : `org_${Date.now()}`,
        name,
        type            : typeSelect.value,
        description     : descInput.value.trim(),
        mission         : missionInput.value.trim(),
        contact         : contactInput.value.trim(),
        website         : websiteInput.value.trim(),
        operatingArea   : areaInput.value.trim(),
        representative  : currentUser.id,
        members         : [currentUser.id],
        verificationStatus: 'draft',
        verificationNote: '',
        createdAt       : new Date().toISOString(),
        ownerId         : currentUser.id,
      };

      store.set('organisations', [...orgs, newOrg]);
      showToast(`"${name}" created successfully as a draft.`, 'success');
      onCreated();
    },
  });

  form.appendChild(formGroup('org-name', 'Organisation Name *', nameInput));
  form.appendChild(formGroup('org-type', 'Type *', typeSelect));
  form.appendChild(formGroup('org-desc', 'Description', descInput));
  form.appendChild(formGroup('org-mission', 'Mission', missionInput));
  form.appendChild(formGroup('org-contact', 'Contact Email', contactInput));
  form.appendChild(formGroup('org-website', 'Website', websiteInput));
  form.appendChild(formGroup('org-area', 'Operating Area', areaInput));
  form.appendChild(formGroup('org-rep', 'Representative Name', repInput));
  form.appendChild(errEl);

  const btnRow = el('div', { class: 'vm-form-btn-row' }, submitBtn, cancelBtn);
  form.appendChild(btnRow);
  wrap.appendChild(form);

  return wrap;
}

// ── Main render ───────────────────────────────────────────────────────────────

/**
 * Render the organisations list view.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Promise<Function>} Cleanup function
 */
export default async function renderOrganisations(container, _params) {
  auth.requireAuth();

  const currentUser = auth.currentUser();
  if (!currentUser) return;

  // State that persists across filter changes but not full re-renders
  let filterType   = 'all';
  let filterStatus = 'all';
  let showCreateForm = false;

  /**
   * Full re-render of the view content (called on filter changes and mutations).
   */
  function render() {
    container.innerHTML = '';

    // ── Page header ─────────────────────────────────────────────────────────
    const header = el('div', { class: 'vm-page-header' },
      el('div', { class: 'vm-page-header-title' },
        el('h1', { class: 'vm-page-title' }, '🏢 Organisations')
      )
    );

    const createBtn = el('button', {
      class: 'btn btn-primary',
      'aria-label': 'Create a new organisation',
      onClick: () => {
        showCreateForm = !showCreateForm;
        render();
      },
    }, showCreateForm ? '✕ Cancel' : '+ Create Organisation');

    header.querySelector('.vm-page-header-title').appendChild(createBtn);
    container.appendChild(header);

    // ── Create form (inline, shown when showCreateForm=true) ─────────────────
    if (showCreateForm) {
      container.appendChild(
        buildCreateForm(currentUser, () => {
          showCreateForm = false;
          render();
        })
      );
    }

    // ── Filters ──────────────────────────────────────────────────────────────
    const filtersRow = el('div', { class: 'vm-filters-row' });

    // Type filter
    const typeFilter = el('select', {
      class: 'vm-filter-select',
      'aria-label': 'Filter by organisation type',
      onChange: (e) => { filterType = e.target.value; render(); },
    });
    [['all','All Types'],['orphanage','Orphanage'],['shelter','Shelter'],
     ['ngo','NGO'],['community','Community Group'],['other','Other']]
    .forEach(([v, t]) => {
      const opt = el('option', { value: v }, t);
      if (v === filterType) opt.selected = true;
      typeFilter.appendChild(opt);
    });

    // Status filter
    const statusFilter = el('select', {
      class: 'vm-filter-select',
      'aria-label': 'Filter by verification status',
      onChange: (e) => { filterStatus = e.target.value; render(); },
    });
    [['all','All Statuses'],['draft','Draft'],['pending','Pending'],
     ['verified','Verified'],['rejected','Rejected'],['more-info','More Info']]
    .forEach(([v, t]) => {
      const opt = el('option', { value: v }, t);
      if (v === filterStatus) opt.selected = true;
      statusFilter.appendChild(opt);
    });

    filtersRow.appendChild(el('label', { class: 'vm-filter-label' },
      'Type: ', typeFilter
    ));
    filtersRow.appendChild(el('label', { class: 'vm-filter-label' },
      'Status: ', statusFilter
    ));
    container.appendChild(filtersRow);

    // ── Organisations list ────────────────────────────────────────────────────
    const allOrgs = store.get('organisations') || [];
    const filtered = allOrgs.filter(o => {
      if (filterType !== 'all' && o.type !== filterType) return false;
      if (filterStatus !== 'all' && o.verificationStatus !== filterStatus) return false;
      return true;
    });

    if (filtered.length === 0) {
      container.appendChild(
        emptyState('🏢', 'No organisations found',
          'Try adjusting your filters or create a new organisation.')
      );
      return;
    }

    const list = el('div', { class: 'vm-org-list' });
    filtered.forEach(org => {
      list.appendChild(buildOrgCard(org, currentUser, render));
    });
    container.appendChild(list);
  }

  render();

  return function cleanup() {};
}
