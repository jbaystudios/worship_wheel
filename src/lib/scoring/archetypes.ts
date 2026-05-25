import type { Archetype, ElementCode } from '@/types';
import { ELEMENT_NAMES } from '@/types';

type Scores = Record<ElementCode, number>;

const DEFAULT_ARCHETYPE: Archetype = {
  key: 'balanced_beginner',
  name: 'The Balanced Beginner',
  message: 'Great news — you have an even foundation. Everything will grow together.',
};

interface ArchetypeDefinition extends Archetype {
  match: (s: Scores, overall: number, sd: number) => boolean;
}

function sampleSD(scores: Scores): number {
  const vals = Object.values(scores);
  const n = vals.length;
  const mean = vals.reduce((sum, v) => sum + v, 0) / n;
  const variance = vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

const ARCHETYPES: ArchetypeDefinition[] = [
  {
    key: 'campfire_strummer',
    name: 'The Campfire Strummer',
    message: "You've got a solid foundation — let's expand your vocabulary and unlock the full neck.",
    match: (s) =>
      s.HM >= 5 &&
      s.RH >= 4 &&
      s.FB <= 4 &&
      s.ML <= 4 &&
      s.TO <= 4 &&
      s.TH <= 4 &&
      s.TE <= 4 &&
      s.AU <= 4,
  },
  {
    key: 'rhythm_machine',
    name: 'The Rhythm Machine',
    message: "Your groove is real — now let's expand your chord vocabulary and fretboard knowledge.",
    match: (s) => s.RH >= 7 && s.TE >= 6 && s.HM <= 4 && s.FB <= 4,
  },
  {
    key: 'theory_head',
    name: 'The Theory Head',
    message: "You understand the music — now let's get your hands and ears to match your brain.",
    match: (s) => s.TH >= 7 && s.AU >= 6 && s.TE <= 4 && s.HM <= 5,
  },
  {
    key: 'almost_there_player',
    name: 'The Almost-There Player',
    message: "You're already solid across the board. The next stage is refinement.",
    match: (s, overall) =>
      overall >= 55 && Object.values(s).every((v) => v >= 5),
  },
  {
    key: 'balanced_beginner',
    name: 'The Balanced Beginner',
    message: 'Great news — you have an even foundation. Everything will grow together.',
    match: (s, _overall, sd) =>
      Object.values(s).every((v) => v <= 4) && sd <= 1.5,
  },
  {
    key: 'uneven_intermediate',
    name: 'The Uneven Intermediate',
    message: 'The gaps between strong and weak areas are holding you back. Focused work on weakest areas transforms fastest.',
    match: (s, overall, sd) => {
      const vals = Object.values(s);
      const maxVal = Math.max(...vals);
      const minVal = Math.min(...vals);
      return maxVal - minVal >= 5 && sd > 2.0 && overall >= 30;
    },
  },
];

/** Display names for every defined archetype key, for back-references like the admin Leads view. */
export const ARCHETYPE_NAMES: Record<string, string> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.key, a.name]),
);

/** Lookup the full Archetype record (name + message) by its key. Undefined for
 *  unknown keys (legacy fallback_* rows or anything else not in ARCHETYPES). */
export const ARCHETYPES_BY_KEY: Record<string, Archetype> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.key, { key: a.key, name: a.name, message: a.message }]),
);

/**
 * Resolves an archetype key to its display name. The `fallback_<ELEMENT>`
 * branch handles legacy rows written before D-AC (2026-05-25) — `matchArchetype`
 * no longer produces those keys. Unknown keys round-trip through `humanize` so
 * the leads/outcomes views never render a raw snake_case key.
 */
export function archetypeNameFromKey(key: string): string {
  if (ARCHETYPE_NAMES[key]) return ARCHETYPE_NAMES[key];
  if (key.startsWith('fallback_')) {
    const code = key.slice('fallback_'.length) as ElementCode;
    const name = ELEMENT_NAMES[code];
    if (name) return `The ${name} Player`;
  }
  return key
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Match a profile archetype based on element scores. Evaluates archetypes in
 * priority order; returns the first match. When no rule fires, returns
 * Balanced Beginner so every user lands in one of the 6 named archetypes —
 * required by D-3 so the right Keap sequence can fire (no `fallback_*` keys).
 */
export function matchArchetype(scores: Scores): Archetype {
  const overall = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const sd = sampleSD(scores);

  for (const archetype of ARCHETYPES) {
    if (archetype.match(scores, overall, sd)) {
      return { key: archetype.key, name: archetype.name, message: archetype.message };
    }
  }

  return DEFAULT_ARCHETYPE;
}
