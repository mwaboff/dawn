import { CardRow } from './card-table.model';
import { BulkSrdGroupOutcome } from './models/bulk-srd.model';
import { bulkResultMessage, extractErrorMessage, groupSelectedRows, summarizeBulkOutcomes } from './bulk-srd.utils';

function row(id: number, srdType: CardRow['srdType']): CardRow {
  return { id, name: `Row ${id}`, typeLabel: 'x', link: [], cells: {}, srdType };
}

describe('bulk-srd.utils', () => {
  describe('groupSelectedRows', () => {
    it('groups selected rows by their srdType', () => {
      const rows = [row(1, 'WEAPON'), row(2, 'WEAPON'), row(3, 'ARMOR')];
      const selected = new Set(['WEAPON:1', 'WEAPON:2', 'ARMOR:3']);
      const groups = groupSelectedRows(rows, selected);
      expect(groups.get('WEAPON')).toEqual([1, 2]);
      expect(groups.get('ARMOR')).toEqual([3]);
    });

    it('excludes rows that are not selected', () => {
      const rows = [row(1, 'WEAPON'), row(2, 'WEAPON')];
      const groups = groupSelectedRows(rows, new Set(['WEAPON:1']));
      expect(groups.get('WEAPON')).toEqual([1]);
    });

    it('excludes rows with no flaggable type even if their key is selected', () => {
      const rows = [row(1, null)];
      const groups = groupSelectedRows(rows, new Set(['none:1']));
      expect(groups.size).toBe(0);
    });

    it('returns an empty map when nothing is selected', () => {
      expect(groupSelectedRows([row(1, 'WEAPON')], new Set()).size).toBe(0);
    });
  });

  describe('extractErrorMessage', () => {
    it('extracts the backend ErrorResponse message', () => {
      const err = { error: { message: 'Cannot flag srd on type=SUBCLASS_CARD' } };
      expect(extractErrorMessage(err, 'fallback')).toBe('Cannot flag srd on type=SUBCLASS_CARD');
    });

    it('falls back when the error has no message field', () => {
      expect(extractErrorMessage({ error: {} }, 'fallback')).toBe('fallback');
    });

    it('falls back for a network-level error with no body', () => {
      expect(extractErrorMessage(new Error('Network error'), 'fallback')).toBe('fallback');
    });

    it('falls back for a non-string message', () => {
      expect(extractErrorMessage({ error: { message: 42 } }, 'fallback')).toBe('fallback');
    });

    it('falls back for null/undefined', () => {
      expect(extractErrorMessage(null, 'fallback')).toBe('fallback');
      expect(extractErrorMessage(undefined, 'fallback')).toBe('fallback');
    });
  });

  describe('summarizeBulkOutcomes', () => {
    it('sums requested and updated counts across groups', () => {
      const outcomes: BulkSrdGroupOutcome[] = [
        { type: 'WEAPON', requestedIds: [1, 2], updatedIds: [1, 2], unknownIds: [] },
        { type: 'ARMOR', requestedIds: [3], updatedIds: [3], unknownIds: [] },
      ];
      const summary = summarizeBulkOutcomes(true, outcomes);
      expect(summary.requestedCount).toBe(3);
      expect(summary.updatedCount).toBe(3);
      expect(summary.errors).toEqual([]);
    });

    it('collects unknown ids across groups', () => {
      const outcomes: BulkSrdGroupOutcome[] = [
        { type: 'DOMAIN', requestedIds: [1, 999], updatedIds: [1], unknownIds: [999] },
      ];
      expect(summarizeBulkOutcomes(true, outcomes).unknownIds).toEqual([999]);
    });

    it('collects a per-type error message without counting the group as updated', () => {
      const outcomes: BulkSrdGroupOutcome[] = [
        { type: 'SUBCLASS_PATH', requestedIds: [1], updatedIds: [], unknownIds: [], error: 'Forbidden' },
      ];
      const summary = summarizeBulkOutcomes(false, outcomes);
      expect(summary.updatedCount).toBe(0);
      expect(summary.errors).toEqual([{ type: 'SUBCLASS_PATH', message: 'Forbidden' }]);
    });

    it('handles a mix of success, unknown ids, and a failed group in one summary', () => {
      const outcomes: BulkSrdGroupOutcome[] = [
        { type: 'WEAPON', requestedIds: [1, 2], updatedIds: [1], unknownIds: [2] },
        { type: 'ARMOR', requestedIds: [3], updatedIds: [], unknownIds: [], error: 'Server error' },
      ];
      const summary = summarizeBulkOutcomes(true, outcomes);
      expect(summary.requestedCount).toBe(3);
      expect(summary.updatedCount).toBe(1);
      expect(summary.unknownIds).toEqual([2]);
      expect(summary.errors).toEqual([{ type: 'ARMOR', message: 'Server error' }]);
    });
  });

  describe('bulkResultMessage', () => {
    it('reports full success without a fraction', () => {
      const summary = summarizeBulkOutcomes(true, [
        { type: 'WEAPON', requestedIds: [1, 2], updatedIds: [1, 2], unknownIds: [] },
      ]);
      expect(bulkResultMessage(summary)).toBe('Marked 2 items as SRD.');
    });

    it('uses singular "item" for a single-row update', () => {
      const summary = summarizeBulkOutcomes(true, [
        { type: 'WEAPON', requestedIds: [1], updatedIds: [1], unknownIds: [] },
      ]);
      expect(bulkResultMessage(summary)).toBe('Marked 1 item as SRD.');
    });

    it('reports a partial success as a fraction', () => {
      const summary = summarizeBulkOutcomes(false, [
        { type: 'DOMAIN', requestedIds: [1, 2], updatedIds: [1], unknownIds: [2] },
      ]);
      expect(bulkResultMessage(summary)).toBe('Unmarked 1 of 2 items as SRD.');
    });
  });
});
