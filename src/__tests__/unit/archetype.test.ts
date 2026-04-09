import { describe, it, expect } from 'vitest';
import { matchArchetype } from '@/lib/scoring/archetypes';
import type { ElementCode } from '@/types';

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

  it('does not match Balanced Beginner when any element > 4', () => {
    const result = matchArchetype(scores([3, 3, 3, 5, 3, 3, 3, 3]));
    expect(result.key).not.toBe('balanced_beginner');
  });

  it('does not match Balanced Beginner when SD > 1.5', () => {
    // [1, 4, 1, 4, 1, 4, 1, 4] → high SD but all ≤ 4
    const result = matchArchetype(scores([1, 4, 1, 4, 1, 4, 1, 4]));
    expect(result.key).not.toBe('balanced_beginner');
  });

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

  // ── Fallback ───────────────────────────────────────────────

  it('assigns fallback archetype based on strongest element when no match', () => {
    // No specific archetype matches: moderate scores, not uneven enough
    //                              FB HM ML RH TO TH TE AU
    const result = matchArchetype(scores([5, 5, 5, 5, 5, 5, 5, 5]));
    expect(result.key).toMatch(/^fallback_/);
  });

  it('fallback uses the strongest element code', () => {
    // TH is highest at 6
    const result = matchArchetype(scores([4, 4, 4, 4, 4, 6, 4, 4]));
    expect(result.key).toBe('fallback_TH');
    expect(result.name).toContain('Theory');
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
      [5, 5, 5, 5, 5, 5, 5, 5],  // Fallback
    ];

    for (const profile of profiles) {
      const result = matchArchetype(scores(profile));
      expect(result.key).toBeTruthy();
      expect(result.name).toBeTruthy();
      expect(result.message).toBeTruthy();
    }
  });
});
