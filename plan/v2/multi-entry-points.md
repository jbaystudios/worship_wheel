# Multi Entry Points & Lead-Source Tracking

**Status:** 🔍 exploring
**Theme:** Growth & distribution
**Captured:** 2026-06-12

## The idea

Support multiple acquisition entry points for the assessment (internal email list, YouTube, Facebook, Instagram, …) so each lead is tagged by origin and a **Lead Source** custom field is populated in Keap. Goal: trace sales back to the specific channel that produced the lead.

v1 starts with the internal monthly coaching members email list. v2 adds dedicated, trackable entry points per channel.

## Constraint

Do **not** duplicate logic per entry point. Adding a new channel must be a config change, not a code change.

## Recommended pattern: data-driven, not rule-per-source

Make the entry point a piece of **data**, not code. One generic mechanism reads a source value from the URL, looks it up in a single registry, and the downstream pipeline is identical for every source.

### 1. Single source registry (one source of truth)
e.g. `src/data/lead-sources.json` — the *only* file touched to add a channel:
```jsonc
{
  "youtube":   { "label": "YouTube",    "keapTag": 201, "leadSourceValue": "YouTube" },
  "facebook":  { "label": "Facebook",   "keapTag": 202, "leadSourceValue": "Facebook" },
  "instagram": { "label": "Instagram",  "keapTag": 203, "leadSourceValue": "Instagram" },
  "email":     { "label": "Email List", "keapTag": 204, "leadSourceValue": "Coaching Members" }
}
```

### 2. UTM-compatible capture — one canonical URL, no duplicate pages
Keep `worshipwheel.com` as the single app. Entry points are links carrying the source:
- **Paid / trackable links:** standard `?utm_source=youtube` → also gives GA4 attribution for free (same tag feeds Keap *and* analytics).
- **Organic / link-in-bio:** optional pretty short-link via ONE dynamic route `app/go/[source]/page.tsx` that 302-redirects to the landing with the right UTMs. `/go/youtube`, `/go/facebook`, … all handled by the same route.

### 3. First-touch persistence
On landing: read `utm_source` (fallback `src`), normalise against the registry, store in a first-party cookie + sessionStorage — **do not overwrite if already set**. First-touch attribution survives the multi-step funnel and return visits, so sales trace to the true origin.

### 4. One Keap writeback, unchanged
Existing single sync (`src/lib/keap/sync.ts`, `PUT /v1/contacts` Email-dedup) reads the resolved source from the submit payload, sets **one Lead Source custom field**, applies the **one mapped tag**. A lookup, not a branch.

## "A version for a channel" = three layers (not just UTM)

The tool stays **exactly as is** — everything below is additive (links + registry + optional landing overrides). No forked pages. Worked example: Instagram.

### Layer 1 — Tracking
UTM (`?utm_source=instagram`) + branded short-link + lead-source tag/field. The "who sent them" layer.

### Layer 2 — Channel-aware experience (message-match)
Because we know the source, the same single landing greets them differently — message-match is a major conversion lever (a visitor who just watched the IG reel converts better on a page echoing that hook). No duplication: the **same registry row** carries *optional* overrides:
```jsonc
"instagram": {
  "label": "Instagram", "keapTag": 203, "leadSourceValue": "Instagram",
  "heroHeadline": "Saw the reel? Let's find your worship-guitar blind spots.",
  "heroImage": "ig-hero.jpg"   // optional — falls back to default if absent
}
```
One landing reads the resolved source, swaps in any overrides present, else default.

#### Two-tier granularity: source + campaign/creative (cascade)
We can go one level deeper than channel — down to the specific creative — using a **cascade** (CSS-specificity for content). Three tiers, most-specific wins, each tier specifies only what *differs*:

1. **Global default** (current landing)
2. **Source** (`instagram`) — channel-level overrides
3. **Campaign/creative** (`worship-wheel-1`) — overrides that win over source

Standard UTM taxonomy: `utm_source` = channel, `utm_campaign` = creative.

```jsonc
// lead-sources.json — channel level (tracking + channel defaults)
"instagram": {
  "label": "Instagram", "keapTag": 203, "leadSourceValue": "Instagram",
  "heroHeadline": "Saw the post? Let's find your worship-guitar blind spots.",
  "heroImage": "ig-hero.jpg"
}

// campaigns.json — creative level (ONLY what differs from the source)
"worship-wheel-1": {
  "source": "instagram",
  "heroHeadline": "Saw the barre-chord reel? Find the gaps it didn't cover.",
  "heroImage": "ig-reel-ww1.jpg",
  "keapCampaignTag": 301   // optional — track the exact creative in Keap too
}
```

**URL:** `?utm_source=instagram&utm_campaign=worship-wheel-1` (or pretty `/go/instagram/worship-wheel-1`).
**Resolution:** deep-merge `global ← instagram ← worship-wheel-1`, field by field. Unknown campaign → source-level. Unknown source → global default. Never breaks.

**Four guardrails that keep this safe + scalable:**
- **URL supplies the *key*, never the *content*.** `worship-wheel-1` is only a lookup key into the committed registry; headline/image come from the repo, not the URL → nobody can inject arbitrary copy/imagery via a crafted URL.
- **Keep Keap dimensions separate.** Lead Source stays `"Instagram"` (clean channel reporting); the creative goes in its own tag / "Campaign" custom field → report channel-wide *and* drill to a single creative without cross-pollution.
- **GA4 gets campaign analytics free** — `utm_campaign` is native; funnel breaks down by creative automatically.
- **Keep the registry lean** — only add a campaign entry when messaging actually differs; no entry → inherits source defaults. No dead rows.

### Layer 3 — Channel mechanics (the genuinely IG-specific gotchas)
- **Link delivery is the real IG problem.** Captions aren't clickable. The "IG version" is mostly *how the link gets out*: bio link / link-in-bio tool, **Story link stickers** (clickable), or an **auto-DM funnel** (ManyChat: "comment WHEEL → bot DMs the link"). Each mechanic can carry its own UTM/short-link.
- **In-app browser caveat — QA inside the IG app.** IG opens links in its own webview, which can affect cookie/sessionStorage persistence (our first-touch attribution depends on it) and analytics. Test the funnel inside Instagram, not just a normal browser.
- **Don't rely on referrer detection.** IG in-app taps often send empty / `l.instagram.com` referrer — encode the source explicitly in the link (UTM/short-link), never infer from referrer. (Reinforces the registry approach.)
- **If running IG ads:** add Meta Pixel + Conversions API (consent-gated by CookieBot) to fire a completion event → Meta optimisation + retargeting non-finishers.

## Decisions flagged

- **Custom field AND tag, deliberately:** Lead Source *custom field* = reporting/segmentation dimension (one value per contact, clean for sales tracing). Per-source *tag* = what Keap campaigns trigger automation off. Same mechanism sets both.
- **Fallback:** unknown/direct traffic → default "Direct/Organic", never blank.

## Open questions

- First-touch vs last-touch — confirm first-touch is what Charl wants for sales attribution.
- Do we want per-source *follow-up sequences* in Keap (different nurture per channel), or just reporting? Affects whether tags need to be campaign-triggering.
- Naming convention for the per-source tags — likely route through the `keap-tag-builder` skill for consistency.
- Pretty short-links (`/go/[source]`) now, or UTM-only to start?
- Does the admin dashboard (005/007) need a lead-source breakdown view to close the loop visually?

## Related
- [[keap-sync-arch]], [[keap-custom-fields]] (numeric field IDs via `GET /v1/contacts/model`)
- Keap tag naming → `keap-tag-builder` skill
