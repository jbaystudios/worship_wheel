# Feature Specification: Keap Email Opt-In on Assessment Submit

**Feature Branch**: `008-keap-opt-in`
**Created**: 2026-06-10
**Status**: Draft
**Input**: User description: "The optIn is an important one so we need to build that. Let's open a spec for it. While we're at it, let's link the privacy policy at opt in — https://shop.worshipguitarskills.com/pages/privacy-policy"

## Problem & Context

Contacts created in Keap via the REST API (`PUT /v1/contacts`) default to **`NonMarketable`** (`email_opted_in: false`). Keap will not send marketing/sequence emails to non-marketable contacts. This was confirmed live on 2026-06-10:

- Test contact `derick+cs01@…` (untouched API default) → `email_status: NonMarketable` → would receive **no** follow-up emails.
- Test contact `derick+cs02@…` (manually flipped in the Keap UI) → `email_status: SingleOptIn` → receives emails.

**Consequence:** Without this feature, every real cohort member pushed to Keap by the assessment is created un-emailable, and **none of the six archetype follow-up sequences will deliver.** This is a v1-launch blocker (relates to D-3/D-4).

The completer submitting their email to receive their Worship Wheel results is the consent event. This feature records that consent as a single opt-in in Keap and ties it to the published privacy policy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Completers become emailable so follow-up sequences deliver (Priority: P1)

When a user finishes the assessment and submits their email, the contact pushed to Keap is marked as opted-in (marketable) so the archetype follow-up sequence can actually email them.

**Why this priority**: Without it, the entire follow-up email programme (the core of D-3/D-4 and the reason for the archetype work) silently fails to deliver. It is the highest-value, blocking slice.

**Independent Test**: Submit a completed assessment with a fresh email, then inspect the Keap contact — `email_status` is marketable (not `NonMarketable`) and `email_opted_in: true`. Confirm the archetype sequence email actually arrives.

**Acceptance Scenarios**:

1. **Given** a new email never seen in Keap, **When** the assessment is submitted, **Then** the Keap contact is created and recorded as opted-in (marketable) with a consent reason.
2. **Given** a contact that already exists and is marketable, **When** they retake the assessment, **Then** the opt-in call is safe/idempotent and does not degrade their status.
3. **Given** the opt-in step fails (API/transport error), **When** the submission completes, **Then** the contact sync still succeeds and the failure is surfaced (logs / sync-health), not swallowed.

---

### User Story 2 - Consent is captured with a link to the privacy policy (Priority: P1)

At the point the user provides their email, they are shown clear consent language linking the privacy policy, and the opt-in recorded in Keap references that policy so there is a defensible consent audit trail.

**Why this priority**: A single opt-in is only legitimate if the user actually saw and agreed to the terms at the moment of opting in. Linking the privacy policy is both a compliance requirement and explicitly requested. Equal priority to US1 — they ship together.

**Independent Test**: On the email-capture step, the privacy-policy link is visible and resolves to `https://shop.worshipguitarskills.com/pages/privacy-policy`; after submission, the Keap opt-in reason records the consent context including the policy reference.

**Acceptance Scenarios**:

1. **Given** the email-capture step, **When** it renders, **Then** consent microcopy is shown with a working link to the privacy policy that opens in a new tab.
2. **Given** a successful submission, **When** the opt-in is recorded in Keap, **Then** the opt-in reason text identifies the source (Worship Wheel assessment) and references the privacy policy.

---

### Edge Cases

- **Previously opted-out contact**: A contact who has explicitly opted out / unsubscribed MUST NOT be force-re-opted-in. Respect the existing opt-out (compliance). The opt-in attempt must not resurrect a hard opt-out.
- **Opt-in API unavailable / errors**: Non-blocking — the contact and custom fields still sync; the opt-in failure is logged/surfaced for retry, never fails the user's submission.
- **Retake / duplicate email**: Opt-in is idempotent; re-opting an already-marketable contact is a no-op.
- **Missing privacy-policy URL config**: The email-capture step must still render a sensible consent line; opt-in must not silently record an empty policy reference.
- **Bounced / invalid email**: Opt-in does not override Keap's own bounce/invalid handling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On a successful assessment submission, the system MUST record a **single opt-in** for the contact's email in Keap so the contact becomes marketable (able to receive sequence emails).
- **FR-002**: The opt-in MUST carry a human-readable **consent reason** identifying the source (e.g. "Completed the Worship Wheel assessment") and referencing the privacy policy.
- **FR-003**: The system MUST NOT override or resurrect a contact who has explicitly **opted out / unsubscribed**; existing opt-out status is preserved.
- **FR-004**: The opt-in step MUST be **non-blocking** — failures do not fail the user's submission and do not block the existing contact/custom-field/tag sync; failures are logged and surfaced (sync-health / `keap_sync` status) for retry.
- **FR-005**: The opt-in MUST be **idempotent** on retakes / duplicate emails (no degradation of an already-marketable contact).
- **FR-006**: The assessment **email-capture step MUST display consent language with a visible link to the privacy policy** (`https://shop.worshipguitarskills.com/pages/privacy-policy`) before the user submits.
- **FR-007**: The privacy-policy URL MUST be a single configurable source of truth (constant or env) reused by both the UI consent copy and the Keap opt-in reason, so it cannot drift.
- **FR-008**: The privacy-policy link MUST open in a new tab and not interrupt the assessment flow.
- **FR-009**: The opt-in behaviour MUST be verifiable end-to-end with a test submission (consistent with the existing test-contact workflow and `test-cleanse`).
- **FR-010**: The system MUST record opt-in via Keap's **XML-RPC `APIEmailService.optIn(serviceAccountKey, email, optInReason)`** (`https://api.infusionsoft.com/crm/xmlrpc/v1`, `Authorization: Bearer <key>`). **Verified working with the existing Service Account Key on 2026-06-10**: a `NonMarketable` contact moved to `SingleOptIn` and the call returned `true`; REST v1 has no equivalent opt-in field.
- **FR-011**: Consent model is **single opt-in** (confirmed 2026-06-10 — sufficient for delivery, no confirmation email / double opt-in for v1).
- **FR-012**: The system MUST read the contact's current `email_status` and **only call opt-in when the contact is `NonMarketable`**. Already-marketable contacts (`SingleOptIn` or confirmed/double) and opted-out contacts MUST be skipped — guaranteeing a retake never downgrades an engaged contact or resurrects an unsubscribe. (Verified: a repeat opt-in returns `false` and leaves `SingleOptIn` unchanged, so the guard is belt-and-suspenders on top of Keap's own no-op behaviour.)

### Key Entities *(include if feature involves data)*

- **Keap email marketability status**: `NonMarketable` | `SingleOptIn` | `OptOut` (Keap-managed). Target end state for a completer: marketable (`SingleOptIn` or better). `OptOut` is terminal and respected.
- **Opt-in consent record**: the reason/text Keap stores with the opt-in — source + privacy-policy reference; the consent audit trail.
- **Privacy policy URL**: `https://shop.worshipguitarskills.com/pages/privacy-policy` — single configurable value used by UI consent copy and the opt-in reason.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new completer contacts pushed to Keap are marketable (`email_status` ≠ `NonMarketable`) immediately after submission — except contacts with a pre-existing opt-out.
- **SC-002**: Archetype follow-up sequence emails are delivered to new completers (not skipped for marketability) in an end-to-end test.
- **SC-003**: Every recorded opt-in includes a consent reason that references the privacy policy.
- **SC-004**: The email-capture step shows a working privacy-policy link in 100% of sessions across the supported breakpoints (375/768/1024/1440).
- **SC-005**: Opt-in failures never block submission — submission success rate is unchanged when the opt-in call fails.

## Assumptions

- The act of submitting an email to receive Worship Wheel results constitutes consent to a single opt-in for the related follow-up emails, provided the privacy policy is linked at that step (US2).
- A **single opt-in** is sufficient for delivery and acceptable for the v1 cohort; no double-opt-in confirmation email is required (confirmed 2026-06-10).
- The opt-in is layered onto the existing Keap sync (`src/lib/keap/*`, `/api/submit`) as an additional, non-blocking step — same resilience pattern as the optional `worship_wheel_archetype_name` field (the 2026-06-10 archetype-name work).
- The privacy policy at `https://shop.worshipguitarskills.com/pages/privacy-policy` is the canonical, published policy and will remain at that URL for v1.
- Existing opt-out / unsubscribe handling in Keap remains authoritative; this feature never overrides it.
- No separate test database exists — opt-in is validated against the live Keap account using disposable plus-aliased test emails, then cleaned up per the `test-cleanse` workflow.
