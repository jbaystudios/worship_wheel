import { describe, it, expect } from 'vitest';
import { computeNextSelection } from '@/components/assessment/ChecklistCard';
import { questions } from '@/data/questions';
import type { ChecklistItem, ChecklistQuestion } from '@/types';

function getChecklistQuestion(id: string): ChecklistQuestion {
  const q = questions.find((x) => x.id === id);
  if (!q || q.type !== 'checklist') {
    throw new Error(`Expected checklist question ${id}`);
  }
  return q;
}

function metaIndices(items: ChecklistItem[]): number[] {
  return items.filter((i) => i.isAllOfAbove).map((i) => i.index);
}

const SINGLE_META_IDS = ['th_02', 'te_02', 'ml_02', 'rh_02', 'to_02', 'au_02'];

describe('computeNextSelection — mutual exclusivity', () => {
  for (const id of SINGLE_META_IDS) {
    describe(`${id} (single meta)`, () => {
      const q = getChecklistQuestion(id);
      const metas = metaIndices(q.items);
      const metaIdx = metas[0]!;
      const individualIdx = q.items.find((i) => !i.isAllOfAbove)!.index;
      const secondIndividualIdx = q.items.filter((i) => !i.isAllOfAbove)[1]!.index;

      it('has exactly one meta item', () => {
        expect(metas).toHaveLength(1);
      });

      it('selecting meta from empty state yields only the meta', () => {
        expect(computeNextSelection([], metaIdx, q.items)).toEqual([metaIdx]);
      });

      it('selecting meta with individuals pre-selected clears the individuals', () => {
        const next = computeNextSelection(
          [individualIdx, secondIndividualIdx],
          metaIdx,
          q.items,
        );
        expect(next).toEqual([metaIdx]);
      });

      it('selecting an individual when meta is active clears the meta', () => {
        const next = computeNextSelection([metaIdx], individualIdx, q.items);
        expect(next).toEqual([individualIdx]);
      });

      it('toggling meta off returns to empty state', () => {
        expect(computeNextSelection([metaIdx], metaIdx, q.items)).toEqual([]);
      });

      it('adding a second individual when one is active keeps both', () => {
        const next = computeNextSelection([individualIdx], secondIndividualIdx, q.items);
        expect(next).toContain(individualIdx);
        expect(next).toContain(secondIndividualIdx);
        expect(next).not.toContain(metaIdx);
      });
    });
  }

  describe('hm_02 (multi meta)', () => {
    const q = getChecklistQuestion('hm_02');
    const metas = metaIndices(q.items);
    const twoZone = 7;
    const threeZone = 8;
    const individualIdx = 0;

    it('has two meta items (two-zone + three-zone)', () => {
      expect(metas).toHaveLength(2);
      expect(metas).toContain(twoZone);
      expect(metas).toContain(threeZone);
    });

    it('selecting three-zone meta clears two-zone meta', () => {
      expect(computeNextSelection([twoZone], threeZone, q.items)).toEqual([threeZone]);
    });

    it('selecting two-zone meta clears three-zone meta', () => {
      expect(computeNextSelection([threeZone], twoZone, q.items)).toEqual([twoZone]);
    });

    it('selecting an individual clears both metas', () => {
      const next = computeNextSelection([twoZone, threeZone], individualIdx, q.items);
      expect(next).toEqual([individualIdx]);
    });

    it('selecting a meta clears selected individuals', () => {
      const next = computeNextSelection([0, 1, 2], threeZone, q.items);
      expect(next).toEqual([threeZone]);
    });
  });

  describe('fb_02 (no meta — regression guard)', () => {
    const q = getChecklistQuestion('fb_02');

    it('has no meta items', () => {
      expect(metaIndices(q.items)).toHaveLength(0);
    });

    it('supports free multi-select', () => {
      let state: number[] = [];
      state = computeNextSelection(state, 0, q.items);
      state = computeNextSelection(state, 2, q.items);
      state = computeNextSelection(state, 4, q.items);
      expect(state.sort()).toEqual([0, 2, 4]);
    });

    it('toggling an existing item removes it', () => {
      expect(computeNextSelection([0, 1, 2], 1, q.items)).toEqual([0, 2]);
    });
  });
});
