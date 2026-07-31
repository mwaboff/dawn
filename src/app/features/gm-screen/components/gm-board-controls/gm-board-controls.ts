import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * The board's sticky command bar: search, bulk collapse, layout reset, and a projected slot for
 * whatever the host page wants pinned above the panels (the campaign page pins Fear there).
 */
@Component({
  selector: 'app-gm-board-controls',
  templateUrl: './gm-board-controls.html',
  styleUrl: './gm-board-controls.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GmBoardControls {
  readonly filter = input.required<string>();
  /** Shown next to the search box so a filtered board says how much it is hiding. */
  readonly matchCount = input.required<number>();
  readonly totalCount = input.required<number>();

  readonly filterChange = output<string>();
  readonly expandAll = output<void>();
  readonly collapseAll = output<void>();
  readonly resetLayout = output<void>();

  onFilterInput(event: Event): void {
    this.filterChange.emit((event.target as HTMLInputElement).value);
  }
}
