# VolunteerMatch – Requirements

## Overview
VolunteerMatch is a browser-based MVP that helps college-event organisers and nonprofit staff match volunteers to tasks. It runs entirely in the browser (no server, no cloud credentials) and uses local state plus `localStorage` for persistence.

---

## Functional Requirements

### FR-1 Volunteer Roster
- The system SHALL display a list of sample volunteers, each with:
  - Name, bio (one sentence)
  - Skills (array of tags, e.g. "first-aid", "photography", "spanish")
  - Weekly availability (list of time slots, e.g. "Saturday 9am–1pm")
  - Current task assignments (initially from sample data)

### FR-2 Task Entry
- The organiser SHALL be able to enter a new task with:
  - Task name / description (free text)
  - Required skills (multi-select or comma-separated tags)
  - Time slot (start time, end time, date or label)
  - Number of volunteers needed (integer ≥ 1)
- Fields SHALL be validated before submission (name required, at least one skill, valid time slot, volunteers ≥ 1).

### FR-3 Volunteer Ranking
- On task submission the system SHALL rank ALL volunteers by a deterministic scoring algorithm and display results immediately.
- Scoring algorithm (transparent, documented in UI):
  1. Skill match score: +10 per required skill the volunteer has (out of total required)
  2. Availability match: +20 if the volunteer's availability covers the task time slot
  3. Workload penalty: −5 per existing assignment the volunteer already carries
- Final score is the sum. Ties are broken alphabetically by name.
- The ranked list SHALL show: volunteer name, total score, skill match %, availability match (yes/no), current workload count, and a plain-English explanation ("Has 2 of 3 required skills; available; currently has 1 other assignment").

### FR-4 Match Explanation
- Each volunteer card in the ranked list SHALL show:
  - ✅ Matched skills (green)
  - ❌ Missing skills (red)
  - ⚠️ Availability conflict indicator if time slot conflicts
  - Current assignment count

### FR-5 Assignment
- The organiser SHALL be able to assign volunteers from the ranked list with an "Assign" button.
- The system SHALL enforce:
  - **No duplicate assignment**: a volunteer cannot be assigned to the same task twice.
  - **No overlap**: a volunteer cannot be assigned to two tasks with conflicting time slots.
- When a volunteer is assigned, the assignment is persisted to `localStorage` and the ranked list refreshes.
- The "Assign" button SHALL be disabled (greyed out) for volunteers who are ineligible due to overlap or duplicate.

### FR-6 Unfilled Roles
- After ranking, if fewer eligible volunteers exist than the number needed, the system SHALL display a warning: "X of Y volunteer slots could not be filled — no eligible volunteers remain."

### FR-7 Demo Reset
- A prominent "Reset Demo" button SHALL restore the application to the original sample scenario (10 volunteers, 3 pre-existing tasks) by clearing `localStorage` and reloading sample data.

### FR-8 Persistence
- All assignments made during a session SHALL be saved to `localStorage` under the key `volunteerMatch_state`.
- On page load the system SHALL restore state from `localStorage` if present, otherwise load sample data.

---

## Non-Functional Requirements

### NFR-1 Stack
- Plain HTML + CSS + vanilla JavaScript (ES Modules). No build step required.
- Single entry point: `index.html` runnable via Live Server or any static file server.

### NFR-2 Performance
- Ranking SHALL complete in < 100 ms for up to 100 volunteers.

### NFR-3 Readability
- Code SHALL be modular (separate files: `data.js`, `matcher.js`, `ui.js`, `app.js`) with JSDoc comments on every exported function.

### NFR-4 Accessibility
- All interactive controls SHALL have appropriate ARIA labels.
- Colour SHALL not be the only indicator of match/mismatch.

### NFR-5 AI Integration (Future Work)
- If a working AI API key is found at runtime (`window.__AI_API_KEY`), the task-entry form MAY send the natural-language description to a language model to extract structured skill tags.
- AI output MUST be validated against the known skill list before use.
- AI SHALL never determine eligibility or override the deterministic score.
- If no key is present, the feature is silently disabled. The UI SHALL indicate whether AI extraction is active.

---

## Out of Scope
- Authentication / login
- Payments
- Maps or geolocation
- Email / push notifications
- Cloud database
- Mobile-native app
