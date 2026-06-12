# Worship Wheel — v2 Brainstorm

This folder is the **pre-spec ideation space** for Worship Wheel version 2. Ideas live here loosely while we shape them. Once an idea is ready to build, it graduates into a numbered spec under `specs/0XX-*` and follows the Spec Kit flow (specify → plan → tasks → implement).

## How this folder works

| Stage | Where it lives |
|---|---|
| Raw idea / capture | `ideas.md` (running backlog, lightly categorised) |
| Idea getting fleshed out | Its own file here, e.g. `v2/<short-name>.md` |
| Committed to build | Graduates to `specs/0XX-<name>/spec.md` |
| In-flight execution | Tracked in `project-management/` |

## Conventions

- **Capture first, organise later.** Drop ideas into `ideas.md` without worrying about polish. We'll cluster and prioritise as themes emerge.
- **One file per big idea** once it's worth expanding beyond a line or two.
- **Status tags** on each idea: `💡 raw` → `🔍 exploring` → `✅ ready-to-spec` → `🚀 graduated`.
- **Link out** to the spec number once an idea graduates, so we keep the trail.

## Index

- [ideas.md](./ideas.md) — running idea backlog
- [multi-entry-points.md](./multi-entry-points.md) — 🔍 multi entry points & lead-source tracking
- [internal-canvas-tool.md](./internal-canvas-tool.md) — 🚀 internal planning canvas (built, lo-fi) → `/canvas`

## Context anchors (v1 reality we're building on)

- v1 launched **2026-06-15** (controlled cohort). Open-URL distribution, Keap-segmented; no auth/login.
- Core flow: 24-question assessment → radar chart across 8 dimensions → Keap lead capture → results page + PDF download.
- Stack: Next.js 14 (App Router), Vercel, Supabase, Keap REST v1, Chart.js, @vercel/og, Tailwind, Zod.
- Admin dashboard (spec 005/007) exists for stakeholder analytics.
