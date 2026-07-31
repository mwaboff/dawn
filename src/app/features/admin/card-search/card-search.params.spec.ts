import { convertToParamMap } from '@angular/router';
import { readSearchParams } from './card-search.params';
import { DEFAULT_PAGE_SIZE } from './card-table.model';

function parse(params: Record<string, string>) {
  return readSearchParams(convertToParamMap(params));
}

describe('readSearchParams', () => {
  it('returns empty defaults for an empty query string', () => {
    expect(parse({})).toEqual({
      category: null, query: '', page: 0, size: DEFAULT_PAGE_SIZE, sort: null,
    });
  });

  it('accepts a known category', () => {
    expect(parse({ type: 'domainCard' }).category).toBe('domainCard');
  });

  it('accepts the all-types pseudo category', () => {
    expect(parse({ type: 'all' }).category).toBe('all');
  });

  it('rejects an unknown category', () => {
    expect(parse({ type: 'wizardhats' }).category).toBeNull();
  });

  it('trims the query', () => {
    expect(parse({ q: '  blade  ' }).query).toBe('blade');
  });

  it('parses a positive page', () => {
    expect(parse({ page: '3' }).page).toBe(3);
  });

  it.each(['abc', '-1', '1.5', ''])('falls back to page 0 for %o', value => {
    expect(parse({ page: value }).page).toBe(0);
  });

  it.each([['25', 25], ['50', 50], ['100', 100]])('accepts the allowed page size %s', (raw, expected) => {
    expect(parse({ size: raw as string }).size).toBe(expected);
  });

  it.each(['7', '1000', 'abc'])('falls back to the default page size for %o', value => {
    expect(parse({ size: value }).size).toBe(DEFAULT_PAGE_SIZE);
  });

  it('reads a sort column with an explicit descending direction', () => {
    expect(parse({ sort: 'tier', dir: 'desc' }).sort).toEqual({ key: 'tier', direction: 'desc' });
  });

  it('defaults an unrecognized direction to ascending', () => {
    expect(parse({ sort: 'tier', dir: 'sideways' }).sort).toEqual({ key: 'tier', direction: 'asc' });
  });

  it('ignores a direction with no sort column', () => {
    expect(parse({ dir: 'desc' }).sort).toBeNull();
  });
});
