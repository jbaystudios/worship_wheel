# Implementation Plan: Keap Email Opt-In on Assessment Submit

**Branch**: `008-keap-opt-in` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-keap-opt-in/spec.md`

## Summary

On a completed assessment, opt the contact into Keap email marketing so the archetype follow-up sequences actually deliver (API-created contacts default to `NonMarketable`). Implemented as a **non-blocking, guarded step** layered onto the existing Keap sync: read the contact's `email_status`, and only when `NonMarketable` call Keap's XML-RPC `APIEmailService.optIn(key, email, reason)`. The opt-in reason references the privacy policy, and the email-capture step links that same policy. Mechanism verified live 2026-06-10.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 14 (App Router); existing Keap REST client + `fetch` (XML-RPC is a plain `text/xml` POST — **no new dependency**); Zod (existing). No new runtime deps.
**Storage**: No new storage. Reads/writes Keap; reuses the existing `assessment_sessions.keap_sync_*` writeback for status. Optional: extend the sync-status reason string to note opt-in outcome (no schema change).
**Testing**: Vitest (unit) — extend `src/__tests__/unit/keap-sync.test.ts`; add Keap-client opt-in coverage.
**Target Platform**: Vercel (Fluid/serverless functions); opt-in runs inside the existing `waitUntil` background sync, so added latency is off the user's response path.
**Project Type**: Web application (Next.js single project — `src/`).
**Performance Goals**: No user-facing latency impact (background sync). +1 REST read (`email_status`) and at most +1 XML-RPC write per submit.
**Constraints**: MUST be non-blocking (the 2026-06-04 lesson — a Keap failure must never fail submission or block the contact/field/tag sync). MUST NOT downgrade or override existing opt-in / opt-out status.
**Scale/Scope**: v1 controlled cohort; one opt-in per completed submission. Small, additive change to 3 source files + UI copy + tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is still the unpopulated template, so there are no formal gates to evaluate. In its place, this plan honors the project's **de-facto conventions** (CLAUDE.md):

- **Non-blocking Keap sync resilience** — opt-in failures are caught, logged, and surfaced; never fatal (mirrors the optional `worship_wheel_archetype_name` field pattern). ✅
- **Test-backed** — Vitest unit coverage for the client call shape, boolean parsing, and the status guard. ✅
- **No secrets committed** — reuses `KEAP_SERVICE_ACCOUNT_KEY`; no new env. ✅
- **UI/UX skill for UI work** — the EmailGate change is a copy/href tweak (link target + new tab), not a redesign; the UI/UX Pro Max skill applies if any visual change is introduced. ✅
- **Spec-driven** — this plan follows the committed spec. ✅

No violations → Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/008-keap-opt-in/
├── spec.md              # Committed (single opt-in, verified mechanism, no-downgrade guard)
├── plan.md              # This file
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

Separate `research.md` / `data-model.md` / `contracts/` are **not warranted**: the only unknown (the opt-in mechanism) was resolved by live verification (captured in spec FR-010), there is no new data model, and the single external contract (Keap XML-RPC `optIn`) is documented inline below.

### Source Code (repository root)

```text
src/
├── lib/
│   ├── keap/
│   │   ├── client.ts        # ADD: getEmailStatus(email) [REST GET]; optInEmail(email, reason) [XML-RPC]
│   │   └── sync.ts          # ADD: guarded, non-blocking opt-in step after upsert+tags
│   └── constants.ts         # ADD/REUSE: PRIVACY_POLICY_URL (single source of truth)
├── components/
│   └── assessment/
│       └── EmailGate.tsx    # EDIT: privacy link → PRIVACY_POLICY_URL, open in new tab (rel=noopener)
└── __tests__/unit/
    ├── keap-sync.test.ts    # EXTEND: opt-in guard + non-blocking behavior
    └── keap-client.test.ts  # ADD (or extend): XML-RPC request shape + boolean parse + fault handling
```

**Structure Decision**: Existing single Next.js project. The opt-in is a small additive layer in the established `src/lib/keap/*` boundary; the consent UI already exists in `EmailGate.tsx` (mandatory consent checkbox + privacy link) and only needs the link target corrected and centralized.

## Design

### External contract — Keap XML-RPC opt-in (verified 2026-06-10)

- **Endpoint**: `POST https://api.infusionsoft.com/crm/xmlrpc/v1`
- **Auth**: `Authorization: Bearer <KEAP_SERVICE_ACCOUNT_KEY>`, `Content-Type: text/xml`
- **Method**: `APIEmailService.optIn` with **three** string params, in order: `serviceAccountKey`, `email`, `optInReason`
- **Returns**: XML-RPC `<boolean>1</boolean>` when the status changed (opted in), `<boolean>0</boolean>` when no change (already opted in **or** opted out — Keap will not resurrect an opt-out). An XML-RPC `<fault>` indicates an error.
- **Status read** (guard input): REST `GET /v1/contacts?email=<email>` → `email_status` ∈ {`NonMarketable`, `SingleOptIn`, confirmed/double, `OptOut`, …} and `email_opted_in`.

### Guard logic (FR-012 — the no-downgrade safety)

```
status = getEmailStatus(email)
if status == NonMarketable:        optInEmail(email, reason)   // the only case we act on
else:                               skip (log)                  // already marketable OR opted-out → never touched
```

Two layers of protection: (1) we only call `optIn` for `NonMarketable` contacts, so engaged (single/double) and opted-out contacts are never passed to it; (2) even if called, `optIn` is a verified no-op (`returns 0`) for already-opted-in/opted-out — it does not downgrade. Together: a retake by an opted-in user cannot reduce their status.

### Opt-in reason (consent record — FR-002)

`Completed the Worship Wheel assessment — consent per ${PRIVACY_POLICY_URL}` where `PRIVACY_POLICY_URL = https://shop.worshipguitarskills.com/pages/privacy-policy`.

### Consent UI (US2 / FR-006–FR-008)

`EmailGate.tsx` already renders a **required** consent checkbox ("I agree to receive emails with my results…") with a privacy link. Change: point the link at `PRIVACY_POLICY_URL` (currently the placeholder `/privacy`) and add `target="_blank" rel="noopener noreferrer"`. Same constant feeds the opt-in reason → no drift (FR-007).

### Non-blocking orchestration (FR-004)

In `sync.ts`, after `upsertContact` + `applyTags`, run the opt-in inside its own `try/catch`. On error: `console.error` + (optionally) append a note to the `keap_sync_error`/status string, but **return the existing sync outcome unchanged** (a `synced` contact with a failed opt-in is still `synced`). Because the whole sync runs in `waitUntil`, the user response is never affected. `resync-failed-keap.ts` inherits the behavior for free.

## Phases

- **Phase 0 — Research**: ✅ Complete. The opt-in mechanism, param order, return semantics, and no-downgrade behavior were verified against the live account (spec FR-010/FR-012). No open unknowns.
- **Phase 1 — Design**: ✅ Captured above (contract, guard, reason, consent UI, orchestration). No new data model or separate contract files needed.
- **Phase 2 — Tasks** (`/speckit.tasks`): break into (a) client `getEmailStatus` + `optInEmail` + XML-RPC helper/parse, (b) `sync.ts` guarded non-blocking step, (c) `PRIVACY_POLICY_URL` constant + `EmailGate` link fix, (d) unit tests, (e) live verification on a fresh plus-aliased test contact + `test-cleanse`.

## Risks & Mitigations

- **XML-RPC fault/format drift** → isolate XML build + boolean parse in `client.ts` with unit tests; treat any non-`1` / fault as "not opted in," logged, non-fatal.
- **`email_status` value set wider than expected** (e.g. other unconfirmed/marketable labels) → guard acts only on the exact `NonMarketable` value; all other values skip. Keap's own no-op on `optIn` is the backstop. Document observed values from live verification.
- **Domain coupling** (privacy URL) → single constant shared by UI + reason (FR-007).
- **Latency** → one extra REST read + one XML-RPC write, both inside `waitUntil`; no user-facing impact.
```
