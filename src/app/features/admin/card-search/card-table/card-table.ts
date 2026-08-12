import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardRow, ColumnSpec, SortState } from '../card-table.model';
import { rowKey, withSrdSuffix } from '../card-table.utils';

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
  /** Keys (see `rowKey`) of the rows selected for the bulk SRD-flagging action. */
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());

  readonly sortChanged = output<string>();
  /** Emits the toggled row's key. */
  readonly rowSelectionToggled = output<string>();
  /** Emits `true` to select every flaggable row on the page, `false` to clear them. */
  readonly pageSelectionToggled = output<boolean>();

  /** Rows a selection can actually apply to -- a row with no SRD-flaggable type has its
   *  checkbox disabled, so it never counts toward "select all" or "some selected". */
  private readonly flaggableRows = computed(() => this.rows().filter(row => row.srdType));

  readonly allSelected = computed(() => {
    const flaggable = this.flaggableRows();
    return flaggable.length > 0 && flaggable.every(row => this.selectedKeys().has(rowKey(row)));
  });

  readonly someSelected = computed(() =>
    this.flaggableRows().some(row => this.selectedKeys().has(rowKey(row))));

  isSelected(row: CardRow): boolean {
    return this.selectedKeys().has(rowKey(row));
  }

  onRowSelectionToggle(row: CardRow): void {
    this.rowSelectionToggled.emit(rowKey(row));
  }

  onPageSelectionToggle(event: Event): void {
    this.pageSelectionToggled.emit((event.target as HTMLInputElement).checked);
  }

  /**
   * The Expansion column gets `(SRD)` appended when the row is SRD content; every other column
   * renders its cell as-is. Kept separate from `card-table.utils`'s cell builders so a bulk
   * action can flip `row.srd` and have this recompute on the next change-detection pass instead
   * of needing the whole row rebuilt.
   */
  cellText(row: CardRow, col: ColumnSpec): string {
    const value = row.cells[col.key];
    return col.key === 'expansion' ? withSrdSuffix(value, row.srd) : value;
  }

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
    return rowKey(row);
  }
}
