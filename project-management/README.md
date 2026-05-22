# Project Management

This folder is the **single source of truth for project state, deliverables, owners, timelines, and risks** for the Worship Wheel. It is intentionally separated from app code (`src/`), specifications (`specs/`), and source documents (`docs/`) so that any human or AI agent can answer "what's the state of this project?" without reading code.

## For AI agents reading this repo

Start here:

1. [`STATUS.md`](STATUS.md) — the current state of the app: what's built, what's in progress, what's blocked.
2. [`v1-launch/`](v1-launch/) — everything related to the **2026-06-12** controlled internal cohort launch.
   - [`overview.md`](v1-launch/overview.md) — launch date, scope (in/out), success criteria
   - [`deliverables.md`](v1-launch/deliverables.md) — work broken down by owner (Charl / Derick)
   - [`timeline.md`](v1-launch/timeline.md) — working schedule from today to launch
   - [`risks.md`](v1-launch/risks.md) — known blockers, dependencies, mitigations

When a session begins, prefer this folder over inferring state from git history or scanning the codebase. If something here disagrees with the code, **the code is reality** — update this folder.

## Update policy

- **STATUS.md** — update whenever shipped/blocked state materially changes. Keep dates absolute (YYYY-MM-DD).
- **v1-launch/** — update as deliverables move, dates slip, or risks become real. Don't delete completed items; mark them as done with a date.
- Use the `project-manager` skill (`/project-manager`) to drive structured updates — it will surface ambiguity and unanswered questions before letting changes land.

## What does NOT belong here

- App code, components, or scripts → `src/`
- Specifications and requirements → `specs/`
- Client-supplied source docs (concepts, raw PRDs) → `docs/`
- Decisions about technical architecture → `specs/<feature>/research.md` or ADRs

This folder is for **project execution state**: who, what, when, why we're blocked.
