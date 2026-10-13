---
inclusion: always
---

# VolunteerMatch – Project Structure Steering

## Directory rules
- All source JS lives under `src/` — no JS in the root except `vitest.config.js`
- Views live in `src/views/` — one file per route
- Reusable DOM components live in `src/components/`
- Pure logic (no DOM) lives directly in `src/` — matcher.js, store.js, auth.js, router.js
- Tests mirror source: `tests/matcher.test.js` tests `src/matcher.js`, etc.
- Single stylesheet: `style.css` in the root — no per-component CSS files

## View contract
Every view file must:
1. Export a default `async function render(container, params)` 
2. Set `container.innerHTML` to build its DOM (or use helper functions)
3. Register any cleanup (event listeners, intervals) by returning a cleanup function or storing on container
4. Not import from other views (views are independent)
5. Import shared logic from `src/store.js`, `src/auth.js`, `src/router.js`, `src/ui.js`

## Component contract
Every component file must:
1. Export a default `function mount(container, props)` returning a teardown function (or null)
2. Be stateless — receive all data as props, emit changes via callbacks in props
3. Be reusable across views

## Store contract
- Single source of truth: `src/store.js` exports a singleton `store`
- `store.get(key)` — read top-level key
- `store.set(key, value)` — set top-level key, triggers listeners
- `store.patch(collection, id, delta)` — partial update to an item in an array by id
- `store.subscribe(key, fn)` — register listener, returns unsubscribe fn
- Persisted to localStorage under `volunteerMatch_v2`

## Router contract
- `src/router.js` exports `router` singleton
- `router.register(pattern, renderFn)` — pattern is a string like `/feed` or `/opportunities/:id`
- `router.navigate(path)` — updates `location.hash` and triggers render
- `router.current()` — returns `{ path, params }`
- Listens to `hashchange`; renders matched view into `#view-root`

## Accessibility rules
- Every interactive element has a visible label or `aria-label`
- Color is never the sole status indicator — always pair with icon or text
- Focus is managed on route change (focus #view-root or first heading)
- Modal dialogs use `role="dialog"`, `aria-modal="true"`, trap focus, restore focus on close
- Form errors use `role="alert"` and are associated with inputs via `aria-describedby`
