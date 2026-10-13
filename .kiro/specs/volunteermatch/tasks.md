# VolunteerMatch Platform – Implementation Tasks

Ordered by dependency. Complete phases in sequence; within a phase, steps marked [P] can proceed in parallel.

---

## Phase 0 – Foundation (do first, everything depends on this)

### T-P0-1 Extend data.js with full sample dataset
- Keep existing SKILLS, getSampleVolunteers(), getSampleTasks() — do not break existing tests
- Add 12 sample users with role, skills, availability, bloodDonor fields and DEMO_HASH passwords
- Add 4 sample organisations (verified, pending, draft, rejected)
- Add 8 sample feed posts
- Add 5 opportunities (referencing user ids and org ids)
- Add 4 donation requests
- Add 4 blood donor profiles + 3 blood requests
- Export: getSampleUsers(), getSampleOrgs(), getSamplePosts(), getSampleOpportunities(), getSampleDonations(), getSampleBloodDonors(), getSampleBloodRequests()

### T-P0-2 Implement src/store.js
- AppStore class with get/set/patch/subscribe/persist
- Loads from localStorage key `volunteerMatch_v2` on init, falls back to sample data
- saveToStorage() called after every mutation
- Export singleton `store`
- Write tests/store.test.js (get, set, patch, subscribe, persist, unknown-key graceful)

### T-P0-3 Implement src/auth.js
- signup(), login(), logout(), currentUser(), requireAuth() per design.md spec
- Session stored in `vm_session` localStorage key (separate from main store)
- Duplicate username check against store.get('users')
- Write tests/auth.test.js (all 6 cases in design.md)

### T-P0-4 Implement src/router.js
- Hash router: register(), navigate(), current()
- Pattern matching with :param extraction
- hashchange listener renders matched view into #view-root
- Calls teardown function from previous view before mounting new one
- Write tests/router.test.js (register/navigate, param extraction, auth guard)

### T-P0-5 Extend src/ui.js with platform helpers
- Keep all existing exports (renderRoster, renderTaskForm, renderResults)
- ADD: el(tag, attrs, ...children), text(str), badge(label, type), card(...children), avatar(user), emptyState(...), loadingState(), errorState(msg), statusBadge(status), comingSoon(featureName)
- JSDoc on every new export

---

## Phase 1 – Shell, Theme & Navigation

### T-P1-1 Rewrite style.css with dark theme
- Replace existing light theme entirely
- Implement all design tokens from tech.md as CSS custom properties
- Base styles: body, headings, links, inputs, buttons, focus rings
- Layout: .vm-layout (sidebar + main), .vm-sidebar, .vm-main, #view-root
- Component styles: .vm-card, .vm-badge, .vm-avatar, .vm-btn (primary/secondary/ghost/danger)
- Skill tag colours (dark variants of existing), status badge colours
- Result card tiers (dark variants: tier-high, tier-mid, tier-low, tier-ineligible)
- Responsive: sidebar hidden on mobile, bottom tab bar shown
- Keep all existing class names that tests or JS reference (.skill-matched, .skill-missing, .result-card, etc.) — restyle them, do not remove

### T-P1-2 Rewrite index.html for multi-view shell
- DOCTYPE, lang="en", viewport, title "VolunteerMatch"
- Link style.css
- Body: div.vm-layout → aside#sidebar + main#main-content → div#view-root
- No visible content in body — all rendered by JS
- Script: `<script type="module" src="src/app.js"></script>`

### T-P1-3 Implement src/components/nav.js
- mountNav(sidebarEl, bottomBarEl) — renders both nav variants
- Nav items array with icon (emoji), label, route
- Marks active item based on router.current()
- Listens to hashchange to update active state
- Mobile bottom bar: icon + label under each icon
- User avatar + displayName at bottom of sidebar
- Sign out button

### T-P1-4 Rewrite src/app.js as platform bootstrap
- Import store, auth, router, nav, all views, all sample data getters
- initStore(): load from localStorage or seed with sample data
- Register all routes (per design.md router section)
- mountNav(sidebarEl, bottomBarEl)
- router.start() — fire initial route
- Handle unauthenticated state: redirect to /landing

---

## Phase 2 – Auth & Profile [can partly parallel]

### T-P2-1 [P] Implement src/views/landing.js
- Hero: app name, tagline, "What is VolunteerMatch?" blurb
- Three feature columns: Volunteer, Organise, Donate
- CTA buttons: "Log In" → #/auth?mode=login, "Sign Up" → #/auth?mode=signup
- Stats row: "12 volunteers · 4 organisations · 5 opportunities"
- Footer: "Demo application — no real data stored externally"

### T-P2-2 [P] Implement src/views/auth.js
- Two modes: login and signup, toggled by query param or tab click
- Sign up form: displayName, username, email, password, confirm password
- Validation: all required, username alphanumeric+underscore, email format, password ≥ 8 chars, passwords match
- Login form: identifier (email or username), password
- On success: navigate to #/feed (or #/onboarding if new user)
- Error messages on failed validation or bad credentials
- "Back to Home" link

### T-P2-3 [P] Implement src/views/profile.js
- Load user by username param from store
- View mode: avatar, displayName, @username, bio, location, skills (tags), languages, availability, interests, post count
- If viewing own profile: show "Edit Profile" button → inline edit mode
- Edit mode: form with all fields, save → store.patch('users', id, delta)
- If user not found: error state "Profile not found"
- Onboarding flow: if `!user.onboarded`, show a simplified first-time setup form (bio + skills + availability), on save set onboarded=true

---

## Phase 3 – Feed & Opportunities

### T-P3-1 [P] Implement src/views/feed.js
- "Create Post" card at top: textarea + optional tag input + Post button
- Posts list, newest first
- Each post card: avatar, displayName, @username, timestamp, text, tags, like button (toggle), like count, delete button (own posts only)
- Empty state: "No posts yet — be the first to share!"
- Like action: store.patch('posts', id, { likes: [...] })
- Delete action: remove from store.get('posts'), store.set('posts', updated)

### T-P3-2 [P] Implement src/views/opportunities.js
- Filter bar: category select, format select, skills multi-select (or search)
- Opportunity cards: title, org badge, slot, required skills, volunteers needed/filled, category, format, status, "View Details" button
- "Create Opportunity" button → modal or inline form
- Create form: all fields from Opportunity model, validation
- On create: push to store.get('opportunities'), navigate to #/opportunities/:id
- Empty state when no results match filter

### T-P3-3 Implement src/views/opportunity-detail.js
- Load opportunity by id param
- Header: title, org badge, organiser name, slot, location, format, status
- Description section
- Required skills badges
- Applications section: list of applicants with status badges (creator sees accept/decline buttons)
- "Apply" button: adds application to opportunity.applications, disabled if already applied or opportunity closed
- Volunteer matching section (only shown to opportunity creator):
  - Uses rankVolunteers() from matcher.js with applicants as volunteers
  - Shows ranked list with scores, skill match, availability, explanation
  - Accept/Assign button for each eligible applicant

---

## Phase 4 – Organisations

### T-P4-1 Implement src/views/organisations.js
- Organisations list: org card with name, type, status badge, operating area, "View" link
- Filter by type and verification status
- "Create Organisation" button → inline form
- Create form: all Org fields, validation, creates with status 'draft'
- Org detail (can expand in-page or use modal):
  - All org fields
  - Verification status timeline: Draft → Pending → Verified/Rejected
  - "Submit for Review" button (only if status === 'draft' and current user is org owner)
  - Admin panel (only if currentUser.role === 'admin'): Approve / Reject / Request More Info buttons + note field
  - Verified badge only when status === 'verified'

---

## Phase 5 – Donations & Blood Donation

### T-P5-1 [P] Implement src/views/donations.js
- Two tabs: "Resource Requests" and "Fundraising"
- Resource Requests tab:
  - Filter by category
  - Request cards: title, org badge (verified only), category, items list, priority badge, deadline, status, "Offer to Help" button
  - "Create Request" button (only for verified orgs — otherwise show "Verify your organisation first")
  - Create form: all DonationRequest fields
  - Offer to Help: adds offer to request.offers, updates status to partial/fulfilled
- Fundraising tab:
  - Clearly prominent banner: "💳 Demo only — no real payments processed"
  - Sample fundraising campaigns displayed as cards
  - "Donate" button shows a modal: "This is a demonstration. In a live deployment, this would connect to a payment provider."

### T-P5-2 [P] Implement src/views/blood-donation.js
- Three sections: "Become a Donor", "Open Requests", "My Donor Profile"
- Become a Donor: opt-in form (blood group optional, location, active toggle)
  - If already a donor: shows current profile with edit/pause option
- Open Requests: blood request cards
  - Blood group, facility, location, urgency badge, required-by date
  - Compatibility indicator: ✅ Compatible / ❓ Unknown / ❌ Incompatible (based on stored bloodGroup)
  - "I Can Help" button → sends in-app note (stored in notifications), does NOT reveal donor details to requester
  - Each card footer: disclaimer text
- Submit Request button: form with all BloodRequest fields
- Prominent top banner: "⚕️ This tool does not replace medical advice or certified blood bank services. For urgent needs, contact your nearest hospital or blood bank immediately."

---

## Phase 6 – Settings & Polish

### T-P6-1 Implement src/views/settings.js
- Account section: change display name, email (demo — no real email change)
- Privacy section: toggle profile visibility, blood donor discoverability
- Danger zone: "Sign Out" button (calls auth.logout(), navigates to /landing)
- "Delete Account" — shows "Coming Soon" state
- "Export my data" — shows "Coming Soon" state

### T-P6-2 Polish pass
- Verify all routes work and nav active states update
- Check all empty states are rendered
- Check all "Coming Soon" placeholders are clearly labelled
- Ensure Reset Demo from original app still works (can be a link in Settings)
- Run vitest — all existing 28 tests must still pass; new tests must pass

---

## Phase 7 – Update Docs

### T-P7-1 Update DECISIONS.md
- ADR-010: Multi-view SPA with hash router
- ADR-011: AppStore singleton pattern
- ADR-012: Demo auth (localStorage) vs Firebase Auth (documented path)
- ADR-013: Dark theme design token approach

### T-P7-2 Update README.md
- New run instructions
- Feature list (implemented vs coming soon)
- Demo walkthrough
- How to enable Firebase (brief, documented path)
- Test command with portable Node path
