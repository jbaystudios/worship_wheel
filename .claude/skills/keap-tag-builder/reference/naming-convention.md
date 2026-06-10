# WGS Keap Tag Naming Convention (reference)

This is the authoritative reference for the skill. It was reverse-engineered from
the **1,435 live tags** in the WGS Keap account (read 2026-06-10) and should be
kept in sync if the house convention changes.

## The pattern

```
<DD>. <Department>  <CID>  <Brand>  <Campaign Name>  <SS>. <Step Label>
```

Example (live): `10. Marketing 3755 WGS Worship Wheel Assessment 01. START`

| Slot | What it is | Rule |
|---|---|---|
| `<DD>. <Department>` | Funnel stage the campaign belongs to | Pick from the canonical list below — exact spelling |
| `<CID>` | The Keap **campaign's numeric ID** | Bare number, e.g. `3755`. Do **not** prefix `CID` (legacy style) |
| `<Brand>` | Brand the campaign runs under | Pick from the brand list below |
| `<Campaign Name>` | Human-readable campaign name | Match how the campaign is named in Keap, Title Case |
| `<SS>. <Step Label>` | Zero-padded step number + concise label | `01.` = first/entry step, `99.` = STOP/exit. No articles |

## Canonical departments

Use these exact strings (frequency in live data in parentheses):

- `10. Marketing` (261)
- `20. Sales` (154)
- `30. Fulfilment` (134) — **British spelling is canonical**
- `50. Internal` (46)

> ⚠️ Legacy data also contains `30. Fulfillment` (21, American spelling) and a stray
> `02. Sales` (1). These are mistakes — do not replicate them.

## Brands

| Code | Brand | Status |
|---|---|---|
| `WGS` | Worship Guitar Skills | ✅ Primary |
| `GS` | Guitar Skills | ✅ Active |
| `KK` | *(confirm with owner before use)* | ⚠️ Legacy / unconfirmed |
| `TWGS` | *(confirm with owner before use)* | ⚠️ Legacy / rare (4 tags) |

If a user gives a brand code not in this table, **ask them to confirm** rather than
inventing one.

## Step numbering

- `01.` … `0N.` — sequential steps within the campaign, zero-padded to two digits.
- `01.` is conventionally the **entry / START / completion** marker.
- `99. STOP` — the sequence-exit / stop tag.
- Labels are **concise and article-free**: `Theory Head`, not `The Theory Head`;
  `Completed`, `Registered`, `Week 1 Completed`.

## Categories — where each tag lives

Tags are grouped into Keap **categories**. Categories are per-brand and follow a
parallel `NN. <Brand> <Type>` numbering. **Tell the user the exact category name +
ID** so they select the right one in Keap.

### Tag-type → category-type mapping

| Tag purpose | Category type | Examples |
|---|---|---|
| **Control / trigger** — START (campaign trigger), STOP (exit) | **System** (`05`) | `… 01. START`, `… 99. STOP` |
| **Sequence step / entry / completion** — "this contact received/entered X" | **History** (`02`) | `… 01. Campfire Strummer`, `… 05. Complete` |
| **Current lifecycle state** — a status the contact *is in* now | **Status** (`01`) | member / cancelled / paused states |
| **Audience / lead source** — how they entered, segmentation | **Segmentation** (`00`) | opt-in source, `… Opted In [YouTube]` |
| **Purchase / customer** | **Customer** | buyer flags |

> ✅ **System** and **History** mappings are confirmed by live use (Worship Wheel).
> Status / Segmentation / Customer are inferred from category-name semantics — if a
> tag's purpose is ambiguous, **ask the user** which category it belongs in.

### Exact category names + IDs (live, read 2026-06-10)

**WGS** (note `Segmentation` has no dot after `00` — a live inconsistency; use the exact name):

| Type | Exact category name | ID |
|---|---|---|
| Segmentation | `00 WGS Segmentation` | 136 |
| Status | `01. WGS Status` | 134 |
| History | `02. WGS History` | 142 |
| Customer | `0030 WGS Customer` | 145 |
| System | `05. WGS System` | 132 |
| Cancel | `320 WGS Cancel` | 158 |
| Refund | `340 WGS Refund` | 147 |

**GS:**

| Type | Exact category name | ID |
|---|---|---|
| Segmentation | `00. GS Segmentation` | 110 |
| Status | `01. GS Status` | 106 |
| History | `02. GS History` | 108 |
| System | `05. GS System` | 104 |
| Cancel | `320 GS Cancel` | 112 |
| Refund | `340 GS Refund` | 114 |

**KK:**

| Type | Exact category name | ID |
|---|---|---|
| Segmentation | `00. KK Segmentation` | 157 |
| Status | `01. KK Status` | 150 |
| History | `02. KK History` | 152 |
| Customer | `03. KK Customer` | 154 |
| System | `05. KK System` | 156 |

> Category IDs are only needed for the optional developer/API path. Non-developers
> just need the **exact category name** to pick in the Keap UI.

## Worked example — a new follow-up campaign

Campaign: *"Worship Wheel Assessment"*, CID `3755`, brand WGS, Marketing. Six
archetype follow-up sequences gated by a decision diamond.

| Tag name | Category (UI) | Purpose |
|---|---|---|
| `10. Marketing 3755 WGS Worship Wheel Assessment 01. START` | `05. WGS System` | Completion tag — triggers the campaign |
| `10. Marketing 3755 WGS Worship Wheel Assessment 99. STOP` | `05. WGS System` | Sequence exit |
| `10. Marketing 3755 WGS Worship Wheel Assessment 01. Campfire Strummer` | `02. WGS History` | Applied inside the Campfire Strummer sequence |
| `… 02. Rhythm Machine` | `02. WGS History` | Applied inside the Rhythm Machine sequence |
| `… 03. Theory Head` | `02. WGS History` | … |
| `… 04. Almost-There Player` | `02. WGS History` | … |
| `… 05. Balanced Beginner` | `02. WGS History` | … |
| `… 06. Uneven Intermediate` | `02. WGS History` | … |

## API capability limits (for the developer path only)

- ❌ **No tag-delete endpoint** in Keap REST v1 — a created tag is permanent via API.
  Mistakes must be removed by hand in the Keap UI. This is why the creation script
  is dry-run-by-default and dedupe-guarded.
- ❌ **No categories-list endpoint** — category IDs are discovered by reading existing
  tags. A brand-new category needs `POST /v1/tags/categories` (create it in the UI
  unless you know what you're doing).
- ⚠️ Keap **allows duplicate tag names** — dedupe is client-side, per category.
