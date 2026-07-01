# Admin Console — Wireframes

Durable record of the wireframe iterations produced during the 2026-06-30 design session.

## Selected: v3

The user chose **v3** as the direction for the admin dashboard. v3 differs from v2 by collapsing the activity log into the right rail (rather than as a separate full-width section).

Current canonical wireframe: `admin-dashboard-v3.html`

## Iteration history

| Version | File | Status | Notes |
|---------|------|--------|-------|
| v1 | `archive/admin-dashboard-v1.html` | superseded | Initial layout, expanded sidebar |
| v2 | `archive/admin-dashboard-v2.html` | superseded | Sidebar collapsed |
| v3 | `admin-dashboard-v3.html` | **selected** | v2 + activity log merged into right rail |

## Recovery note

The wireframes were produced via the `show_widget` tool during the session and were not captured into the session's text context as raw markup. The placeholder files in this directory record the design intent (layout, components, deltas between versions) so that the visuals can be reconstructed in the next session. Re-issue the `show_widget` calls with the descriptions in each placeholder file to regenerate the renderable HTML/SVG.

## Process gap surfaced

This near-loss is a signal that visual iteration via `show_widget` needs a save-as-you-go discipline. Today the only durable artifact of an in-session widget is whatever text Claude wrote alongside it. Candidate fix: a wrapper or post-tool hook that writes the widget HTML to the owning system's `reference/wireframes/` folder at render time, keyed by title. Flagging here so it lands as a capture item.
