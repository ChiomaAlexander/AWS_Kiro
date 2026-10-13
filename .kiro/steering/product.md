---
inclusion: always
---

# VolunteerMatch – Product Steering

## What this project is
A browser-only volunteer-to-task matching MVP for college events and nonprofits.
No server, no build step, no cloud credentials required.

## Stack constraints
- **Plain HTML + CSS + Vanilla JS (ES Modules)** — no React, Vue, Angular, or bundlers.
- Entry point: `index.html` in the workspace root.
- Source files live in `src/`. Tests live in `tests/`.
- Tests use **Vitest** (`npx vitest run`). No watch mode in CI.
- Styles in a single `style.css`. No CSS frameworks.

## Code style
- Every exported function must have a JSDoc comment.
- Keep functions small (< 40 lines each where possible).
- Pure functions for all matching/scoring logic — no side effects in `matcher.js`.
- UI logic lives in `ui.js`; data in `data.js`; orchestration in `app.js`.
- Inline comments in English, beginner-friendly language.

## Matching rules (NEVER change without updating requirements.md)
1. +10 per matched required skill
2. +20 for availability match
3. −5 per existing assignment (workload penalty)
4. Ties broken alphabetically by name
5. Eligibility checks (duplicate, conflict) disable the Assign button but do NOT change score.

## AI policy
- AI skill extraction is OPTIONAL and DISABLED by default.
- It activates only when `window.__AI_API_KEY` is set.
- AI output must be validated against the known skills list.
- AI MUST NOT override the deterministic score or eligibility logic.
- If AI is not active, the UI must NOT claim AI is being used.

## Persistence
- `localStorage` key: `volunteerMatch_state`
- Reset Demo clears this key and reloads sample data.

## Accessibility
- All interactive controls need ARIA labels.
- Color is never the sole indicator of match status — always pair with an icon or text.

## Out of scope
Authentication, payments, maps, cloud DB, email, mobile-native features.
