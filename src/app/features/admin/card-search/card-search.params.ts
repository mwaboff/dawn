import { ParamMap } from '@angular/router';
import { ADMIN_CATEGORIES, ALL_TYPES_ID, DEFAULT_PAGE_SIZE, PAGE_SIZES, SortState } from './card-table.model';

export const MIN_QUERY_LENGTH = 3;

export interface SearchState {
  /** Category id, `all`, or null when nothing is selected yet. */
  category: string | null;
  query: string;
  page: number;
  size: number;
  sort: SortState | null;
}

const VALID_CATEGORIES = new Set<string>([ALL_TYPES_ID, ...ADMIN_CATEGORIES.map(c => c.id)]);

/**
 * Parses the query string into search state, discarding anything malformed so a
 * hand-edited or stale URL degrades to defaults instead of erroring.
 */
export function readSearchParams(params: ParamMap): SearchState {
  const rawType = params.get('type');
  const category = rawType && VALID_CATEGORIES.has(rawType) ? rawType : null;

  const page = Number(params.get('page'));
  const size = Number(params.get('size'));
  const sortKey = params.get('sort');
  const direction = params.get('dir') === 'desc' ? 'desc' : 'asc';

  return {
    category,
    query: (params.get('q') ?? '').trim(),
    page: Number.isInteger(page) && page > 0 ? page : 0,
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
    sort: sortKey ? { key: sortKey, direction } : null,
  };
}
