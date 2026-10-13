# VolunteerMatch Platform – Technical Design

## Architecture Overview

```
index.html          ← single HTML shell; #view-root swapped by router
style.css           ← all styles, dark theme tokens
src/
  app.js            ← bootstrap: init store → mount nav → start router
  router.js         ← hash router singleton
  store.js          ← AppStore singleton (localStorage-backed)
  auth.js           ← session helpers (no passwords stored)
  data.js           ← extended sample data (users, orgs, posts, opportunities, donations, blood)
  matcher.js        ← UNCHANGED pure scoring engine
  storage.js        ← UNCHANGED localStorage helpers (now used by store.js)
  ai.js             ← UNCHANGED optional AI extractor
  ui.js             ← shared DOM helpers: el(), tag(), badge(), card(), emptyState()
  components/
    nav.js          ← sidebar (desktop) + bottom bar (mobile)
    modal.js        ← accessible dialog
    toast.js        ← notification toasts
  views/
    landing.js      ← public landing page
    auth.js         ← sign up / log in forms
    feed.js         ← community feed
    opportunities.js        ← list + create
    opportunity-detail.js   ← detail + matching + apply/assign
    profile.js              ← individual profile view/edit
    organisations.js        ← list + create + verify workflow
    donations.js            ← resource requests + fundraising
    blood-donation.js       ← opt-in, request, match list
    settings.js             ← account settings, sign out
tests/
  matcher.test.js       ← UNCHANGED (28 passing)
  storage.test.js       ← UNCHANGED
  scenarios.test.js     ← UNCHANGED
  store.test.js         ← NEW: store get/set/patch/subscribe/persist
  auth.test.js          ← NEW: signup, login, session, duplicate username
  router.test.js        ← NEW: register, navigate, param parsing
```

---

## Data Models (localStorage store schema)

All stored under key `volunteerMatch_v2` as a single JSON object.

### User
```js
{
  id: 'u1',
  username: 'jordan_lee',
  email: 'jordan@example.com',
  passwordHash: 'DEMO_HASH_jordan', // demo only — never a real hash in production
  displayName: 'Jordan Lee',
  bio: 'Event management major...',
  avatar: null,           // null = show initials
  location: 'Lagos, Nigeria',
  skills: ['logistics', 'event-setup'],
  languages: ['English', 'Yoruba'],
  availability: [{ label: 'Sat 9am–1pm', start: '2026-10-17T09:00', end: '2026-10-17T13:00' }],
  interests: ['community events', 'education'],
  role: 'user',           // 'user' | 'admin'
  bloodDonor: false,
  createdAt: '2026-09-01T10:00',
  onboarded: true
}
```

### Organisation
```js
{
  id: 'org1',
  name: 'Bright Futures Orphanage',
  type: 'orphanage',      // orphanage | shelter | ngo | community | other
  description: '...',
  mission: '...',
  contact: 'info@brightfutures.ng',
  website: 'https://brightfutures.ng',
  operatingArea: 'Lagos, Nigeria',
  representative: 'u2',   // userId
  members: ['u2'],
  verificationStatus: 'verified', // draft|pending|verified|rejected|more-info|suspended
  verificationNote: '',
  createdAt: '2026-09-15T08:00',
  ownerId: 'u2'
}
```

### Post (feed)
```js
{
  id: 'p1',
  authorId: 'u1',
  text: 'Just finished the campus food drive!',
  tags: ['fundraising', 'community'],
  likes: ['u2', 'u3'],   // array of userIds who liked
  createdAt: '2026-10-10T14:30'
}
```

### Opportunity (extends original Task model)
```js
{
  id: 'opp1',
  title: 'Food Bank Sorting Shift',
  description: '...',
  organiserId: 'u2',      // userId of creator
  orgId: 'org1',          // optional org affiliation
  requiredSkills: ['logistics', 'catering'],
  slot: { label: 'Sat Oct 17, 9am–1pm', start: '2026-10-17T09:00', end: '2026-10-17T13:00' },
  volunteersNeeded: 4,
  assignedVolunteers: [],
  location: 'Lagos Food Bank, Victoria Island',
  format: 'in-person',    // in-person | online | hybrid
  category: 'food-security', // food-security|education|health|environment|community|other
  deadline: '2026-10-15T23:59',
  status: 'open',         // open | closed | cancelled
  applications: [
    { userId: 'u3', status: 'submitted', appliedAt: '2026-10-11T09:00' }
  ]
}
```
Application statuses: `submitted | under-review | accepted | declined | withdrawn`

### DonationRequest
```js
{
  id: 'dr1',
  orgId: 'org1',
  type: 'resource',       // resource | fundraising
  title: 'Canned Food Drive',
  description: '...',
  category: 'food',       // food|water|clothing|medical|education|hygiene|other
  items: [{ name: 'Canned beans', quantity: 200, unit: 'cans' }],
  priority: 'high',       // low | medium | high | urgent
  deadline: '2026-10-31',
  status: 'open',         // open | partial | fulfilled | cancelled
  offers: [
    { userId: 'u4', quantity: 50, note: 'Dropping off Saturday', offeredAt: '...' }
  ],
  createdAt: '2026-10-01T08:00'
}
```

### BloodDonorProfile
```js
{
  userId: 'u6',
  bloodGroup: 'O+',       // A+|A-|B+|B-|AB+|AB-|O+|O- or null
  location: 'Abuja, Nigeria',
  active: true,
  lastUpdated: '2026-10-01'
}
```

### BloodRequest
```js
{
  id: 'br1',
  requesterId: 'u7',
  bloodGroup: 'A+',       // or null = "any"
  facility: 'Lagos University Teaching Hospital',
  location: 'Lagos, Nigeria',
  urgency: 'urgent',      // routine | urgent | critical
  requiredBy: '2026-10-18T18:00',
  contactMethod: 'In-app message only',
  status: 'open',         // open | matched | fulfilled | cancelled
  verifiedByAdmin: false,
  createdAt: '2026-10-13T08:00'
}
```

### Session (not in main store — separate localStorage key `vm_session`)
```js
{ userId: 'u1', token: 'demo_token_u1', expiresAt: null }
```

---

## Router Design (src/router.js)

```js
// Pattern matching: /opportunities/:id → params = { id: '...' }
// Hash format: #/feed, #/opportunities/opp1, #/profile/jordan_lee

router.register('/landing',             views.landing)
router.register('/auth',                views.auth)
router.register('/feed',                views.feed)
router.register('/opportunities',       views.opportunities)
router.register('/opportunities/:id',   views.opportunityDetail)
router.register('/profile/:username',   views.profile)
router.register('/organisations',       views.organisations)
router.register('/donations',           views.donations)
router.register('/blood-donation',      views.bloodDonation)
router.register('/settings',            views.settings)
```

Unauthenticated: all routes except `/landing` and `/auth` redirect to `/landing`.
Unknown route: redirect to `/feed` (auth) or `/landing` (unauth).

---

## Store Design (src/store.js)

```js
// Initial state shape
{
  users: [],
  currentUserId: null,
  organisations: [],
  posts: [],
  opportunities: [],
  donationRequests: [],
  bloodDonors: [],
  bloodRequests: [],
  notifications: []
}
```

`store.patch('opportunities', 'opp1', { status: 'closed' })` — finds by id, merges delta.
`store.subscribe('opportunities', fn)` — fn called with new array on any change.

---

## Auth Design (src/auth.js)

Demo-only: passwords stored as `DEMO_HASH_<username>` — documents Firebase Auth as the real solution.

```js
auth.signup({ username, email, password, displayName })
  → { ok: true, user } | { ok: false, error: string }

auth.login({ identifier, password })   // identifier = email or username
  → { ok: true, user } | { ok: false, error: string }

auth.logout()
auth.currentUser()   // reads vm_session, returns User or null
auth.requireAuth()   // redirects to /landing if not logged in
```

---

## Navigation Design (src/components/nav.js)

Desktop sidebar (≥ 768 px): fixed left, 240 px wide.
Mobile (< 768 px): bottom tab bar with icons, labels hidden except active.

Nav items:
```
🏠 Home         → #/feed
🔍 Opportunities → #/opportunities
🏢 Organisations → #/organisations
🎁 Donations    → #/donations
🩸 Blood Donation → #/blood-donation
👤 My Profile   → #/profile/:currentUsername
⚙️  Settings    → #/settings
```

Logo / app name at top of sidebar. Avatar + username at bottom.

---

## UI Helpers (src/ui.js — extended)

```js
el(tag, attrs, ...children)   // create element with attrs and children
text(str)                     // createTextNode
badge(label, type)            // skill-tag, status-badge, verified-badge
card(children)                // .vm-card wrapper
avatar(user)                  // initials circle or img
emptyState(icon, title, body, actionLabel, actionFn)
loadingState()
errorState(message)
statusBadge(status)           // verified|pending|draft|rejected colours
comingSoon(featureName)       // clearly-labelled coming-soon placeholder
```

---

## Dark Theme Design System

```css
/* Layout */
body { background: var(--bg-main); color: var(--text-main); }
.vm-sidebar { background: var(--bg-secondary); border-right: 1px solid var(--border); }
.vm-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; }

/* Accent glow (restrained — only on primary CTA buttons and active nav) */
.btn-primary { background: var(--accent); box-shadow: 0 0 12px rgba(139,124,255,0.25); }
.btn-primary:hover { box-shadow: 0 0 20px rgba(139,124,255,0.45); }

/* Status colours */
.status-verified  { color: var(--success); }
.status-pending   { color: var(--warning); }
.status-rejected  { color: var(--danger); }
.status-draft     { color: var(--text-muted); }
```

---

## Matching Integration

The existing `rankVolunteers(volunteers, task, allTasks)` from `matcher.js` is used in `opportunity-detail.js`:
- `volunteers` = all users who have applied, converted to the Volunteer shape (skills, availability, assignments)
- `task` = the opportunity converted to the Task shape
- `allTasks` = user's other accepted opportunities (to detect conflicts)

The MatchResult is rendered with the same ✅/❌ skill tags and score breakdown already working.

---

## Sample Data Scale (src/data.js extended)

| Collection | Count | Notes |
|------------|-------|-------|
| users | 12 | 1 admin, 1 org rep, 10 volunteers — passwords as DEMO_HASH_<username> |
| organisations | 4 | 1 verified, 1 pending, 1 draft, 1 rejected |
| posts | 8 | across different users |
| opportunities | 5 | mix of open, closed, different categories |
| donationRequests | 4 | food x2, medical x1, clothing x1 |
| bloodDonors | 4 | varied blood groups |
| bloodRequests | 3 | open, matched, fulfilled |

---

## Test Coverage (new tests)

| File | Tests |
|------|-------|
| tests/store.test.js | get, set, patch, subscribe, persist round-trip, unknown key |
| tests/auth.test.js | signup success, duplicate username, login by email, login by username, wrong password, logout clears session |
| tests/router.test.js | register + navigate, param extraction, unknown route redirect, auth guard |
