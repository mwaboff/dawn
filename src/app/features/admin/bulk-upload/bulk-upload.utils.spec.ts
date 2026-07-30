import { describe, it, expect } from 'vitest';
import { parseBulkFieldErrors } from './bulk-upload.utils';

describe('parseBulkFieldErrors', () => {
  it('should parse "list[N].field" keys into recordIndex and field', () => {
    const result = parseBulkFieldErrors({ 'list[3].name': 'must not be blank' });
    expect(result).toEqual([{ recordIndex: 3, field: 'name', message: 'must not be blank' }]);
  });

  it('should parse "[N].field" keys (no prefix) into recordIndex and field', () => {
    const result = parseBulkFieldErrors({ '[0].featureType': 'Feature type is required' });
    expect(result).toEqual([{ recordIndex: 0, field: 'featureType', message: 'Feature type is required' }]);
  });

  it('should treat unrecognized keys as object-level errors with a null recordIndex', () => {
    const result = parseBulkFieldErrors({ requests: 'must not be empty' });
    expect(result).toEqual([{ recordIndex: null, field: 'requests', message: 'must not be empty' }]);
  });

  it('should sort by ascending recordIndex', () => {
    const result = parseBulkFieldErrors({
      'list[10].name': 'a',
      'list[2].name': 'b',
      'list[47].name': 'c',
    });
    expect(result.map(e => e.recordIndex)).toEqual([2, 10, 47]);
  });

  it('should place null-recordIndex (object-level) entries after indexed entries', () => {
    const result = parseBulkFieldErrors({
      'list[5].name': 'indexed',
      topLevel: 'object-level',
    });
    expect(result.map(e => e.recordIndex)).toEqual([5, null]);
  });

  it('should handle nested field paths after the index (e.g. dotted sub-fields)', () => {
    const result = parseBulkFieldErrors({ 'list[1].damage.notation': 'Invalid damage notation' });
    expect(result).toEqual([{ recordIndex: 1, field: 'damage.notation', message: 'Invalid damage notation' }]);
  });

  it('should return an empty array for an empty fieldErrors object', () => {
    expect(parseBulkFieldErrors({})).toEqual([]);
  });

  it('should handle multiple errors on the same record', () => {
    const result = parseBulkFieldErrors({
      'list[4].name': 'must not be blank',
      'list[4].expansionId': 'Expansion ID is required',
    });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.recordIndex === 4)).toBe(true);
  });
});
