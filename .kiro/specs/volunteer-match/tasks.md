# VolunteerMatch – Implementation Tasks

Tasks are ordered by dependency. Complete them in sequence.

---

## Phase 1 – Scaffold & Sample Data

### T-01 Project scaffold
- Create `index.html`, `style.css`, `src/`, `tests/` directories.
- `index.html` loads `src/app.js` as `type="module"`.
- Add `package.json` with `vitest` as dev dependency and a `test` script (`vitest run`).
- Add `.gitignore` (node_modules).

### T-02 Sample data (src/data.js)
- Export `SKILLS` catalogue (15 tags).
- Export `getSampleVolunteers()` → array of 10 Volunteer objects.
- Export `getSampleTasks()` → array of 3 Task objects with some volunteers pre-assigned.
- Each object matches the data model in design.md exactly.

---

## Phase 2 – Core Logic

### T-03 Slot overlap utility (src/matcher.js)
- Export `slotOverlaps(slotA, slotB)` — pure function, no DOM.
- Export `volunteerHasConflict(volunteer, task, allTasks)` — checks existing assignments.

### T-04 Scoring function (src/matcher.js)
- Export `scoreVolunteer(volunteer, task, allTasks)` → MatchResult.
- Implements the three-component score from design.md.
- Sets `isDuplicate` and `conflictingTask` flags.
- Generates `explanation` string.

### T-05 Ranking function (src/matcher.js)
- Export `rankVolunteers(volunteers, task, allTasks)` → MatchResult[].
- Sorted descending by score, then alphabetically by name for ties.

---

## Phase 3 – Persistence

### T-06 Storage helpers (src/storage.js)
- Export `saveState`, `loadState`, `clearState` as described in design.md.

---

## Phase 4 – UI

### T-07 CSS (style.css)
- Two-column layout (roster | task panel) using CSS Grid.
- CSS custom properties for colour palette (primary, success, danger, warning, muted).
- Volunteer card, result card, skill tag, score badge styles.
- Responsive: single column below 700 px.
- Accessible focus rings, sufficient contrast.

### T-08 Volunteer roster panel (src/ui.js)
- Export `renderRoster(volunteers, tasks, container)`.
- Each card shows: name, bio, skill tags, availability labels, current assignments.

### T-09 Task form (src/ui.js)
- Export `renderTaskForm(skills, onSubmit, container)`.
- Fields: task name (text), required skills (checkbox group), time slot start/end (datetime-local), volunteers needed (number).
- Client-side validation on submit; shows inline error messages.
- "AI extraction" placeholder badge if `AI_ENABLED`.

### T-10 Results panel (src/ui.js)
- Export `renderResults(results, task, onAssign, container)`.
- Shows ranked list with score, explanation, ✅/❌ skill tags, availability indicator.
- "Assign" button disabled for duplicates and conflicts; shows reason on hover (title attribute).
- Shows unfilled-role warning if applicable.

### T-11 App orchestration (src/app.js)
- Loads state from localStorage or sample data.
- Wires task form submit → `rankVolunteers` → `renderResults`.
- Wires Assign button → mutates state → `saveState` → re-render.
- Wires Reset Demo → `clearState` → reload sample data → full re-render.
- Exports nothing; self-executing module.

---

## Phase 5 – AI Integration (optional / gracefully disabled)

### T-12 AI extractor (src/ai.js)
- Checks `window.__AI_API_KEY` on module load.
- Exports `AI_ENABLED` boolean and `extractSkills(description, knownSkills)`.
- All errors caught; never throws.
- Unit-testable with a mocked fetch.

---

## Phase 6 – Tests

### T-13 Matcher unit tests (tests/matcher.test.js)
- `slotOverlaps`: adjacent, overlapping, contained, same, non-overlapping cases.
- `scoreVolunteer`: full match, partial match, no skills, unavailable, with workload.
- `rankVolunteers`: tie-breaking by name, correct order.

### T-14 Conflict & duplicate tests (tests/matcher.test.js continued)
- `volunteerHasConflict`: returns false when no conflict, true when overlap exists.
- `isDuplicate` flag set correctly when volunteer already assigned to task.

### T-15 Unfilled roles test (tests/scenarios.test.js)
- Scenario: task needs 5 volunteers, only 2 eligible → unfilledCount === 3.

### T-16 Storage tests (tests/storage.test.js)
- Round-trip save/load.
- clearState removes item.
- loadState returns null when nothing stored.

---

## Phase 7 – Polish & Docs

### T-17 README.md
- How to run (`npx serve .` or Live Server).
- How to run tests (`npx vitest run`).
- Scoring algorithm explanation.
- AI integration notes (disabled by default, how to enable).
- Screenshot or ASCII mockup.

### T-18 Final verification
- Run `npx vitest run` → all tests pass.
- Open `index.html` via Live Server; manually verify:
  - Roster displays correctly.
  - Task form validates.
  - Ranking appears after submit.
  - Assign button works; duplicate/conflict prevented.
  - Unfilled warning shows.
  - Reset Demo restores sample data.
