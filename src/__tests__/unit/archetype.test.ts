import { describe, it, expect } from 'vitest';
import { matchArchetype, archetypeShortName, ARCHETYPES_BY_KEY } from '@/lib/scoring/archetypes';
import type { ElementCode } from '@/types';

describe('archetypeShortName', () => {
  it('strips the leading "The " from every named archetype', () => {
    for (const { name } of Object.values(ARCHETYPES_BY_KEY)) {
      const short = archetypeShortName(name);
      expect(short.startsWith('The ')).toBe(false);
      // e.g. "The Campfire Strummer" → "Campfire Strummer"
      expect(name.endsWith(short)).toBe(true);
    }
  });

  it('passes names without a leading "The" through unchanged', () => {
    expect(archetypeShortName('Rhythm Machine')).toBe('Rhythm Machine');
  });
});

/** Helper: create a scores map from ordered array [FB, HM, ML, RH, TO, TH, TE, AU] */
function scores(vals: number[]): Record<ElementCode, number> {
  const codes: ElementCode[] = ['FB', 'HM', 'ML', 'RH', 'TO', 'TH', 'TE', 'AU'];
  return Object.fromEntries(codes.map((c, i) => [c, vals[i]])) as Record<ElementCode, number>;
}

describe('matchArchetype', () => {
  // ── Campfire Strummer ───────────────────────────────────────
  // HM ≥ 5, RH ≥ 4, all others ≤ 4

  it('matches Campfire Strummer when HM ≥ 5, RH ≥ 4, all others ≤ 4', () => {
    //                              FB HM ML RH TO TH TE AU
    const result = matchArchetype(scores([3, 5, 4, 4, 2, 3, 4, 2]));
    expect(result.key).toBe('campfire_strummer');
  });

  it('does not match Campfire Strummer when HM < 5', () => {
    const result = matchArchetype(scores([3, 4, 4, 4, 2, 3, 4, 2]));
    expect(result.key).not.toBe('campfire_strummer');
  });

  // ── Rhythm Machine ─────────────────────────────────────────
  // RH ≥ 7, TE ≥ 6, HM ≤ 4, FB ≤ 4

  it('matches Rhythm Machine when RH ≥ 7, TE ≥ 6, HM ≤ 4, FB ≤ 4', () => {
    const result = matchArchetype(scores([4, 4, 5, 7, 5, 5, 6, 5]));
    expect(result.key).toBe('rhythm_machine');
  });

  it('does not match Rhythm Machine when FB > 4', () => {
    const result = matchArchetype(scores([5, 4, 5, 7, 5, 5, 6, 5]));
    expect(result.key).not.toBe('rhythm_machine');
  });

  // ── Theory Head ────────────────────────────────────────────
  // TH ≥ 7, AU ≥ 6, TE ≤ 4, HM ≤ 5

  it('matches Theory Head when TH ≥ 7, AU ≥ 6, TE ≤ 4, HM ≤ 5', () => {
    const result = matchArchetype(scores([5, 5, 5, 5, 5, 7, 4, 6]));
    expect(result.key).toBe('theory_head');
  });

  it('does not match Theory Head when TE > 4', () => {
    const result = matchArchetype(scores([5, 5, 5, 5, 5, 7, 5, 6]));
    expect(result.key).not.toBe('theory_head');
  });

  // ── Almost-There Player ────────────────────────────────────
  // overall ≥ 55, all elements ≥ 5

  it('matches Almost-There Player when overall ≥ 55, all elements ≥ 5', () => {
    //                              FB HM ML RH TO TH TE AU  = 56
    const result = matchArchetype(scores([7, 7, 7, 7, 7, 7, 7, 7]));
    expect(result.key).toBe('almost_there_player');
  });

  it('does not match Almost-There Player when any element < 5', () => {
    const result = matchArchetype(scores([4, 8, 8, 8, 8, 8, 8, 8]));
    expect(result.key).not.toBe('almost_there_player');
  });

  it('does not match Almost-There Player when overall < 55', () => {
    // All 6 → 48, which is < 55
    const result = matchArchetype(scores([6, 6, 6, 6, 6, 6, 6, 6]));
    expect(result.key).not.toBe('almost_there_player');
  });

  // ── Balanced Beginner ──────────────────────────────────────
  // all elements ≤ 4, SD ≤ 1.5

  it('matches Balanced Beginner when all elements ≤ 4 and SD ≤ 1.5', () => {
    const result = matchArchetype(scores([3, 3, 3, 3, 3, 3, 3, 3]));
    expect(result.key).toBe('balanced_beginner');
  });

  // Note: post-D-AC there is no observable difference between "matches the
  // Balanced Beginner rule" and "fell through to the default" — both return
  // `balanced_beginner`. The pre-D-AC negative assertions for this rule were
  // removed because they are no longer falsifiable through the public API.

  // ── Uneven Intermediate ────────────────────────────────────
  // max - min ≥ 5, SD > 2.0, overall ≥ 30

  it('matches Uneven Intermediate when max-min ≥ 5, SD > 2.0, overall ≥ 30', () => {
    //                              FB HM ML RH TO TH TE AU  = 36
    // max=8, min=2, diff=6, SD≈2.33, overall=36
    const result = matchArchetype(scores([2, 8, 2, 5, 2, 5, 5, 7]));
    expect(result.key).toBe('uneven_intermediate');
  });

  it('does not match Uneven Intermediate when overall < 30', () => {
    //                              FB HM ML RH TO TH TE AU = 14, max-min=6
    const result = matchArchetype(scores([1, 7, 1, 1, 1, 1, 1, 1]));
    expect(result.key).not.toBe('uneven_intermediate');
  });

  // ── Priority ordering ──────────────────────────────────────

  it('evaluates specific archetypes before broad patterns', () => {
    // This profile matches Campfire Strummer AND could match Uneven Intermediate
    // HM=5, RH=4, all others ≤ 4, max-min=4, but Campfire is checked first
    const result = matchArchetype(scores([1, 5, 1, 4, 1, 1, 1, 1]));
    expect(result.key).toBe('campfire_strummer');
  });

  // ── Default fallback (D-AC) ────────────────────────────────
  // When no named rule matches, every profile lands in Balanced Beginner so
  // the Keap archetype sequence (D-4) always has somewhere to fire.

  const NAMED_KEYS = new Set([
    'campfire_strummer',
    'rhythm_machine',
    'theory_head',
    'almost_there_player',
    'balanced_beginner',
    'uneven_intermediate',
  ]);

  it('returns Balanced Beginner when no specific rule matches', () => {
    //                              FB HM ML RH TO TH TE AU
    // All 5s: too high for Balanced Beginner (≤4), too low for Almost-There
    // (overall=40 < 55), no spread for Uneven Intermediate. Pre-D-AC this
    // hit the fallback_ path.
    const result = matchArchetype(scores([5, 5, 5, 5, 5, 5, 5, 5]));
    expect(result.key).toBe('balanced_beginner');
  });

  it('never returns a fallback_<ELEMENT> key', () => {
    const result = matchArchetype(scores([4, 4, 4, 4, 4, 6, 4, 4]));
    expect(result.key).not.toMatch(/^fallback_/);
    expect(NAMED_KEYS.has(result.key)).toBe(true);
  });

  // ── Coverage sweep (D-AC Path A proof) ─────────────────────
  // Sweep the [0,10]⁸ score space at granularity 2 (6⁸ = 1,679,616 profiles)
  // and assert every result lands in one of the 6 named archetypes — no
  // fallback_ keys, no unknown keys. This locks in D-AC's invariant.

  it('every (FB..AU) ∈ {0,2,4,6,8,10}⁸ profile lands in a named archetype', () => {
    const values = [0, 2, 4, 6, 8, 10];
    let total = 0;
    const seen = new Map<string, number>();
    for (const fb of values)
      for (const hm of values)
        for (const ml of values)
          for (const rh of values)
            for (const to of values)
              for (const th of values)
                for (const te of values)
                  for (const au of values) {
                    const result = matchArchetype(scores([fb, hm, ml, rh, to, th, te, au]));
                    if (!NAMED_KEYS.has(result.key)) {
                      throw new Error(
                        `unnamed key "${result.key}" for [${fb},${hm},${ml},${rh},${to},${th},${te},${au}]`,
                      );
                    }
                    seen.set(result.key, (seen.get(result.key) ?? 0) + 1);
                    total += 1;
                  }
    expect(total).toBe(values.length ** 8);
    // Every named archetype is reachable at this granularity.
    for (const key of NAMED_KEYS) {
      expect(seen.get(key) ?? 0).toBeGreaterThan(0);
    }
  });

  // ── Every archetype has required fields ────────────────────

  it('always returns key, name, and message', () => {
    const profiles = [
      [3, 5, 4, 4, 2, 3, 4, 2],  // Campfire
      [4, 4, 5, 7, 5, 5, 6, 5],  // Rhythm Machine
      [5, 5, 5, 5, 5, 7, 4, 6],  // Theory Head
      [7, 7, 7, 7, 7, 7, 7, 7],  // Almost-There
      [3, 3, 3, 3, 3, 3, 3, 3],  // Balanced Beginner
      [5, 7, 3, 5, 2, 5, 5, 3],  // Uneven Intermediate
      [5, 5, 5, 5, 5, 5, 5, 5],  // Defaults to Balanced Beginner
    ];

    for (const profile of profiles) {
      const result = matchArchetype(scores(profile));
      expect(result.key).toBeTruthy();
      expect(result.name).toBeTruthy();
      expect(result.message).toBeTruthy();
    }
  });
});
