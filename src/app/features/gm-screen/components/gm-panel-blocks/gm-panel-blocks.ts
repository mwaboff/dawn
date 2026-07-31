import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GmContentBlock } from '../../models/gm-panel.model';

/**
 * Renders a static panel body. All chrome comes from the global `.gm-panel__*` vocabulary in
 * `shared/styles/gm-panel.css`, so this component contributes markup and almost no styling.
 */
@Component({
  selector: 'app-gm-panel-blocks',
  templateUrl: './gm-panel-blocks.html',
  styleUrl: './gm-panel-blocks.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GmPanelBlocks {
  readonly blocks = input.required<readonly GmContentBlock[]>();
}
