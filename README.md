# VolunteerMatch 🤝

A browser-based community platform for volunteer matching, organisation verification, resource donations, and blood-donation coordination. Built for the AWS Community Kiro AI-DLC challenge.

Runs entirely in the browser — no server, no cloud credentials, no build step required.

---

## Quick Start

**Run the app (no Node needed):**
- Right-click `index.html` in VS Code → **Open with Live Server**, or
- Run: `python -m http.server 5500` then open `http://localhost:5500`

**Run tests:**
```
d:\chio_codes\node-portable\node-v20.18.0-win-x64\node.exe node_modules\vitest\vitest.mjs run
```
Or if Node is in your PATH: `npm test`

Expected: **6 test files · 73 tests · 0 failures**

---

## Demo Login

Sign up as a new user, or log in with any sample account using password `demo`:

| Username | Role | Notes |
|----------|------|-------|
| `admin` | Admin | Can approve/reject organisation verification |
| `jordan_lee` | Volunteer | Has existing task assignments |
| `amaka_obi` | Org rep | Owner of Bright Futures Orphanage (verified) |
| `chris_wang` | Volunteer | Owner of Lagos Food Bank (pending verification) |
| `sam_okafor` | Volunteer | Photographer / social media |

---

## Features

### ✅ Implemented

| Feature | Description |
|---------|-------------|
| **Dark UI** | Dusky charcoal/navy theme with violet/teal accents, design tokens throughout |
| **Multi-view SPA** | Hash-based router, 10 views, persistent sidebar nav, mobile bottom bar |
| **Authentication** | Sign up, log in (username or email), sessions, protected routes, onboarding |
| **Community Feed** | Create posts, like/unlike, delete own posts, relative timestamps |
| **Volunteer Opportunities** | Browse/filter, create, apply, accept/decline applicants, close |
| **Volunteer Matching** | Deterministic scoring (+10/skill, +20/available, -5/workload), conflict/duplicate detection, unfilled-role warnings |
| **Organisation Profiles** | Create, verification workflow (Draft→Pending→Verified/Rejected), admin approve/reject |
| **Donations** | Resource requests (create, offer to help, progress tracking), fundraising demo tab |
| **Blood Donation** | Donor opt-in, blood request submission, compatibility filter, privacy-safe contact |
| **Persistence** | All state saved to `localStorage` (`volunteerMatch_v2`), restored on reload |
| **Reset Demo** | Settings → Danger Zone → Reset Demo restores original sample data |

### 🚧 Coming Soon (clearly labelled in UI)

- Real Firebase backend (Auth + Firestore + Storage)
- Payment processing (Stripe / Paystack integration)
- File uploads for org verification documents
- Email notifications
- Post comments
- Advanced admin panel with audit log

---

## Matching Algorithm

Each volunteer is scored against an opportunity using three components:

| Component | Points | Rule |
|-----------|--------|------|
| Skill match | +10 per skill | For each required skill the volunteer has |
| Availability | +20 | If any of the volunteer's slots overlaps the task slot |
| Workload penalty | −5 per assignment | For each task already assigned |

**Total = skill score + availability score + workload penalty**

Ties broken alphabetically. Volunteers flagged ineligible (duplicate or conflict) have their Assign button disabled — the score is still shown for transparency.

---

## Architecture

```
index.html              ← Single HTML shell; #view-root swapped by router
style.css               ← Full dark theme; CSS custom properties only

src/
  app.js                ← Bootstrap: init store → register routes → mount nav → start router
  router.js             ← Hash router (register, navigate, :param extraction, auth guard)
  store.js              ← AppStore singleton (get/set/patch/subscribe, localStorage-backed)
  auth.js               ← Session helpers (signup, login, logout, requireAuth)
  data.js               ← 12 users, 4 orgs, 8 posts, 5 opportunities, 4 donations, 4 donors, 3 requests
  matcher.js            ← Pure scoring engine (unchanged from MVP)
  storage.js            ← Low-level localStorage helpers
  ai.js                 ← Optional AI skill extractor (disabled without API key)
  ui.js                 ← Shared DOM helpers + original renderRoster/renderResults
  components/
    nav.js              ← Sidebar + mobile bottom bar
    modal.js            ← Accessible dialog (focus trap, Escape key)
    toast.js            ← Auto-dismissing notifications
  views/
    landing.js          ← Public landing page
    auth.js             ← Sign up / log in
    feed.js             ← Community feed
    opportunities.js    ← Opportunity list + create
    opportunity-detail.js ← Detail, apply, match, assign
    profile.js          ← Individual profile + edit + onboarding
    organisations.js    ← Org list, create, verification workflow
    donations.js        ← Resource requests + fundraising (demo)
    blood-donation.js   ← Donor opt-in, requests, compatibility, disclaimer
    settings.js         ← Account settings, sign out, reset demo

tests/
  matcher.test.js       ← 21 tests (scoring, ranking, slot overlap)
  scenarios.test.js     ← 4 tests (unfilled roles, duplicates, conflicts)
  storage.test.js       ← 3 tests (localStorage round-trip)
  store.test.js         ← 13 tests (get/set/patch/subscribe/persist/reset)
  auth.test.js          ← 17 tests (signup, login, session, logout)
  router.test.js        ← 15 tests (matching, params, auth guard, teardown)
```

---

## Firebase Migration Path

The app is structured for a straightforward Firebase drop-in. See `DECISIONS.md` ADR-012 for the full migration steps:

1. Add Firebase SDK via CDN `<script type="module">` import
2. Replace `auth.signup/login/logout` with Firebase Auth methods
3. Replace `vm_session` token with `onAuthStateChanged`
4. Move store collections to Firestore with Security Rules
5. Move file uploads to Firebase Storage with private access rules

---

## Design Tokens

All colours defined as CSS custom properties on `:root` in `style.css`:

```css
--bg-main: #0B0D14       /* Main background */
--bg-secondary: #111522  /* Sidebar, secondary surfaces */
--bg-card: #171C2B       /* Cards */
--accent: #8B7CFF        /* Primary accent (violet) */
--accent-2: #42D6C5      /* Secondary accent (teal) */
--text-main: #F3F4FA     /* Body text */
--text-muted: #A3A9BB    /* Secondary text */
```

---

## Safety Notes

- **Blood donation**: Disclaimer shown on every render. Compatibility filter is for display only — medical confirmation required. Donor contact details are never exposed.
- **Donations/Fundraising**: "Demo only — no real payments" banner is always visible on the fundraising tab.
- **Organisation verification**: Status is read from the store, never from URL params or client-submitted values. Admin actions gated by `user.role === 'admin'` check.
- **Passwords**: Stored as `DEMO_HASH_<username>` (demo only). See ADR-012 for Firebase Auth migration.

---

## Known Limitations

- Single-user (no multi-user sync — localStorage is per browser)
- Demo passwords are not cryptographically secure (by design, for this demo)
- No file upload for org verification documents (coming soon)
- Blood compatibility filter is simplified (O- universal donor simplified — real compatibility requires full crossmatch)
- No real-time notifications (in-app notification objects stored but no push delivery)
