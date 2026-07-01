# admin-console — dashboard wireframes

Design-intent spec for the admin-console dashboard surface. The HTML files in this folder render one snapshot of the design; this README defines the system. When the rendering and the spec disagree, the spec wins.

Owning system: `systems/admin-console/`
Last update: 2026-06-30

## Canonical files index

| File | Purpose |
|------|---------|
| `admin-dashboard-v3-canonical.html` | The agreed dashboard layout. Top nav + collapsed icon sidebar + main content + right rail (activity + quick actions). |
| `README.md` | This file. Design intent, locked rules, handoff brief. |
| `_historical/` | Superseded iterations. Do not treat as canonical. See lineage notes below. |

Only `admin-dashboard-v3-canonical.html` is canonical. Anything in `_historical/` is reference-only.

## Visual rendering note

The wireframe files use host CSS variables (`--bg`, `--fg`, `--muted`, `--panel`, `--border`, `--accent`, `--accent-warn`, `--accent-ok`) so they render against the cockpit theme when embedded. Each file also declares fallback values in `:root` so a plain browser open still renders correctly — colors will look "default-dark" rather than theme-perfect, which is expected.

If a future render appears unstyled, check that the host CSS vars are reaching the iframe / shadow root before assuming the wireframe is broken.

## Locked design rules

These rules are NOT open for craft input. Changing any of them requires a re-discussion with Nick, not a designer pass.

1. **Top nav is global.** Brand on the left, primary nav sections (Dashboard, Users, Systems, Logs, Settings) in a single horizontal row. No dropdowns at this level.
2. **Sidebar is the collapsed icon rail.** 56px wide, icons only, no labels. The full-label sidebar from v1 is rejected. If labels are needed, they belong in tooltips on hover.
3. **Three-column layout grid.** `56px | 1fr | 320px` — sidebar / main / right rail. The right rail is a fixed 320px and is always present on the dashboard route.
4. **Activity log lives in the right rail.** Not a separate full-width panel. This is the defining v3 decision and is the reason v3 supersedes v2.
5. **Quick actions live above activity in the right rail.** Same panel, two sections, quick actions first.
6. **Status pills are the only place accent colors appear in the table.** Health = `--accent-ok` (green), degraded = `--accent-warn` (amber). Action column is plain text.

## Per-mode / per-state feature flag table

The dashboard has one mode today (operator-admin). The table below scaffolds the matrix for when more modes land.

| Feature | operator-admin | (future: read-only viewer) | (future: support agent) |
|---|---|---|---|
| Metric cards | yes | yes | yes |
| Systems table | yes | yes (no Action column) | yes |
| Activity rail | yes | yes | yes |
| Quick actions | yes | NO | partial (invite-user only) |
| Promote / restart buttons | yes | NO | NO |

When viewer/support modes ship, update this table BEFORE wiring code so the spec leads the implementation.

## Accent palette / color tokens

| Token | Value (fallback) | Meaning |
|-------|------------------|---------|
| `--bg` | `#0b0d10` | App background |
| `--fg` | `#e6e8eb` | Primary text |
| `--muted` | `#8a9099` | Secondary text, labels, timestamps |
| `--panel` | `#14171c` | Card / sidebar / rail surface |
| `--border` | `#1e232a` | All dividers and card borders |
| `--accent` | `#6ea8fe` | Primary action / selection (reserved; not heavily used in v3) |
| `--accent-warn` | `#ffb454` | Degraded / pending state |
| `--accent-ok` | `#5fd38a` | Healthy / success state |

These are the only colors. A designer should refine the exact hex values, not introduce new semantic slots.

## Section order / layout structure

Top-to-bottom in the `main` column:

1. Page heading (`Dashboard`)
2. Metric cards row (3 cards, equal width)
3. Systems table

Top-to-bottom in the right rail:

1. Quick actions
2. Activity feed

Top nav order, left-to-right: Dashboard, Users, Systems, Logs, Settings.

## URL or state patterns

Single-route surface for v3. Pattern:

- `/admin` — dashboard (this wireframe)
- `/admin/users`, `/admin/systems`, etc. — sibling routes, same chrome

No query params drive state on `/admin` yet. When filters land on the systems table, encode them as URL params (`?owner=nick&state=degraded`) — not client state — so views are shareable.

## Implementation status

- Wireframes: persisted (this folder).
- Machine-readable encoding: NOT YET AUTHORED. Expected path when written: `systems/admin-console/lib/dashboard-tokens.ts` (palette + grid constants) and `systems/admin-console/lib/dashboard-features.ts` (the feature flag matrix above).
- Shipping code: NOT YET BUILT. Expected path when built: `systems/admin-console/app/admin/page.tsx`.
- Flag: the machine-readable encoding is the third leg of the triangulation. Until it exists, the spec and the wireframe are the only two sources, and code can drift undetected. Author the tokens + features files before building the route.

## For the designer (handoff brief)

### Locked — do not change without re-discussion

- The three-column grid (56 / 1fr / 320).
- Top nav structure and order.
- Collapsed icon sidebar (no labels).
- Activity feed in the right rail, quick actions above it.
- The token names and what each color means (the exact hex values are open).
- The feature flag matrix per mode.

### Open for craft input

- Typography choices (font family, scale, weights).
- Exact hex values for each token — refine for contrast, brand fit.
- Density / spacing scale.
- Status pill design (shape, border, weight).
- Icon set for the sidebar.
- Empty states, loading states, error states (none drawn).
- Mobile / narrow-viewport behavior (the grid assumes desktop).
- Hover, focus, active states.
- Microcopy (the labels "Quick actions", "Activity" can be refined).

When delivering, please honor the locked list and propose alternatives for anything in the open list. Any change to a locked item should come back as a question, not a fait accompli.

## Reference points

- Canonical wireframe: `./admin-dashboard-v3-canonical.html`
- Historical lineage: `./_historical/admin-dashboard-v1-baseline.html`, `./_historical/admin-dashboard-v2-collapsed-sidebar.html`
- Machine-readable encoding (planned): `systems/admin-console/lib/dashboard-tokens.ts`, `systems/admin-console/lib/dashboard-features.ts`
- Shipping code (planned): `systems/admin-console/app/admin/page.tsx`
- Owning system CLAUDE.md: `systems/admin-console/CLAUDE.md`

## Lineage (why v3 won)

- **v1 (baseline)** — Full-width labeled sidebar, activity log as a separate panel below the table. Rejected: sidebar ate horizontal space the table needed; activity panel pushed the table below the fold on shorter viewports.
- **v2 (collapsed sidebar)** — Sidebar collapsed to icon rail (kept). Activity log still a separate panel under the table (rejected, same fold problem).
- **v3 (canonical)** — Collapsed sidebar carried from v2 + activity log folded into a dedicated right rail. Table now lives above the fold and activity is always visible without scrolling the main column.
