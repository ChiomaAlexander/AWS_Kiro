/**
 * donations.js — Donations & Fundraising view.
 *
 * Two tabs: Resource Requests | Fundraising
 *
 * - Resource requests can be created by verified-org owners only.
 * - Fundraising tab shows a clearly labelled demo-only banner.
 * - "Offer to Help" adds an offer to a request and updates its status.
 *
 * @module views/donations
 */

import { store }         from '../store.js';
import { auth }          from '../auth.js';
import { el, emptyState, statusBadge, badge, avatar } from '../ui.js';
import { showToast }     from '../components/toast.js';

// ── Category labels ───────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  food       : '🍞 Food',
  water      : '💧 Water',
  clothing   : '👕 Clothing',
  medical    : '💊 Medical',
  education  : '📚 Education',
  hygiene    : '🧴 Hygiene',
  other      : '📦 Other',
};

const PRIORITY_COLOURS = {
  low    : 'muted',
  medium : 'info',
  high   : 'warning',
  urgent : 'danger',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve org id → display name, or return fallback.
 * @param {string} orgId
 * @returns {string}
 */
function orgName(orgId) {
  const orgs = store.get('organisations') || [];
  const o = orgs.find(o => o.id === orgId);
  return o ? o.name : 'Unknown Organisation';
}

/**
 * Count total offered quantity for a request.
 * @param {object} req
 * @returns {number}
 */
function totalOffered(req) {
  return (req.offers || []).reduce((sum, o) => sum + (o.quantity || 1), 0);
}

/**
 * Derive display status from offer count vs needed quantity.
 * @param {object} req
 * @returns {string}
 */
function derivedStatus(req) {
  // Honour explicit status if already fulfilled or cancelled
  if (req.status === 'fulfilled' || req.status === 'cancelled') return req.status;
  const offered = totalOffered(req);
  if (offered <= 0) return 'open';
  // Compare against first item quantity as proxy for need
  const needed = (req.items && req.items[0]) ? (req.items[0].quantity || 1) : 1;
  return offered >= needed ? 'fulfilled' : 'partial';
}

// ── Resource request card ─────────────────────────────────────────────────────

/**
 * Build a single resource-request card.
 *
 * @param {object} req
 * @param {object|null} currentUser
 * @param {Function} onUpdate - Called after a state mutation to re-render
 * @returns {HTMLElement}
 */
function buildRequestCard(req, currentUser, onUpdate) {
  const status = derivedStatus(req);
  const catLabel = CATEGORY_LABELS[req.category] || req.category || 'Other';
  const org = orgName(req.orgId);
  const offered = totalOffered(req);
  const needed = (req.items && req.items[0]) ? (req.items[0].quantity || '?') : '?';
  const unit   = (req.items && req.items[0]) ? (req.items[0].unit || '') : '';

  // Priority badge
  const priorityBadge = badge(
    (req.priority || 'medium').toUpperCase(),
    PRIORITY_COLOURS[req.priority] || 'info'
  );

  // Status badge
  const statusEl = statusBadge(status);

  const header = el('div', { class: 'vm-don-card-header' },
    el('div', { class: 'vm-don-card-title-row' },
      el('h3', { class: 'vm-don-card-title' }, req.title || 'Untitled Request'),
      el('div', { class: 'vm-don-card-badges' }, priorityBadge, statusEl)
    ),
    el('p', { class: 'vm-don-card-org' }, `📍 ${org} · ${catLabel}`)
  );

  const description = req.description
    ? el('p', { class: 'vm-don-card-desc' }, req.description)
    : null;

  // Items list
  const itemsList = el('ul', { class: 'vm-don-items-list' });
  (req.items || []).forEach(item => {
    itemsList.appendChild(
      el('li', null, `${item.name} — ${item.quantity} ${item.unit}`)
    );
  });

  // Progress bar
  const pct = Math.min(100, needed === '?' ? 0 : Math.round((offered / Number(needed)) * 100));
  const progressWrap = el('div', { class: 'vm-don-progress-wrap' },
    el('div', { class: 'vm-don-progress-bar' },
      el('div', { class: 'vm-don-progress-fill', style: `width:${pct}%` })
    ),
    el('span', { class: 'vm-don-progress-label' },
      `${offered} / ${needed} ${unit} offered (${pct}%)`
    )
  );

  // Deadline
  const deadlineEl = req.deadline
    ? el('p', { class: 'vm-don-deadline' }, `⏰ Deadline: ${req.deadline}`)
    : null;

  // Offer button — disabled if fulfilled/cancelled or not logged in
  const canOffer = currentUser && status !== 'fulfilled' && status !== 'cancelled';

  const offerBtn = el('button', {
    class: 'btn btn-primary',
    'aria-label': `Offer to help with ${req.title}`,
    disabled: !canOffer,
    onClick: canOffer ? () => {
      const requests = store.get('donationRequests') || [];
      const idx = requests.findIndex(r => r.id === req.id);
      if (idx === -1) return;

      const updated = { ...requests[idx] };
      updated.offers = [...(updated.offers || []), {
        userId   : currentUser.id,
        quantity : 1,
        note     : '',
        offeredAt: new Date().toISOString(),
      }];
      updated.status = derivedStatus(updated);

      const newRequests = [...requests];
      newRequests[idx] = updated;
      store.set('donationRequests', newRequests);

      showToast('Your offer has been recorded. Thank you!', 'success');
      onUpdate();
    } : null,
  }, status === 'fulfilled' ? '✅ Fulfilled' : '🤝 Offer to Help');

  const footer = el('div', { class: 'vm-don-card-footer' }, offerBtn);

  const card = el('div', { class: 'vm-card vm-don-card' },
    header,
    description,
    itemsList,
    progressWrap,
    deadlineEl,
    footer
  );

  return card;
}

// ── Create request form ───────────────────────────────────────────────────────

/**
 * Build the inline create-request form (resource type only).
 * Only callable when the current user owns a verified organisation.
 *
 * @param {object} currentUser
 * @param {object[]} verifiedOrgs - Orgs this user owns that are verified
 * @param {Function} onCreated
 * @returns {HTMLElement}
 */
function buildCreateForm(currentUser, verifiedOrgs, onCreated) {
  const wrap = el('div', { class: 'vm-card vm-don-create-form' });
  wrap.appendChild(el('h2', { class: 'vm-form-title' }, '📦 New Resource Request'));

  const errEl = el('p', {
    class: 'error-message',
    role: 'alert',
    id: 'don-create-error',
  });

  // Org selector
  const orgSelect = el('select', { class: 'vm-form-control', id: 'don-org', required: true });
  verifiedOrgs.forEach(o => orgSelect.appendChild(el('option', { value: o.id }, o.name)));

  // Title
  const titleInput = el('input', { type: 'text', class: 'vm-form-control',
    id: 'don-title', placeholder: 'e.g. Canned Food Drive', required: true });

  // Description
  const descInput = el('textarea', { class: 'vm-form-control', rows: 3,
    id: 'don-desc', placeholder: 'Describe what you need and why…' });

  // Category
  const catSelect = el('select', { class: 'vm-form-control', id: 'don-cat' });
  Object.entries(CATEGORY_LABELS).forEach(([v, t]) =>
    catSelect.appendChild(el('option', { value: v }, t))
  );

  // Item name, quantity, unit (single item for MVP simplicity)
  const itemNameInput = el('input', { type: 'text', class: 'vm-form-control',
    id: 'don-item', placeholder: 'Item name, e.g. Canned beans' });
  const itemQtyInput = el('input', { type: 'number', class: 'vm-form-control',
    id: 'don-qty', min: 1, value: 1, placeholder: 'Quantity' });
  const itemUnitInput = el('input', { type: 'text', class: 'vm-form-control',
    id: 'don-unit', placeholder: 'Unit, e.g. cans, kg, bags' });

  // Priority
  const prioritySelect = el('select', { class: 'vm-form-control', id: 'don-priority' });
  [['low','Low'],['medium','Medium'],['high','High'],['urgent','Urgent']].forEach(([v,t]) =>
    prioritySelect.appendChild(el('option', { value: v }, t))
  );

  // Deadline
  const deadlineInput = el('input', { type: 'date', class: 'vm-form-control', id: 'don-deadline' });

  function row(labelText, inputEl) {
    const lbl = el('label', { class: 'vm-form-label', for: inputEl.id }, labelText);
    return el('div', { class: 'form-group' }, lbl, inputEl);
  }

  const form = el('form', {
    novalidate: true,
    onSubmit: (e) => {
      e.preventDefault();
      errEl.textContent = '';

      const title = titleInput.value.trim();
      if (!title) {
        errEl.textContent = 'Title is required.';
        titleInput.focus();
        return;
      }
      const itemName = itemNameInput.value.trim();
      if (!itemName) {
        errEl.textContent = 'Item name is required.';
        itemNameInput.focus();
        return;
      }

      const newReq = {
        id         : `dr_${Date.now()}`,
        orgId      : orgSelect.value,
        type       : 'resource',
        title,
        description: descInput.value.trim(),
        category   : catSelect.value,
        items      : [{
          name    : itemName,
          quantity: parseInt(itemQtyInput.value, 10) || 1,
          unit    : itemUnitInput.value.trim() || 'units',
        }],
        priority   : prioritySelect.value,
        deadline   : deadlineInput.value || null,
        status     : 'open',
        offers     : [],
        createdAt  : new Date().toISOString(),
      };

      const requests = store.get('donationRequests') || [];
      store.set('donationRequests', [...requests, newReq]);
      showToast('Resource request published!', 'success');
      onCreated();
    },
  });

  form.appendChild(row('Organisation *', orgSelect));
  form.appendChild(row('Request Title *', titleInput));
  form.appendChild(row('Description', descInput));
  form.appendChild(row('Category', catSelect));
  form.appendChild(row('Item Name *', itemNameInput));
  form.appendChild(row('Quantity', itemQtyInput));
  form.appendChild(row('Unit', itemUnitInput));
  form.appendChild(row('Priority', prioritySelect));
  form.appendChild(row('Deadline', deadlineInput));
  form.appendChild(errEl);

  const submitBtn = el('button', { type: 'submit', class: 'btn btn-primary' }, '📤 Publish Request');
  const cancelBtn = el('button', {
    type: 'button', class: 'btn btn-secondary',
    onClick: () => wrap.remove(),
  }, '✕ Cancel');

  form.appendChild(el('div', { class: 'vm-form-btn-row' }, submitBtn, cancelBtn));
  wrap.appendChild(form);
  return wrap;
}

// ── Fundraising tab ───────────────────────────────────────────────────────────

/**
 * Build the fundraising tab content.
 * All financial figures are clearly marked as demo/simulated.
 *
 * @param {object[]} campaigns - Donation requests of type 'fundraising'
 * @returns {HTMLElement}
 */
function buildFundraisingTab(campaigns) {
  const wrap = el('div', { class: 'vm-don-fundraising-wrap' });

  // REQUIRED: prominent demo-only banner
  wrap.appendChild(
    el('div', { class: 'vm-demo-banner vm-demo-banner-payment', role: 'note' },
      el('span', { class: 'vm-demo-banner-icon' }, '💳'),
      el('div', null,
        el('strong', null, 'Demo only — no real payments are processed.'),
        el('br'),
        'In a live deployment, this would connect to a payment provider (e.g. Stripe, Paystack). ',
        'No card details are collected and no transactions occur.'
      )
    )
  );

  if (campaigns.length === 0) {
    wrap.appendChild(emptyState('💰', 'No fundraising campaigns',
      'Verified organisations can launch campaigns once real payment processing is configured.'));
    return wrap;
  }

  campaigns.forEach(c => {
    const target = c.targetAmount
      ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(c.targetAmount)
      : 'Open Goal';

    const card = el('div', { class: 'vm-card vm-don-campaign-card' },
      el('div', { class: 'vm-don-card-header' },
        el('h3', { class: 'vm-don-card-title' }, c.title || 'Campaign'),
        el('p',  { class: 'vm-don-card-org' },   `📍 ${orgName(c.orgId)}`)
      ),
      c.description ? el('p', { class: 'vm-don-card-desc' }, c.description) : null,
      el('p', { class: 'vm-don-campaign-target' }, `🎯 Target: ${target}`),
      el('div', { class: 'vm-don-card-footer' },
        el('button', {
          class: 'btn btn-primary',
          onClick: () => {
            // Show modal explaining demo state — no real payment
            showToast('Demo only: no real payment processed. In a live app, this would open the payment flow.', 'info');
          },
        }, '💰 Donate (Demo)')
      )
    );

    wrap.appendChild(card);
  });

  return wrap;
}

// ── Main render ───────────────────────────────────────────────────────────────

/**
 * Render the Donations & Fundraising view.
 *
 * @param {HTMLElement} container
 * @param {object} _params
 * @returns {Function} Cleanup function
 */
export default async function renderDonations(container, _params) {
  auth.requireAuth();

  const currentUser = auth.currentUser();
  if (!currentUser) return;

  let activeTab      = 'resources'; // 'resources' | 'fundraising'
  let showCreateForm = false;
  let filterCat      = 'all';

  function render() {
    container.innerHTML = '';

    // ── Page header ───────────────────────────────────────────────────────────
    container.appendChild(
      el('h1', { class: 'vm-page-title', style: 'margin-bottom:1.25rem;' }, '🎁 Donations & Fundraising')
    );

    // ── Tab bar ───────────────────────────────────────────────────────────────
    const tabBar = el('div', { class: 'vm-tab-bar', role: 'tablist' });
    const tabs = [
      { id: 'resources',   label: '📦 Resource Requests' },
      { id: 'fundraising', label: '💰 Fundraising'       },
    ];
    tabs.forEach(t => {
      const btn = el('button', {
        class: `vm-tab-btn${activeTab === t.id ? ' active' : ''}`,
        role: 'tab',
        'aria-selected': String(activeTab === t.id),
        onClick: () => { activeTab = t.id; showCreateForm = false; render(); },
      }, t.label);
      tabBar.appendChild(btn);
    });
    container.appendChild(tabBar);

    // ── Resource Requests tab ─────────────────────────────────────────────────
    if (activeTab === 'resources') {
      const allRequests = (store.get('donationRequests') || [])
        .filter(r => r.type !== 'fundraising');

      // Check if current user owns any verified orgs
      const orgs = store.get('organisations') || [];
      const verifiedOrgs = orgs.filter(o =>
        o.ownerId === currentUser.id && o.verificationStatus === 'verified'
      );

      // Create Request button (verified org owners only)
      const actionRow = el('div', { class: 'vm-page-actions-row' });
      if (verifiedOrgs.length > 0) {
        const createBtn = el('button', {
          class: 'btn btn-primary',
          onClick: () => { showCreateForm = !showCreateForm; render(); },
        }, showCreateForm ? '✕ Cancel' : '+ New Resource Request');
        actionRow.appendChild(createBtn);
      } else {
        actionRow.appendChild(
          el('p', { class: 'vm-muted-note' },
            '💡 Only verified organisations can create resource requests. ',
            el('a', { href: '#/organisations', class: 'vm-link' }, 'Verify your organisation →')
          )
        );
      }
      container.appendChild(actionRow);

      // Create form
      if (showCreateForm && verifiedOrgs.length > 0) {
        container.appendChild(
          buildCreateForm(currentUser, verifiedOrgs, () => {
            showCreateForm = false;
            render();
          })
        );
      }

      // Category filter
      const filterRow = el('div', { class: 'vm-filters-row' });
      const catSelect = el('select', {
        class: 'vm-filter-select',
        'aria-label': 'Filter by category',
        onChange: (e) => { filterCat = e.target.value; render(); },
      });
      [['all', 'All Categories'], ...Object.entries(CATEGORY_LABELS)].forEach(([v, t]) => {
        const opt = el('option', { value: v }, t);
        if (v === filterCat) opt.selected = true;
        catSelect.appendChild(opt);
      });
      filterRow.appendChild(el('label', { class: 'vm-filter-label' }, 'Category: ', catSelect));
      container.appendChild(filterRow);

      // Requests list
      const filtered = filterCat === 'all'
        ? allRequests
        : allRequests.filter(r => r.category === filterCat);

      if (filtered.length === 0) {
        container.appendChild(
          emptyState('📦', 'No resource requests',
            filterCat === 'all'
              ? 'No requests yet. Verified organisations can publish requests above.'
              : 'No requests in this category.')
        );
      } else {
        filtered.forEach(req => {
          container.appendChild(buildRequestCard(req, currentUser, render));
        });
      }
    }

    // ── Fundraising tab ───────────────────────────────────────────────────────
    if (activeTab === 'fundraising') {
      const campaigns = (store.get('donationRequests') || [])
        .filter(r => r.type === 'fundraising');
      container.appendChild(buildFundraisingTab(campaigns));
    }
  }

  render();
  return () => {};
}
