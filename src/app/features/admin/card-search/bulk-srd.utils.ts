import { CardRow } from './card-table.model';
import { rowKey } from './card-table.utils';
import { SearchableEntityType } from '../../../shared/models/search.model';
import { BulkSrdGroupOutcome, BulkSrdSummary } from './models/bulk-srd.model';

/**
 * Groups the currently selected rows by the SRD-flaggable type each maps to, so a selection
 * spanning multiple content types (e.g. an All Types search result) issues one PATCH per type
 * rather than one per row. Rows with no flaggable type (`srdType: null`) are excluded -- their
 * checkbox is disabled in the table, so they should never be selected, but this keeps the
 * grouping honest either way.
 */
export function groupSelectedRows(
  rows: readonly CardRow[],
  selectedKeys: ReadonlySet<string>,
): Map<SearchableEntityType, number[]> {
  const groups = new Map<SearchableEntityType, number[]>();
  for (const row of rows) {
    if (!row.srdType || !selectedKeys.has(rowKey(row))) continue;
    const ids = groups.get(row.srdType) ?? [];
    ids.push(row.id);
    groups.set(row.srdType, ids);
  }
  return groups;
}

/**
 * Extracts the backend's `ErrorResponse.message` from a failed HTTP call, falling back to a
 * generic message when the error body isn't in that shape (network failure, an upstream proxy's
 * own error page, etc).
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'error' in err) {
    const inner = (err as { error?: unknown }).error;
    if (inner && typeof inner === 'object' && 'message' in inner) {
      const message = (inner as { message?: unknown }).message;
      if (typeof message === 'string' && message) return message;
    }
  }
  return fallback;
}

/**
 * Rolls up one call's outcome per type-group into a single summary the UI can render honestly,
 * whether every id updated, some were unknown, some type-groups errored outright, or all three
 * at once.
 */
export function summarizeBulkOutcomes(srd: boolean, outcomes: readonly BulkSrdGroupOutcome[]): BulkSrdSummary {
  return {
    srd,
    requestedCount: outcomes.reduce((sum, o) => sum + o.requestedIds.length, 0),
    updatedCount: outcomes.reduce((sum, o) => sum + o.updatedIds.length, 0),
    unknownIds: outcomes.flatMap(o => o.unknownIds),
    errors: outcomes
      .filter((o): o is BulkSrdGroupOutcome & { error: string } => !!o.error)
      .map(o => ({ type: o.type, message: o.error })),
  };
}

/**
 * The summary's headline sentence. Unknown-id and per-type-error detail lines are rendered
 * separately by the caller so the template can style or omit them independently.
 */
export function bulkResultMessage(summary: BulkSrdSummary): string {
  const verb = summary.srd ? 'Marked' : 'Unmarked';
  // Pluralizes off the requested count, not the updated count: "1 of 2 items" reads correctly
  // even though only one item updated, and "1 item" only appears for a full single-item success.
  const noun = summary.requestedCount === 1 ? 'item' : 'items';
  const count = summary.updatedCount === summary.requestedCount
    ? `${summary.updatedCount}`
    : `${summary.updatedCount} of ${summary.requestedCount}`;
  return `${verb} ${count} ${noun} as SRD.`;
}
