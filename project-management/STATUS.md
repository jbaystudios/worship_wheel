# Worship Wheel — Project Status

**Last updated:** 2026-06-11
**Next milestone:** v1 controlled-cohort launch — **2026-06-15 (Mon)** (4 days out) — moved from 2026-06-12 (Fri); no-weekend rule + Charl's call
**Active branch:** `main`

---

## At a glance

| Area | State | Notes |
|---|---|---|
| Core assessment (001) | ✅ Shipped | 24-question quiz (3 per element), 8-dimension radar, lead capture wired |
| Scoring optimisation (002) | ✅ Shipped | Checklist response expansion live |
| Results page (003) | ✅ Shipped | UI/UX complete; server-rendered by id from Supabase |
| Results PDF download (006) | ✅ Shipped | `@react-pdf/renderer` route; top + bottom buttons; `pdf_downloaded` tracked. D-2 closed. |
| Admin dashboard (005) | 🟦 Parked | Code-complete (55/60). Polish paused for v1; used for launch monitoring at current state. |
| Keap push (D-3) | ✅ Shipped | Contact upsert + completion tag 3967 + custom fields; idempotent on email |
| **Keap email funnel (C-1 + D-4)** | ✅ **Built** | Charl's 6 archetype result-email sequences implemented in Keap; decision-diamond routes by `worship_wheel_archetype`. Live end-to-end. Full e2e cadence sign-off = the QA now starting (D-5b). |
| Email deliverability (opt-in, spec 008) | ✅ Shipped | Completers auto opted-in (`SingleOptIn`) so sequences actually deliver — verified live 2026-06-10 |
| **Product CTA cards (009)** | 🟧 Code-complete (branch) | Post-launch feature on `009-product-cta-cards`. Campaign-driven product cards on results via `?pr=` codes (captured→persisted→resolved); self-serve admin Products section w/ live preview; per-product analytics; excluded from PDF. tsc + 245 unit tests + prod build green. **Pending:** apply 4 Supabase migrations + manual QA against live stack (T046) + run gated e2e. |
| **v1 launch readiness** | 🟡 On track (tight) | Build complete; funnel live. Remaining: **QA (D-5a/D-5b) → go/no-go (S-1) → launch Mon**. 4 working days incl. launch day. |

---

## What's shipped

- 001 — Worship Wheel Assessment (questions, scoring, radar chart, lead capture)
- 002 — Scoring optimisation with checklist response expansion
- 003 — Results page (server-rendered by id)
- 005 — Admin dashboard US1–US5 (code-complete; used for launch monitoring)
- 006 — Results PDF download (D-2)
- D-1 — VSL / sales-CTA hidden behind `FEATURES.showVsl` / `FEATURES.showCta`
- D-3 — Keap push live (contact upsert + completion tag + custom fields; idempotent)
- D-AC — Archetype coverage closed (Path D); 1.68M-profile sweep test locks the invariant
- D-7 — Submit consent checkbox on assessment
- **C-1 — Charl's email copy delivered + implemented** (6 archetype sequences × emails)
- **D-4 — Keap archetype follow-up sequences built**; START tag (3967) → decision diamond on `worship_wheel_archetype` → matching sequence + history tag
- **Email opt-in (spec 008)** — completers recorded `SingleOptIn` via XML-RPC `APIEmailService.optIn` (guarded, non-blocking) so the follow-up emails deliver; privacy-policy consent linked
- **Keap merge fields** — `worship_wheel_archetype_name` (display name) + `worship_wheel_result_id` (hyperlinkable results link)
- **Completed Assessment tag (3984)** — durable history tag for filtering completers (applied Keap-side in the campaign)
- **Mobile fixes** — Montserrat webfont now renders on mobile; collapsed element score bars fixed; nav padding made responsive
- Domain — `worshipwheel.com` live (canonical, via `NEXT_PUBLIC_BASE_URL`)

## What's in progress

- **D-5a / D-5b — launch QA** (Derick, starting 2026-06-11): full happy-path e2e, all 6 sequences end-to-end with test contacts + cadence, cross-browser, responsive 375/768/1024/1440, sync-health green, dashboard accurate, PDF, then clean test data.

## What's parked

- 005 admin dashboard polish — T006 migration + live-DB-dependent polish. Resumes post-launch.

## Active blockers

| Blocker | Owner | Impact | Status |
|---|---|---|---|
| **Launch QA (D-5a/D-5b)** | Derick | Must pass before go/no-go | 🟡 In progress (started 2026-06-11) |

> C-1 and D-4 (previously the critical-path blockers) are **resolved** — the funnel is built and live. **C-2 is not a blocker:** the cohort is Charl's existing members and Charl actions the send himself from Keap — no list handoff to Derick.

## What's next

1. **2026-06-11 → 2026-06-12** — Derick runs D-5a/D-5b QA across the live funnel; log defects to a fix list.
2. **2026-06-12 (Fri)** — triage/fix any QA defects; final test-data cleanse; production smoke test (app already live on `worshipwheel.com`).
3. **Weekend** — no deadlines (no-weekend rule).
4. **2026-06-15 (Mon)** — go/no-go (S-1) → launch: **Charl sends the `worshipwheel.com` link to his existing-member segment**; monitor dashboard (sync-health, funnel, events) through the day.

---

## Recent changes

- 2026-06-11 — 📅 **Launch date moved 2026-06-12 → 2026-06-15 (Mon)** (no-weekend rule + Charl). 📨 **D-4 complete** — Charl implemented the June result emails for all 6 archetypes; funnel is live end-to-end. Derick **starting launch QA** (D-5a/D-5b).
- 2026-06-11 — ✅ **Mobile rendering fixes** (PRs #15/#16): Montserrat webfont now applies on mobile (`font-sans` → `var(--font-montserrat)`); element score bars no longer collapse (`max-md:flex-none`); nav padding → responsive `px-site-margin`. Mobile responsive audit otherwise clean.
- 2026-06-10 — ✅ **Email opt-in shipped (spec 008, PRs #11–14)**: API-created Keap contacts defaulted to `NonMarketable` (no emails would send) — now auto opted-in via XML-RPC `APIEmailService.optIn` (guarded so retakes never downgrade; non-blocking). Verified live: `NonMarketable → SingleOptIn`, first sequence email received. Consent reason + `EmailGate` link point at the privacy policy.
- 2026-06-10 — ✅ **Keap merge fields + tags**: `worship_wheel_archetype_name` (272), `worship_wheel_result_id` (274) custom fields; six archetype history tags (3972–3982); STOP tag (3970); durable Completed Assessment tag (3984, applied Keap-side). Added `keap-tag-builder` skill for convention-consistent tag naming.
- 2026-05-29 — ✅ **Domain live**: `worshipwheel.com` set as canonical via `NEXT_PUBLIC_BASE_URL`. (The earlier-planned `worshipwheel.worshipguitarskills.com` subdomain was never deployed — `worshipwheel.com` is the only domain.)
- 2026-05-28 — ✅ **Charl provisioned as admin user** (`charl@guitarskills.com`) for dashboard monitoring; needs password rotation on first sign-in.
- 2026-05-28 — 🛠️ **Admin sign-in restored for Derick** (service-role password reset).
- 2026-05-28 — ✅ **R-5 resolved (cohort access)**: open public URL, no auth/gating; Charl segments his Keap audience and distributes the link.
- 2026-05-28 — 🧹 **PM docs reconciled**: D-2 ✅; D-7 added; dates refreshed.
- 2026-05-25 — ✅ **D-7 shipped** (consent checkbox, `3e30d79`).
- 2026-05-25 — ✅ **D-2 shipped** (Results PDF download, `9e65687`).
- 2026-05-25 — ✅ **D-3 closed + idempotency verified** (contact 88271; stable snake_case archetype keys).
- 2026-05-25 — ✅ **D-AC closed** (Path D); 1.68M-profile coverage sweep locks the invariant.
- 2026-05-25 — 🔧 **D-3 MVP-simplified**: 1 completion tag + 4 custom fields (broader tagging parked).
- 2026-05-22 — ✅ **R-1/R-3 resolved** (Keap key in `.env.local`; Vercel `office-3285` access).
- 2026-05-22 — v1 launch date set (2026-06-12); PM folder established.
- 2026-05-20 — 005 US5 shipped; 2026-05-19 — 005 US1–US4 shipped.
- 2026-04-14 — Repo reorganised (`specs/`, `plan/`, `docs/`).
