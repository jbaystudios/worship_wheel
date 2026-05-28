# Contract: Dashboard URL State

**Spec**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md) · **Data Model**: [../data-model.md](../data-model.md)

The dashboard has **no new HTTP API surface**. The only contract this spec introduces is the **URL-state contract** that all admin routes share. Any link between admin routes (especially the new `DrilldownLink`) must conform to this contract so that back-navigation and deep-linking work uniformly.

## Search parameter contract

| Param | Type | Scope | Default | Notes |
|---|---|---|---|---|
| `from` | `YYYY-MM-DD` (ISO date) | All admin routes | 30 days ago | Period start (inclusive). Invalid values fall back to default. |
| `to` | `YYYY-MM-DD` (ISO date) | All admin routes | today | Period end (inclusive). Invalid values fall back to default. |
| `includeInternal` | `"true"` \| absent | All admin routes | `false` (absent) | Internal-traffic toggle. Anything other than the literal string `"true"` is treated as `false`. |
| `search` | string | `/admin/leads/all` only | absent | Free-text search across name + email. Trimmed; empty string treated as absent. |
| `syncState` | `"synced"` \| `"pending"` \| `"failed"` | `/admin/leads/all`, `/admin/leads/sync-failures` | absent (= all) on `/all`; pinned to `"failed"` on `/sync-failures` | On `/sync-failures` the value is fixed and the param is omitted from the URL. |
| `archetypeId` | string | `/admin/outcomes/archetypes/[id]`, `/admin/leads/all` (when arriving from archetype detail) | absent | Filters lead lists to a given archetype. |
| `sourceKey` | string | `/admin/acquisition/sources/[id]`, `/admin/leads/all` (when arriving from source detail) | absent | Filters lead lists to a given source. |
| `sort` | `field:asc` \| `field:desc` | List routes only (`/admin/leads/all`, `/admin/acquisition/sources`, `/admin/funnel/questions`) | per-page default | Whitelist of `field` per route — see "Sort whitelist" below. Invalid `field` or `dir` falls back to default. |
| `page` | positive integer | List routes only | `1` | 1-indexed. Out-of-range falls back to `1`. |
| `pageSize` | positive integer in `{10, 25, 50, 100}` | List routes only | `25` | Values outside the whitelist fall back to `25`. |

### Sort whitelist

| Route | Allowed `field` | Default sort |
|---|---|---|
| `/admin/leads/all` | `submittedAt`, `name`, `email`, `syncState` | `submittedAt:desc` |
| `/admin/acquisition/sources` | `visits`, `completionRate`, `leadCaptureRate`, `label` | `visits:desc` |
| `/admin/funnel/questions` | `position`, `abandonmentRate`, `medianMs` | `position:asc` |

## Propagation rules

1. **Inherit-by-default**: Any link from an overview into a drill-down list, or from a list into a detail view, MUST carry the parent's `from`, `to`, and `includeInternal` through. Implementation: `DrilldownLink` reads the current `searchParams`, layers the destination-specific overrides on top, and emits a fully composed URL.

2. **Reset on context change**: When navigating between *sections* (e.g. via the top-level `AdminNav`), only `from`, `to`, and `includeInternal` propagate. Section-local filters (`search`, `syncState`, `archetypeId`, `sourceKey`, `sort`, `page`, `pageSize`) reset.

3. **Cross-section links carry their context**: A link from `/admin/acquisition/sources/[id]` into a filtered `/admin/leads/all?sourceKey=...` MUST include `sourceKey`. Similarly for `/admin/outcomes/archetypes/[id]` → `/admin/leads/all?archetypeId=...`. The lead-list page reads these params and renders a clear "Filtered by source: X" / "Filtered by archetype: Y" pill with a one-click clear.

4. **Back-button restoration**: Because all state lives in the URL, browser back is the canonical restore path. No client-side history beyond the browser's own.

## Canonical form (round-trip guarantee)

The URL-state utilities (`src/lib/admin/url-state.ts`) MUST satisfy:

```ts
canonical(searchParams)  // sorts keys alphabetically, drops defaults
encode(decode(searchParams)) === canonical(searchParams)
```

Test coverage: `src/__tests__/admin/url-state.test.ts`.

Default-valued params MUST NOT appear in emitted URLs — e.g. `includeInternal=false` is encoded as the param's *absence*, not as `includeInternal=false`. This keeps URLs short and shareable.

## Authentication

The URL-state contract does **not** carry authentication. The existing middleware-level auth gate from spec 005 (US1) applies to every route added by this spec, including all detail routes. Deep-linking while signed out redirects to `/admin/login` exactly as today.

## Backwards compatibility

- `/admin`, `/admin/acquisition`, `/admin/outcomes`, `/admin/leads` URLs continue to resolve and respect their existing `from` / `to` / `includeInternal` params. Their *content* is now the overview surface; the previously-inline full table is reachable one hop away.
- Bookmarks to the old `/admin/leads?search=foo` URL continue to work: the overview page accepts and forwards `search` to the `/admin/leads/all` link on first render, and renders a one-time banner suggesting the user re-bookmark `/admin/leads/all?search=foo`. (One-shot, no persistence — the banner reads its trigger from the URL itself.)
