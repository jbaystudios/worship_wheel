---
name: keap-tag-builder
description: Generate consistent, convention-compliant Keap tag names for a campaign or sequence, and tell the user exactly which Keap category each belongs in — so any team member (not just developers) creates tags consistently. Use when someone says "I need tags for a new sequence/campaign", "create Keap tags", "what should I name this tag", "help me name tags", "tag naming", "new campaign tags", or is setting up follow-up sequences in Keap. The skill produces names for the user to create by hand in Keap; it does NOT write to Keap unless the user is a developer and explicitly asks.
---

# Keap Tag Builder

Helps anyone on the team produce **correctly-named Keap tags** that follow the WGS
house convention, so tagging stays consistent across every campaign and sequence.

**The default job is naming, not implementation.** You generate the tag names and tell
the user which Keap category to create each one in. **The user creates them in Keap by
hand.** Only touch the Keap API if the user is a developer and explicitly asks (see
*Developer path* at the bottom).

> Read [`reference/naming-convention.md`](reference/naming-convention.md) first — it is
> the authoritative convention (departments, brands, categories with exact names + IDs,
> step rules), reverse-engineered from the live account.

## Who uses this

Most team members are **not developers**. They need a clean list of tag names + the
exact category to select in Keap. Keep the output copy-paste simple. Don't talk about
APIs, scripts, or IDs unless asked.

## Operating procedure

### 1. Gather the slots (ask for anything missing — don't guess)

A tag name is `<DD>. <Department> <CID> <Brand> <Campaign Name> <SS>. <Step Label>`.
You need all of these before you can produce names. **If the user hasn't given one,
ask — keep asking until you have enough.** Never invent a value.

| Slot | Ask if missing | Validate against convention |
|---|---|---|
| Department | "Which funnel stage — Marketing, Sales, Fulfilment, or Internal?" | Must be one of the 4 canonical departments |
| CID | "What's the Keap **campaign ID** (the number)?" | Bare number; no `CID` prefix |
| Brand | "Which brand — WGS or GS?" | Confirm unknown codes (KK/TWGS) before using |
| Campaign name | "What's the campaign called in Keap?" | Title Case, matches Keap |
| The tags needed | See step 2 | — |

### 2. Decide what tags they need

Ask whether they're setting up a **whole new sequence** or need **specific tags**:

- **New sequence / campaign** → produce the standard set:
  - `01. START` (entry/completion trigger) → **System** category
  - `99. STOP` (sequence exit) → **System** category
  - one **History** tag per step/segment they list (e.g. one per archetype, or
    `01. Completed`, `02. Registered`, …)
  - Ask for the list of steps/segments and their order.
- **Specific tags** → ask for each step label, then number them in order.

### 3. Pick the category for each tag (ask if ambiguous)

Use the tag-type → category mapping in the reference:

- Control/trigger (START, STOP) → **System** (`05`)
- Sequence step / entry / completion → **History** (`02`)
- Current lifecycle state → **Status** (`01`)
- Audience / lead source → **Segmentation** (`00`)

**System** and **History** are confirmed by live use. If a tag's purpose doesn't clearly
fit, **ask the user** which category it belongs in rather than guessing. Always give the
**exact category name** from the reference (e.g. `02. WGS History`, and note WGS
Segmentation is `00 WGS Segmentation` with no dot).

### 4. Validate every name before presenting

- Department spelling exact (`Fulfilment`, British — never `Fulfillment`).
- CID is a bare number.
- Step numbers zero-padded (`01`, not `1`), sequential, `99. STOP` for exit.
- Labels concise and **article-free** (`Theory Head`, not `The Theory Head`).
- Brand code confirmed.

### 5. Present a copy-ready table

Always output a table the user can act on directly:

| Tag name | Create in category | Purpose |
|---|---|---|
| `10. Marketing 3755 WGS Worship Wheel Assessment 01. START` | `05. WGS System` | Triggers the campaign |
| `10. Marketing 3755 WGS Worship Wheel Assessment 01. Campfire Strummer` | `02. WGS History` | Applied inside the Campfire Strummer sequence |

Then tell them: **create these in Keap under the listed categories.**

### 6. Remind them to record the IDs

After they create the tags, Keap assigns each an ID. If these tags drive automations or
app behavior, the IDs should be archived (for Worship Wheel they live in
`project-management/v1-launch/deliverables.md`). Offer to record them once the user has
them.

## Hard rules

- **Naming only by default.** Do not create tags in Keap unless the user is a developer
  and explicitly asks. Hand over names; they implement.
- **Never invent a slot value.** Ask until you have department, CID, brand, campaign
  name, and the step list.
- **Never replicate legacy mistakes** (`Fulfillment`, `CID` prefix, `The …` labels)
  even though they exist in the account.
- **Confirm unknown brand codes** before using them.

## Developer path (optional — only when explicitly requested)

If the user identifies as a developer and asks the skill to actually create the tags,
there's a guarded script: `src/scripts/create-keap-tag.ts` (`npm run keap:create-tag`).

- It is **dry-run by default** — Keap REST v1 has **no tag-delete endpoint**, so a
  created tag is permanent via API. Show the dry-run plan and get confirmation before
  `--confirm`.
- It dedupes by name within category, so re-running is safe.
- Requires `KEAP_SERVICE_ACCOUNT_KEY` in `.env.local`.

```bash
# spec = JSON array of { name, category }  (category = exact name or numeric id)
npm run keap:create-tag -- --spec ./tags.json            # dry-run (default)
npm run keap:create-tag -- --spec ./tags.json --confirm  # actually create
```

After creation it prints an archive-ready table of `name → id` to paste into the
project's tag record.
