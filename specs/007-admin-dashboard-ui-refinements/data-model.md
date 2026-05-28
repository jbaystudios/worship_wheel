# Phase 1 — Data Model: Admin Dashboard UI Refinements

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md)

This spec does **not** introduce any new persistent data. There are no new Supabase tables, columns, RPCs, indexes, or RLS policies. The "data model" here is therefore the **view model** — the routes, the URL-state contract, and the in-memory shapes derived from the existing spec 005 data layer.

---

## View entities (routes)

Each route is a thin Server Component that consumes existing `src/lib/admin/*` helpers and renders a curated view. Routes are grouped by section.

### Funnel

| Route | Role | Data source (existing) | Headline element |
|---|---|---|---|
| `/admin` | Overview | `getFunnelData(range, includeInternal)` | Four KPI tiles, funnel chart, biggest-drop-off callout |
| `/admin/funnel/questions` | Drill-down list | `getFunnelData(range, includeInternal).questions` | Full ordered per-question table |
| `/admin/funnel/questions/[id]` | Detail | `getFunnelData(range, includeInternal).questions[id]` + answer-distribution slice | Per-question time/abandonment/answer-distribution |

### Acquisition

| Route | Role | Data source | Headline element |
|---|---|---|---|
| `/admin/acquisition` | Overview | `getAcquisitionData(range, includeInternal)` | Totals KPI, top-3-by-volume, top-3-by-conversion (with min-volume threshold), source-mix visual |
| `/admin/acquisition/sources` | Drill-down list | same | Unified sorted table (UTM + referrer + direct merged) |
| `/admin/acquisition/sources/[id]` | Detail | same, filtered by source key | Per-source funnel, conversion rates, attributable leads |

### Outcomes

| Route | Role | Data source | Headline element |
|---|---|---|---|
| `/admin/outcomes` | Overview | `getOutcomesData(range, includeInternal)` | Archetype-mix visual, eight-element average summary, weakest-element callout |
| `/admin/outcomes/archetypes` | Drill-down list | same | Archetype list with sample sizes |
| `/admin/outcomes/archetypes/[id]` | Detail | same, filtered by archetype id | Sample size, per-element radar small-multiple, contributing leads |
| `/admin/outcomes/elements` | Drill-down list | same | Full eight-element score breakdown |

### Leads

| Route | Role | Data source | Headline element |
|---|---|---|---|
| `/admin/leads` | Overview | `getLeadsData(range, includeInternal, { limit: 10 })` + sync-state counts | Total leads KPI, sync-state tile cluster, recent-10 preview |
| `/admin/leads/all` | Drill-down list | `getLeadsData(range, includeInternal, { search, page, sort })` | Full searchable, sortable, paginated table with CSV export |
| `/admin/leads/[id]` | Detail | `getLeadById(id)` (new thin helper around existing query) | Lead profile, attribution, archetype + element scores, sync state, retry |
| `/admin/leads/sync-failures` | Drill-down list | `getLeadsData(range, includeInternal, { syncState: 'failed' })` | Failed-only table with inline retry |

> All "data sources" above are the existing `src/lib/admin/*` helpers. The only net-new helper is `getLeadById(id)` — a single-row read from `assessment_sessions` joined with the latest sync status. No new RPC.

---

## URL-state model

A single conceptual `DashboardState` object that the URL fully encodes. Server Components decode it from `searchParams`; `DrilldownLink` re-encodes it when navigating.

```ts
type DashboardState = {
  // Date range (shared with spec 005)
  from: string;            // ISO date, e.g. "2026-04-28"
  to: string;              // ISO date, e.g. "2026-05-28"

  // Toggles (shared with spec 005)
  includeInternal: boolean;

  // Per-list filters (new, only on list routes)
  search?: string;         // free-text — leads/all only
  syncState?: 'synced' | 'pending' | 'failed';  // leads/all only
  archetypeId?: string;    // outcomes drill-down filter
  sourceKey?: string;      // acquisition drill-down filter

  // Sort + pagination (new, only on list routes)
  sort?: string;           // "field:asc" or "field:desc"
  page?: number;           // 1-indexed
  pageSize?: number;       // defaults to 25
};
```

**Encoding rules**:

- Booleans serialise as `"true"`/absent. Absent ⇒ `false`.
- Dates serialise as ISO `YYYY-MM-DD`.
- `sort` uses `field:dir` form, e.g. `submittedAt:desc`.
- `page` and `pageSize` default to `1` and `25` respectively when absent.
- Unknown keys are ignored.

**Round-trip guarantee**: `encode(decode(searchParams)) === canonical(searchParams)`. Covered by `url-state.test.ts`.

See [contracts/url-state.md](./contracts/url-state.md) for the full contract.

---

## Derived in-memory shapes

These types describe the *view-time* shapes that drill-down detail views consume. They are not persisted; they are derived from existing fetch results.

### `QuestionDetail`

```ts
type QuestionDetail = {
  id: string;
  position: number;            // ordinal in the assessment
  prompt: string;
  reached: number;             // sessions that reached this question
  abandoned: number;           // sessions that abandoned at this question
  abandonmentRate: number;     // abandoned / reached
  medianMs: number;            // median time on question
  averageMs: number;
  stickingPoint: boolean;      // derived: abandonmentRate > p75 AND medianMs > p75
  answerDistribution: Array<{
    answerKey: string;
    label: string;
    count: number;
    percentage: number;
  }>;
};
```

### `SourceDetail`

```ts
type SourceDetail = {
  key: string;                 // canonical source key (utm composite, referrer host, or "direct")
  label: string;
  kind: 'utm' | 'referrer' | 'direct';
  visits: number;
  started: number;
  completed: number;
  leadsCaptured: number;
  completionRate: number;
  leadCaptureRate: number;
  funnelByStep: Array<{ step: FunnelStep; count: number; rate: number }>;
  leads: Array<LeadSummary>;
};
```

### `ArchetypeDetail`

```ts
type ArchetypeDetail = {
  id: string;
  name: string;
  sampleSize: number;
  averageElementScores: Record<ElementId, number>;  // 8 elements, 0–100
  leads: Array<LeadSummary>;
};
```

### `LeadDetail`

```ts
type LeadDetail = {
  id: string;
  email: string;
  name: string;
  submittedAt: string;            // ISO
  archetype: { id: string; name: string };
  elementScores: Record<ElementId, number>;
  source: { key: string; label: string; kind: 'utm' | 'referrer' | 'direct' };
  syncState: 'synced' | 'pending' | 'failed';
  syncedAt: string | null;
  syncError: string | null;
};
```

`LeadSummary` is a narrower projection containing `{ id, email, name, submittedAt, syncState }` for use in lists referenced from per-source / per-archetype views.

---

## State transitions

This spec introduces no new persistent state transitions. The only operational transition that surfaces in the UI is the existing Keap sync retry, exposed in two new locations:

- `/admin/leads/[id]` — "Retry sync" action on a failed lead.
- `/admin/leads/sync-failures` — inline "Retry" per row.

Both call the **existing** Keap sync retry mechanism from spec 005. No new endpoint.

---

## Relationships across views (informative)

The drill-down graph is intentionally a DAG, not a tree, so cross-section navigation composes cleanly:

```
/admin (Funnel overview)
  └── /admin/funnel/questions
        └── /admin/funnel/questions/[id]

/admin/acquisition
  └── /admin/acquisition/sources
        └── /admin/acquisition/sources/[id] ─┐
                                              │
/admin/outcomes                               │
  ├── /admin/outcomes/archetypes              │
  │     └── /admin/outcomes/archetypes/[id] ──┤
  └── /admin/outcomes/elements                │
                                              ▼
/admin/leads ── /admin/leads/all ── /admin/leads/[id]
            ─── /admin/leads/sync-failures ──┘
```

`SourceDetail` → `LeadDetail` and `ArchetypeDetail` → `LeadDetail` are lateral compositions, not new nesting. The lead detail URL is identical regardless of the entry point.
