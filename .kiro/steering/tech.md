---
inclusion: always
---

# VolunteerMatch – Technical Steering

## Stack (locked — do not change without updating DECISIONS.md)
- **HTML + CSS + Vanilla JS ES Modules** — no framework, no bundler
- **Client-side router** — hash-based (`#/route`) via `src/router.js`
- **Authentication** — localStorage session simulation; Firebase Auth drop-in documented in DECISIONS.md
- **Persistence** — localStorage (`volunteerMatch_v2`) for all app state
- **Tests** — Vitest + jsdom, `npx vitest run`
- **Node** — portable at `d:\chio_codes\node-portable\node-v20.18.0-win-x64\node.exe`

## File layout
```
src/
  router.js       ← hash router, view registry
  auth.js         ← session management (localStorage-based)
  store.js        ← single AppStore, replaces per-module state
  data.js         ← sample data (extended), SKILLS catalogue
  matcher.js      ← pure scoring engine (DO NOT MODIFY without tests passing)
  storage.js      ← localStorage helpers
  ai.js           ← optional AI extractor
  components/
    nav.js        ← sidebar + mobile nav
    modal.js      ← accessible dialog wrapper
    toast.js      ← notification toasts
  views/
    landing.js
    auth.js       ← login / signup view
    feed.js
    opportunities.js
    opportunity-detail.js
    profile.js
    organisations.js
    donations.js
    blood-donation.js
    settings.js
  ui.js           ← shared render helpers (volunteer cards, skill tags, etc.)
  app.js          ← bootstrap, mounts router, nav, store
style.css         ← single stylesheet, dark theme tokens
tests/            ← existing + new tests
```

## Naming conventions
- Views: default export `function render<ViewName>(container, params)` — receives a DOM container and parsed route params
- Components: default export `function render<ComponentName>(container, props)` or `function mount<ComponentName>(container, props)` returning a cleanup fn
- Store mutations: `store.set(key, value)` or `store.patch(collection, id, delta)`
- Route format: `#/path` or `#/path/:id`

## Design tokens (CSS custom properties — never hardcode these colours)
```css
--bg-main:     #0B0D14
--bg-secondary:#111522
--bg-card:     #171C2B
--accent:      #8B7CFF
--accent-2:    #42D6C5
--text-main:   #F3F4FA
--text-muted:  #A3A9BB
--border:      #1E2440
--success:     #22C55E
--warning:     #F59E0B
--danger:      #EF4444
--info:        #38BDF8
```

## Security notes
- No passwords stored in app state or localStorage — store only a session token / user ID
- Role and verification status are read from the store (seeded by sample data), never from URL params or form values
- All "privileged" mutations (org verification, admin approval) must check store.currentUser.role
