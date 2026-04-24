import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export interface HistoryColumn {
  key: string;
  label: string;
}

export type HistoryRow = unknown;

@Component({
  selector: 'app-user-edit-history-list',
  templateUrl: './user-edit-history-list.html',
  styleUrl: './user-edit-history-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserEditHistoryList {
  readonly title = input.required<string>();
  readonly columns = input.required<HistoryColumn[]>();
  readonly rows = input.required<readonly HistoryRow[]>();
  readonly emptyText = input('No entries recorded.');

  cellValue(row: HistoryRow, key: string): string {
    const value = (row as Record<string, unknown>)[key];
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'string' && this.looksLikeDate(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    }
    return String(value);
  }

  trackByIndex(index: number): number {
    return index;
  }

  private looksLikeDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T/.test(value);
  }
}
