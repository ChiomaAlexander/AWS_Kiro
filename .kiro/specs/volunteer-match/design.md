# VolunteerMatch – Technical Design

## Architecture

```
index.html          ← entry point, imports app.js
src/
  data.js           ← sample volunteers, tasks, skills catalogue
  matcher.js        ← pure scoring/ranking functions (no DOM)
  storage.js        ← localStorage read/write helpers
  ui.js             ← DOM builders, event listeners, render functions
  app.js            ← orchestrates data → match → render lifecycle
  ai.js             ← optional AI skill extractor (gracefully disabled)
tests/
  matcher.test.js   ← unit tests (Vitest, no build needed in browser mode)
  storage.test.js
style.css           ← single stylesheet, CSS custom properties for theming
```

No bundler. All `<script type="module">` imports. Works with VS Code Live Server or `npx serve .`.

---

## Data Models

### Volunteer
```js
{
  id: "v1",                          // string, unique
  name: "Jordan Lee",
  bio: "Nursing student, CPR certified.",
  skills: ["first-aid", "cpr", "spanish"],
  availability: [                    // array of Slot objects
    { label: "Sat 9am–1pm", start: "2026-10-17T09:00", end: "2026-10-17T13:00" }
  ],
  assignments: ["t1"]                // task IDs currently assigned
}
```

### Task
```js
{
  id: "t1",                          // string, unique
  name: "First Aid Station",
  description: "Staff the first aid tent.",
  requiredSkills: ["first-aid", "cpr"],
  slot: { label: "Sat 9am–1pm", start: "2026-10-17T09:00", end: "2026-10-17T13:00" },
  volunteersNeeded: 2,
  assignedVolunteers: ["v1"]         // volunteer IDs assigned
}
```

### MatchResult
```js
{
  volunteer: Volunteer,
  score: 42,
  skillScore: 20,
  availabilityScore: 20,
  workloadPenalty: -5,               // negative value
  matchedSkills: ["first-aid"],
  missingSkills: ["cpr"],
  availabilityMatch: true,
  conflictingTask: null,             // Task | null
  isDuplicate: false,
  explanation: "Has 1 of 2 required skills; available; 1 existing assignment."
}
```

---

## Scoring Algorithm (matcher.js)

```
scoreVolunteer(volunteer, task, allTasks):
  1. skillScore     = (matchedSkills.length / task.requiredSkills.length) * 10 * task.requiredSkills.length
                    → +10 per matched skill
  2. availScore     = slotOverlaps(volunteer.availability, task.slot) ? +20 : 0
  3. workloadPenalty = volunteer.assignments.length * -5
  4. totalScore     = skillScore + availScore + workloadPenalty

  Eligibility flags (do NOT change score, only disable Assign button):
  - isDuplicate: volunteer.assignments.includes(task.id)
  - hasConflict: any existing assigned task's slot overlaps task.slot
```

`slotOverlaps(slots, targetSlot)`: returns true if ANY slot in `slots` overlaps `targetSlot`.
Two slots overlap when `slot.start < target.end && slot.end > target.start`.

`rankVolunteers(volunteers, task, allTasks)`: maps → sorts descending by score, then alphabetically by name for equal scores.

---

## UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│  VolunteerMatch          [Reset Demo]                        │
├─────────────────────────┬────────────────────────────────────┤
│  Volunteer Roster       │  New Task / Task Results           │
│  ┌───────────────────┐  │  ┌──────────────────────────────┐  │
│  │ Jordan Lee        │  │  │ Task Name: [____________]    │  │
│  │ Skills: first-aid │  │  │ Skills:    [tag selector]    │  │
│  │ Avail: Sat 9–1    │  │  │ Time slot: [____________]    │  │
│  │ Assigned: t1      │  │  │ # needed:  [____]            │  │
│  └───────────────────┘  │  │ [Find Volunteers]            │  │
│  …                      │  └──────────────────────────────┘  │
│                         │  ─── Results ───                   │
│                         │  ⚠ 1 of 2 slots unfilled          │
│                         │  ┌──────────────────────────────┐  │
│                         │  │ #1 Jordan Lee   Score: 35    │  │
│                         │  │ ✅first-aid ❌cpr  Avail: ✅  │  │
│                         │  │ "Has 1 of 2 skills; avail."  │  │
│                         │  │ [Assign]                     │  │
│                         │  └──────────────────────────────┘  │
└─────────────────────────┴────────────────────────────────────┘
```

---

## State Management

- Single `AppState` object in `app.js`:
  ```js
  { volunteers: [...], tasks: [...], currentTask: null, results: [] }
  ```
- Every mutation calls `saveState()` (writes to localStorage) then `render()` (full re-render).
- No virtual DOM / framework. Direct DOM manipulation is fine at this scale.

---

## Persistence (storage.js)

```js
const KEY = "volunteerMatch_state";
export function saveState(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
export function loadState()      { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
export function clearState()     { localStorage.removeItem(KEY); }
```

---

## AI Skill Extractor (ai.js) — Optional

- Checks `window.__AI_API_KEY` on load; sets `AI_ENABLED = true/false`.
- `extractSkills(description, knownSkills)`:
  - POSTs to OpenAI `/v1/chat/completions` with a prompt asking for a JSON array of skill tags.
  - Validates each returned tag against `knownSkills`; discards unknowns.
  - Returns `{ skills: string[], source: "ai" | "manual" }`.
- If the API call fails, returns `{ skills: [], source: "manual" }` and logs a warning.
- UI shows a small badge "✨ AI-extracted" when `source === "ai"`.

---

## Testing Strategy

Framework: **Vitest** (zero-config, runs in Node without a browser).

| Test file | What it tests |
|-----------|---------------|
| `tests/matcher.test.js` | scoreVolunteer, slotOverlaps, rankVolunteers |
| `tests/storage.test.js` | saveState / loadState round-trip (uses jsdom) |
| `tests/scenarios.test.js` | Full demo scenario: availability conflict, duplicate, unfilled roles |

Run: `npx vitest run` (one-shot, no watch mode needed for demo).

---

## Sample Data (data.js)

10 volunteers × 5 distinct skill areas:
- first-aid, cpr, spanish, photography, social-media, logistics, sound-tech, event-setup, catering, fundraising

3 pre-existing tasks (used as initial state):
- "Registration Desk" – logistics, event-setup – Sat 9am–1pm – needs 2
- "Social Media Coverage" – photography, social-media – Sat 10am–4pm – needs 1
- "Welcome Ceremony" – sound-tech, spanish – Sat 9am–11am – needs 2

---

## Decisions Deferred
- Skill taxonomy management (add/remove skills) → future work
- Organiser login → future work
- Email confirmation → future work
- AI integration (documented in ai.js, disabled by default) → future work
