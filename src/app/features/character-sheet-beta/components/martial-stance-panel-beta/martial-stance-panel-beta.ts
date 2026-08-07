import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MartialStancePanel } from '../../../character-sheet/components/martial-stance-panel/martial-stance-panel';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
import { EntityCardData } from '../../../../shared/components/entity-card/entity-card.model';
import { MartialStanceResponse } from '../../../../shared/models/martial-stance-api.model';

/**
 * Beta redesign of {@link MartialStancePanel}: same stance list, activation, and drop logic --
 * only the presentation changes, from the sheet's bespoke expandable-card to a shared `EntityCard`.
 * The Enter/Drop buttons move into `[card-actions]`, which `EntityCard` renders outside its clipped
 * body -- unlike the classic layout, they stay focusable and visible even when a stance is collapsed.
 */
@Component({
  selector: 'app-martial-stance-panel-beta',
  templateUrl: './martial-stance-panel-beta.html',
  styleUrl: './martial-stance-panel-beta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntityCard],
})
export class MartialStancePanelBeta extends MartialStancePanel {
  toCardData(stance: MartialStanceResponse): EntityCardData {
    return {
      id: stance.id,
      name: stance.name,
      cardType: 'martialStance',
      description: stance.description,
      badges: [
        ...(stance.tier !== undefined ? [{ label: 'Tier', value: String(stance.tier) }] : []),
        ...(this.isActive(stance.id) ? [{ label: 'Active' }] : []),
      ],
    };
  }
}
