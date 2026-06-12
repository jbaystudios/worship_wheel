// Demo data + cascade resolver for the planning canvas.
// This mirrors the two-tier "source + campaign" registry shape from
// plan/v2/multi-entry-points.md. It is illustrative scoping data, NOT the
// production lead-source wiring — kept local to the canvas feature on purpose.

export type HeroConfig = {
  eyebrow: string;
  headline: string;
  subcopy: string;
  ctaLabel: string;
  badge: string;
  bgImage: string;
};

export const HERO_FIELDS: (keyof HeroConfig)[] = [
  'eyebrow',
  'headline',
  'subcopy',
  'ctaLabel',
  'badge',
  'bgImage',
];

// Tier 1 — global default: the REAL current hero copy (src/app/page.tsx).
export const GLOBAL_DEFAULT: HeroConfig = {
  eyebrow: 'Free Worship Guitar Assessment',
  headline: 'Discover Your Worship Guitar Strengths',
  subcopy:
    'Take the Worship Wheel assessment and get a personalised breakdown of your skills across 8 essential musical dimensions.',
  ctaLabel: 'Start the Assessment →',
  badge: '5 minutes · Completely free',
  bgImage: '/hero-bg.webp',
};

// Tier 2 — source-level overrides (channel). Only what differs from default.
// `leadSource` sets the single Keap Lead Source custom field; `keapTag` is the
// per-source tag campaigns trigger off.
export const SOURCES: Record<
  string,
  { label: string; leadSource?: string; keapTag?: string } & Partial<HeroConfig>
> = {
  instagram: {
    label: 'Instagram',
    leadSource: 'Instagram',
    keapTag: 'Source: Instagram',
    eyebrow: 'Welcome from Instagram',
    headline: 'Saw the Post? Find Your Worship-Guitar Blind Spots',
  },
};

// Tier 3 — campaign/creative overrides. Only what differs from the source.
// `keapTag` is an additional creative-level tag — Lead Source stays the channel.
export const CAMPAIGNS: Record<
  string,
  { label: string; source: string; keapTag?: string } & Partial<HeroConfig>
> = {
  'worship-wheel-1': {
    label: 'worship-wheel-1 · barre-chord reel',
    source: 'instagram',
    keapTag: 'Campaign: worship-wheel-1',
    headline: "Saw the Barre-Chord Reel? Find the Gaps It Didn't Cover",
    subcopy:
      "You've got the shapes down — now see exactly which of the 8 dimensions are holding your playing back.",
  },
};

export type Variant = {
  id: string;
  tab: string; // short label for the toggle
  url: string; // the URL we'd hand out
  sourceKey?: string;
  campaignKey?: string;
};

// The three states we walk a client through, low → high specificity.
export const VARIANTS: Variant[] = [
  { id: 'default', tab: 'No params', url: 'worshipwheel.com/' },
  {
    id: 'instagram',
    tab: 'utm_source=instagram',
    url: 'worshipwheel.com/?utm_source=instagram',
    sourceKey: 'instagram',
  },
  {
    id: 'ww1',
    tab: '+ utm_campaign=worship-wheel-1',
    url: 'worshipwheel.com/?utm_source=instagram&utm_campaign=worship-wheel-1',
    sourceKey: 'instagram',
    campaignKey: 'worship-wheel-1',
  },
];

export type Tier = 'default' | 'source' | 'campaign';

export type ResolvedHero = {
  config: HeroConfig;
  // which tier set each field's final value — drives the highlight colours
  provenance: Record<keyof HeroConfig, Tier>;
};

// Deep-merge global ← source ← campaign, field by field, tracking provenance.
export function resolveHero(variant: Variant): ResolvedHero {
  const config = { ...GLOBAL_DEFAULT };
  const provenance = {} as Record<keyof HeroConfig, Tier>;
  HERO_FIELDS.forEach((f) => {
    provenance[f] = 'default';
  });

  if (variant.sourceKey && SOURCES[variant.sourceKey]) {
    const src = SOURCES[variant.sourceKey];
    HERO_FIELDS.forEach((f) => {
      if (src[f] !== undefined) {
        config[f] = src[f] as string;
        provenance[f] = 'source';
      }
    });
  }

  if (variant.campaignKey && CAMPAIGNS[variant.campaignKey]) {
    const camp = CAMPAIGNS[variant.campaignKey];
    HERO_FIELDS.forEach((f) => {
      if (camp[f] !== undefined) {
        config[f] = camp[f] as string;
        provenance[f] = 'campaign';
      }
    });
  }

  return { config, provenance };
}

// The Keap side of the same parameters: one Lead Source custom field (the
// channel) + tags that accumulate by tier. Demonstrates "different tags based
// on the URL" while keeping the reporting dimension (Lead Source) clean.
export type KeapTag = { label: string; tier: Exclude<Tier, 'default'> };
export type ResolvedKeap = { leadSource: string; tags: KeapTag[] };

export function resolveKeap(variant: Variant): ResolvedKeap {
  let leadSource = 'Direct / Organic';
  const tags: KeapTag[] = [];

  if (variant.sourceKey && SOURCES[variant.sourceKey]) {
    const src = SOURCES[variant.sourceKey];
    if (src.leadSource) leadSource = src.leadSource;
    if (src.keapTag) tags.push({ label: src.keapTag, tier: 'source' });
  }

  if (variant.campaignKey && CAMPAIGNS[variant.campaignKey]) {
    const camp = CAMPAIGNS[variant.campaignKey];
    if (camp.keapTag) tags.push({ label: camp.keapTag, tier: 'campaign' });
  }

  return { leadSource, tags };
}
