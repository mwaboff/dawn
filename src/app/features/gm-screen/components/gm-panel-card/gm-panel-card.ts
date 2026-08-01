import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

import { GmPanelDef } from '../../models/gm-panel.model';
import { GmPanelBlocks } from '../gm-panel-blocks/gm-panel-blocks';

/**
 * One panel: header chrome plus either rendered content blocks or a campaign tool component.
 *
 * The host element carries the `gm-panel` class rather than a wrapper `<section>` so the grid can
 * put `cdkDrag` and `appMasonryItem` straight onto `<app-gm-panel-card>` -- masonry measures the
 * grid's direct children, and an extra wrapper would break the row-span maths.
 */
@Component({
  selector: 'app-gm-panel-card',
  templateUrl: './gm-panel-card.html',
  styleUrl: './gm-panel-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, GmPanelBlocks, CdkDragHandle],
  host: {
    class: 'gm-panel',
    '[class.gm-panel--wide]': 'panel().colSpan === 2',
    '[class.gm-panel--wider]': 'panel().colSpan === 3',
    '[attr.id]': 'panel().id',
  },
})
export class GmPanelCard {
  readonly panel = input.required<GmPanelDef>();
  readonly collapsed = input.required<boolean>();
  /** True while a filter is active: the body is forced open so matches are never hidden. */
  readonly forceOpen = input(false);
  readonly isFirst = input(false);
  readonly isLast = input(false);

  readonly toggled = output<void>();
  readonly moveUp = output<void>();
  readonly moveDown = output<void>();
  readonly revealed = output<void>();

  readonly bodyId = computed(() => `${this.panel().id}-body`);

  /**
   * `until-found` rather than `@if` so Chromium's find-in-page can reveal collapsed content and
   * fire `beforematch`.
   */
  readonly bodyHidden = computed<'until-found' | null>(() =>
    this.collapsed() && !this.forceOpen() ? 'until-found' : null,
  );
}
