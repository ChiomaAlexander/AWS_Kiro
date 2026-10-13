# VolunteerMatch Platform – Requirements

## Context
Transforming the existing single-page matching demo into a multi-view community platform.
The existing `matcher.js` (28 tests) is preserved as the matching engine.
Stack: plain HTML + CSS + Vanilla JS ES Modules, localStorage persistence, no build step.

---

## Phase 1 — Must Work (MVP scope)

### FR-AUTH Authentication
- **FR-AUTH-1** A visitor can sign up with display name, unique username, email and password.
- **FR-AUTH-2** A signed-in user can log in with email+password or username+password.
- **FR-AUTH-3** Sessions persist across page refresh (localStorage token).
- **FR-AUTH-4** Duplicate usernames are rejected with a clear error at sign-up.
- **FR-AUTH-5** Invalid credentials show a specific error; the password field is never echoed.
- **FR-AUTH-6** Any user can sign out; session is cleared and they are redirected to landing.
- **FR-AUTH-7** Protected routes redirect unauthenticated visitors to `/auth`.
- **FR-AUTH-8** After first sign-in the user is directed through a one-page profile onboarding.

### FR-NAV Navigation
- **FR-NAV-1** Authenticated users see a persistent left sidebar on desktop (≥ 768 px).
- **FR-NAV-2** On mobile (< 768 px) a bottom tab bar or hamburger menu replaces the sidebar.
- **FR-NAV-3** The active route is highlighted in the nav.
- **FR-NAV-4** Nav links: Home/Feed, Opportunities, Organisations, Donations, Blood Donation, My Profile, Settings/Sign Out.
- **FR-NAV-5** Unauthenticated visitors see only the landing page with Log In / Sign Up.

### FR-PROFILE Individual Profile
- **FR-PROFILE-1** Each user has a profile page at `#/profile/:username`.
- **FR-PROFILE-2** Profile fields: avatar (initials fallback), display name, username, bio, location, skills, languages, availability, interests.
- **FR-PROFILE-3** A user can edit their own profile; they cannot edit others'.
- **FR-PROFILE-4** Skills and availability on the profile feed directly into the matching engine.
- **FR-PROFILE-5** Profile shows a count of volunteer tasks completed.

### FR-FEED Community Feed
- **FR-FEED-1** The feed shows posts from all users, newest first.
- **FR-FEED-2** A user can create a post with text and optional tags (skills used, event name).
- **FR-FEED-3** A user can like a post (toggle). Like count is displayed.
- **FR-FEED-4** A user can delete their own posts.
- **FR-FEED-5** The feed shows an empty state when no posts exist.

### FR-OPP Volunteer Opportunities
- **FR-OPP-1** Any authenticated user can create an opportunity with: name, description, required skills, date/time slot, volunteers needed, location, format (online/in-person/hybrid), category, application deadline.
- **FR-OPP-2** The opportunities list supports filtering by skill, category and format.
- **FR-OPP-3** Each opportunity has a detail page at `#/opportunities/:id`.
- **FR-OPP-4** Any authenticated user can apply to an opportunity they have not already applied to.
- **FR-OPP-5** The detail page shows a ranked volunteer list using the existing `rankVolunteers` algorithm.
- **FR-OPP-6** The creator can accept or decline individual applications from their own opportunity.
- **FR-OPP-7** Duplicate applications are blocked (a user cannot apply twice).
- **FR-OPP-8** Conflicting assignments (overlapping time slots) are flagged with a warning.
- **FR-OPP-9** When no eligible volunteers remain, an unfilled-roles warning is shown.
- **FR-OPP-10** The creator can close an opportunity; closed opportunities show "No longer accepting applications".

### FR-ORG Organisations
- **FR-ORG-1** Any authenticated user can create an organisation profile with: name, type, description, mission, contact, website, operating area, representative.
- **FR-ORG-2** An organisation has a verification status: Draft → Pending Review → Verified | Rejected | More Info Required.
- **FR-ORG-3** The creator can submit their organisation for review (moves Draft → Pending Review).
- **FR-ORG-4** A verified badge is shown only when status === 'verified'.
- **FR-ORG-5** The organisations list shows all orgs with their status badges.
- **FR-ORG-6** A sample admin user (seeded in sample data) can approve or reject organisations.
- **FR-ORG-7** An org cannot approve its own verification; status changes are gated by role check.

### FR-DON Donations & Resource Requests
- **FR-DON-1** Any authenticated user can browse donation/resource requests.
- **FR-DON-2** Verified organisations can create resource requests with: item, quantity, unit, priority, deadline, description, beneficiary.
- **FR-DON-3** Request statuses: Open, Partially Fulfilled, Fulfilled, Cancelled.
- **FR-DON-4** Any user can offer to fulfil a request (marks it as Partially Fulfilled or Fulfilled).
- **FR-DON-5** Financial fundraising shows a "Demo only — no real payments" banner clearly.
- **FR-DON-6** The donations list filters by category (food, water, clothing, medical, other).

### FR-BLOOD Blood Donation
- **FR-BLOOD-1** Any authenticated user can opt in as a blood donor with: blood group (optional), broad location, availability.
- **FR-BLOOD-2** A user can opt out / pause their donor participation at any time.
- **FR-BLOOD-3** Any user can submit a blood request with: blood group needed, hospital/facility, location, urgency, contact method.
- **FR-BLOOD-4** The blood section shows open requests with a basic compatibility filter (blood group).
- **FR-BLOOD-5** Donor contact details are never shown publicly — a "Reach Out" action sends an in-app note.
- **FR-BLOOD-6** Every blood request page shows a prominent disclaimer: "This tool does not replace professional medical advice or certified blood bank services."

---

## Phase 2 — Implement if core is stable
- Post comments
- Save / bookmark opportunities
- Application status notifications (in-app)
- Organisation member management

## Phase 3 — Clearly labelled "Coming Soon"
- Real Firebase backend
- Payment processing
- File upload for verification docs
- Email notifications
- Advanced admin panel

---

## Non-Functional Requirements

### NFR-1 Visual design
- Dark dusky theme per design tokens in `tech.md`.
- All components use CSS custom properties — no hardcoded colours.
- Responsive: functional on 320 px mobile through 1440 px desktop.

### NFR-2 Accessibility
- WCAG 2.1 AA intent: visible focus rings, sufficient contrast, ARIA labels, no colour-only status indicators.

### NFR-3 Performance
- Route transitions < 100 ms.
- Matching algorithm < 100 ms for 100 volunteers.

### NFR-4 Honesty
- Features not yet built must show a "Coming Soon" state — never pretend to work.
- Financial payment UI must be clearly labelled "Demo only".
- Blood matching disclaimer must be visible on every request.
- AI skill extraction must not claim to be active unless `window.__AI_API_KEY` is set.
