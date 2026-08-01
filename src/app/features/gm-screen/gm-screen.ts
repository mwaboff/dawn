import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DiceRoller } from '../../shared/components/dice-roller/dice-roller';
import { GmPanelGrid } from './components/gm-panel-grid/gm-panel-grid';
import { STATIC_GM_PANELS } from './content/panel-registry';

@Component({
  selector: 'app-gm-screen',
  templateUrl: './gm-screen.html',
  styleUrl: './gm-screen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GmPanelGrid, DiceRoller],
  host: { class: 'gm-screen-shell' },
})
export class GmScreen {
  protected readonly staticPanels = STATIC_GM_PANELS;
}
