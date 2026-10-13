# VolunteerMatch 🤝

A browser-based MVP that helps college-event organisers and nonprofit staff match volunteers to tasks. It runs entirely in the browser — no server, no cloud credentials required — and uses localStorage for persistence across page refreshes.

---

## Prerequisites

| Tool | Required for |
|------|-------------|
| Any modern browser (Chrome, Firefox, Edge, Safari) | Running the app |
| Node.js 18+ | Running the test suite |
| VS Code Live Server extension _or_ `npx serve` | Serving the app locally |

---

## How to Run the App

**Option A — VS Code Live Server (easiest):**
1. Open the project folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.

**Option B — npx serve:**
```bash
npx serve .
```
Then open the URL printed in the terminal (usually `http://localhost:3000`).

> The app does **not** need a server to work — you can open `index.html` directly in
> Chrome or Edge by double-clicking it. Firefox may block ES Module imports from
> `file://` URLs, so using a local server is recommended.

---

## How to Run Tests

```bash
npm install        # installs Vitest and jsdom (one-time)
npm test           # runs the full test suite once
```

Expected output: all tests pass with 0 failures.

---

## Scoring Algorithm

Each volunteer is scored against a task using three components:

| Component | Points | Rule |
|-----------|--------|------|
| Skill match | +10 per skill | For each required skill the volunteer has |
| Availability | +20 | If any of the volunteer's slots overlaps the task slot |
| Workload penalty | −5 per assignment | For each task already assigned to the volunteer |

**Total score = skill score + availability score + workload penalty**

Ties are broken alphabetically by volunteer name (A → Z).

Volunteers are flagged **ineligible** (Assign button disabled) when:
- They are already assigned to this exact task (duplicate prevention).
- They are already assigned to a different task whose time slot overlaps (conflict prevention).

---

## How to Use the Demo

1. **Load the page** — ten sample volunteers appear on the left with their skills and availability.
2. **Enter a task** — fill in the name, description, required skills (checkboxes), time slot, and number of volunteers needed, then click **Find Volunteers**.
3. **Read the ranked list** — every volunteer is scored and ranked. Green border = strong match; amber = partial; grey = weak; red = ineligible.
4. **Check the explanation** — each card shows matched skills (✅), missing skills (❌), availability, workload, and a plain-English summary.
5. **Assign a volunteer** — click **Assign** on any eligible card. The roster updates immediately and the results re-rank.
6. **See unfilled roles** — if not enough eligible volunteers exist, an amber warning shows how many slots cannot be filled.
7. **Reset the demo** — click **↺ Reset Demo** in the header to restore the original 10 volunteers and 3 tasks.
8. **Refresh the page** — assignments are saved to localStorage and restored automatically.

---

## AI Integration

AI skill extraction is **disabled by default**. No API key is needed to run the app.

To enable it at runtime (in the browser console):
```js
window.__AI_API_KEY = 'sk-...your-openai-key...';
```
Then reload the page. When active, an **Extract Skills from Description** button appears in the task form. It calls the OpenAI `gpt-4o-mini` model and pre-checks matching skill boxes. AI output is validated against the known skills list — tags not in the list are discarded. **AI never overrides the deterministic scoring algorithm.**

See `DECISIONS.md` (ADR-006) for the full design rationale.

---

## File Structure

```
volunteer-match/
├── index.html              # App entry point — open this in a browser
├── style.css               # All styles (CSS custom properties + component rules)
├── package.json            # Node scripts + Vitest devDependencies
├── vitest.config.js        # Vitest config (jsdom environment for localStorage)
├── DECISIONS.md            # Architecture decision records
├── README.md               # This file
│
├── src/
│   ├── data.js             # SKILLS catalogue + getSampleVolunteers/getSampleTasks
│   ├── matcher.js          # Pure scoring logic: slotOverlaps, scoreVolunteer, rankVolunteers
│   ├── storage.js          # localStorage helpers: saveState, loadState, clearState
│   ├── ai.js               # Optional OpenAI skill extractor (degrades gracefully)
│   ├── ui.js               # DOM rendering: renderRoster, renderTaskForm, renderResults
│   └── app.js              # Orchestrator: wires state, handlers, and rendering
│
└── tests/
    ├── matcher.test.js     # Unit tests for all matcher functions
    ├── storage.test.js     # Unit tests for localStorage helpers
    └── scenarios.test.js   # Integration tests: unfilled roles, duplicates, conflicts
```

---

## Future Work

- AI provider abstraction (Anthropic, AWS Bedrock, local LLM)
- Skill taxonomy editor (add/remove skill tags)
- Multi-organiser support with simple auth
- Export assignments to CSV
- Email confirmation hooks
- Mobile-optimised layout
