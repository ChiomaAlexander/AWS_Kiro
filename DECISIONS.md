# VolunteerMatch – Architecture Decision Record

## ADR-001 No build step
**Decision:** Plain ES Modules, no bundler (Vite, Webpack, Parcel).
**Reason:** Beginner-friendly; works with Live Server or `npx serve .`; nothing to configure.
**Tradeoff:** No tree-shaking; slightly more HTTP requests. Acceptable at prototype scale.

## ADR-002 No framework
**Decision:** Vanilla JS for DOM manipulation.
**Reason:** Removes React/Vue/Angular learning curve for a beginner developer. Half-day timeline makes any framework overhead unacceptable.
**Tradeoff:** Manual DOM updates; no component reactivity. Mitigated by full re-render on each state change.

## ADR-003 localStorage for persistence
**Decision:** `localStorage` keyed `volunteerMatch_state`.
**Reason:** Zero setup, works offline, survives page refresh, demonstrable in a browser.
**Tradeoff:** Single-user only; cleared on browser data wipe. Acceptable for an MVP demo.

## ADR-004 Vitest for testing
**Decision:** Vitest as the test runner.
**Reason:** Zero-config, runs in Node without a browser, compatible with ES Modules, fast.
**Tradeoff:** Requires Node.js to be installed. `npx vitest run` installs it on first use.

## ADR-005 Deterministic scoring only
**Decision:** The matching algorithm is fully deterministic; AI is an optional enhancement, not a dependency.
**Reason:** Demonstrates reliable rules-based logic; eliminates API-key dependency for the demo; keeps the algorithm transparent and explainable.
**Tradeoff:** Natural-language skill extraction requires manual tag selection unless AI is configured.

## ADR-006 AI integration pattern
**Decision:** AI skill extraction activates only when `window.__AI_API_KEY` is set at runtime.
**Reason:** Keeps the demo self-contained; no false claims of AI usage.
**Implementation note:** `src/ai.js` checks for the key on module load. If absent, `AI_ENABLED = false` and the feature silently degrades. AI output is validated against the known skills catalogue before use.
**Future work:** Support Anthropic, Bedrock, or local LLM endpoints by abstracting the provider.

## ADR-007 Two-column layout
**Decision:** CSS Grid two-column layout (roster | task+results).
**Reason:** Keeps both the volunteer list and the task workflow visible simultaneously — important for a live demo.
**Responsive:** Collapses to single column below 700 px.

## ADR-008 Sample data size
**Decision:** 10 volunteers, 3 pre-existing tasks.
**Reason:** Large enough to show varied scores and demonstrate conflicts/duplicates/unfilled roles; small enough to scan in a demo.

## ADR-009 Slot representation
**Decision:** Slots stored as ISO-8601 datetime strings (`"2026-10-17T09:00"`).
**Reason:** Enables simple numeric comparison (`Date.parse`) for overlap detection without a date library.

## ADR-010 Multi-view SPA with hash router
**Decision:** Client-side hash-based routing (`#/route`) via a hand-rolled `src/router.js`.
**Reason:** No build step; works with any static file server; no server-side routing needed; hash URLs work from `file://` too.
**Tradeoff:** No server-side rendering, no SEO. Acceptable for a demo/MVP. Clean URLs would need a server rewrite rule.

## ADR-011 AppStore singleton
**Decision:** Single `store.js` singleton replaces per-module `localStorage` calls.
**Reason:** All views and components share one consistent state object; mutations trigger subscribers; persist is centralised.
**Tradeoff:** No immutability guarantees (plain JS objects). Fine at prototype scale; a real app would use a proper state management pattern.

## ADR-012 Demo auth vs Firebase Auth
**Decision:** Auth is simulated with localStorage sessions. Passwords stored as `DEMO_HASH_<username>` — clearly labelled, never a real hash.
**Reason:** Firebase requires a project ID and network access; keeps the demo fully offline.
**Migration path to Firebase Auth:**
1. Add Firebase SDK via CDN (`<script type="module">` import).
2. Replace `auth.signup/login/logout` with `createUserWithEmailAndPassword / signInWithEmailAndPassword / signOut`.
3. Replace `vm_session` localStorage token with Firebase's `onAuthStateChanged` listener.
4. Move user profile data to Firestore `users/{uid}`.
5. Update `store.js` to hydrate from Firestore instead of localStorage.
**Security note:** Never store real passwords in localStorage or Firestore.

## ADR-013 Dark theme design token approach
**Decision:** All colours defined as CSS custom properties on `:root`; no hardcoded colour values anywhere else.
**Reason:** Single-source theming; easy to adjust palette; consistent across all components.
**Tokens:** Defined in `style.css` `:root` block and documented in `.kiro/steering/tech.md`.

## ADR-014 Matcher.js preserved unchanged
**Decision:** The original `matcher.js` and its 28 passing tests are not modified.
**Reason:** It is the proven core of the product. Platform views adapt their data to the matcher's Volunteer/Task shapes rather than changing the engine.
**Integration:** `opportunity-detail.js` converts User objects → Volunteer shape and Opportunity → Task shape before calling `rankVolunteers()`.

## Future Work
- Skill taxonomy editor (add/remove skill tags)
- Real Firebase backend (see ADR-012 migration path)
- Export assignments to CSV
- Email confirmation hooks
- Full AI provider abstraction (OpenAI, Anthropic, Bedrock)
- Payment provider integration (Stripe, Paystack)
- Advanced admin panel with audit log
- File uploads for org verification documents (Firebase Storage)
