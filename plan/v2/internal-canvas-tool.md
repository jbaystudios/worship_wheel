# Internal Planning Canvas

**Status:** 🚀 built (v1, lo-fi) — internal tooling
**Theme:** Tech & platform / internal ops
**Captured:** 2026-06-12

## What it is

A Miro/Figma-style **infinite canvas baked into the app** for internal planning & scoping. Open the URL, pan/zoom, and walk a client (Charl) through a concept visually — on a screen-share or by sharing the link. Reusable for *any* future concept, not just the first one.

**Route:** `/canvas` — `noindex, nofollow` (never surfaces on production search). Currently open (no auth) for easy link-sharing; can move behind admin Supabase auth later if needed.

**Zero impact on the funnel:** React Flow is code-split at the route level, so it only loads on `/canvas` — the assessment/landing bundle is untouched.

## Navigation (Figma-style)

- **Scroll** = pan · **drag canvas** = pan
- **Cmd/Ctrl + scroll** (or pinch) = zoom in/out
- **Drag a frame** to reposition / add spacing — arrangement is **saved to localStorage** (`ww-canvas-positions-v1`) so it survives reloads. **Reset layout** button (in the toggle panel) snaps back to defaults.
- Minimap + zoom controls bottom corners

## First board: the multi-entry-point mapping

Built to illustrate [[multi-entry-points]] for Charl. Two regions:

1. **Live demo (top):** a toggle (top-left) with three URLs — `no params` → `?utm_source=instagram` → `+ utm_campaign=worship-wheel-1`. Clicking swaps a **live-rendered** config frame + hero frame (the *real* hero markup, parameterised) so Charl literally watches the headline/copy/image change from the URL alone.
2. **Cascade map (below):** a static three-up comparison showing all three states at once, with arrows labelled `+ source override` / `+ campaign override`, and per-field **provenance highlighting** (grey = default, accent = source, green = campaign) so you can see exactly which tier set each value.

Each config frame also shows a **Keap actions** panel: the single **Lead Source** custom field (stays the channel — `Instagram` in both the source and campaign columns) plus the **tags that accumulate by tier** (`Source: Instagram`, then `+ Campaign: worship-wheel-1`). This makes the "different Keap tags based on the URL params" mechanic visible while showing the reporting dimension stays clean.

## How it's built

```
src/app/canvas/
├── page.tsx            # server route, noindex metadata
├── CanvasBoard.tsx     # 'use client' — React Flow board, nodes/edges, toggle Panel
├── HeroMock.tsx        # faithful parameterised render of the real hero (page.tsx)
├── demoConfig.ts       # demo source/campaign registry + cascade resolver (resolveHero)
└── nodes/
    ├── Frame.tsx           # shared titled-card chrome
    ├── ConfigFrameNode.tsx # config params + provenance highlight + URL badge
    ├── HeroFrameNode.tsx   # live hero render inside a frame
    └── NoteNode.tsx        # explanatory text cards
```

- **Engine:** `@xyflow/react` (React Flow) v12 — nodes = frames, edges = mapping arrows.
- **`demoConfig.ts`** mirrors the two-tier registry shape from [[multi-entry-points]] (`GLOBAL_DEFAULT ← SOURCES ← CAMPAIGNS`) and the `resolveHero()` cascade with per-field provenance. It's **illustrative scoping data, not production wiring** — kept local to the canvas on purpose.

## How to add a new board later

Lo-fi by design — to tell a new story: add node entries (type `note` / `config` / `hero`, or a new custom node) + edges in `CanvasBoard.tsx`. For non–Worship-Wheel concepts, add new custom node components under `nodes/`. No spec ceremony needed unless it grows into a real long-lived tool.

## Possible v2+ of the canvas itself (not now)

- Multiple boards / board switcher (currently one board).
- Shared/cross-device persistence (currently localStorage = per-browser only) — move to Supabase if arrangements need to be shared.
- Put behind admin auth and link from the admin dashboard.
- Reusable frame for "screenshot + caption" so non-devs can drop images in.

## Related
- [[multi-entry-points]] — the concept this first board illustrates
