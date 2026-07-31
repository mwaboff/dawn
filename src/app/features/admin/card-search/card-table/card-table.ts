import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardRow, ColumnSpec, SortState } from '../card-table.model';

@Component({
  selector: 'app-card-table',
  templateUrl: './card-table.html',
  styleUrl: './card-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class CardTable {
  readonly rows = input.required<CardRow[]>();
  readonly columns = input.required<ColumnSpec[]>();
  readonly sort = input<SortState | null>(null);
  /** Adds a Type column; used when results span more than one card type. */
  readonly showType = input(false);

  readonly sortChanged = output<string>();

  onSort(key: string): void {
    this.sortChanged.emit(key);
  }

  sortIndicator(key: string): string {
    const sort = this.sort();
    if (!sort || sort.key !== key) return '';
    return sort.direction === 'asc' ? '▲' : '▼';
  }

  ariaSort(key: string): 'ascending' | 'descending' | 'none' {
    const sort = this.sort();
    if (!sort || sort.key !== key) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  trackRow(_index: number, row: CardRow): string {
    return `${row.typeLabel}:${row.id}`;
  }
}
