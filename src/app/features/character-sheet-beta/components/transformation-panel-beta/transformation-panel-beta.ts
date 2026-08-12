import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TransformationPanel } from '../../../character-sheet/components/transformation-panel/transformation-panel';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
import { EntityCardData } from '../../../../shared/components/entity-card/entity-card.model';
import { CardSelectionGrid } from '../../../../shared/components/card-selection-grid/card-selection-grid';
import { CollapsibleCardGroup } from '../collapsible-card-group/collapsible-card-group';

/**
 * Beta redesign of {@link TransformationPanel}: same inherited attach/change/remove, Feed-token
 * and Wolf Form logic -- only the presentation changes, from the sheet's bespoke expandable-card
 * to a shared `EntityCard`. The Feed-token stepper and Wolf Form toggle move into `[card-controls]`
 * and the Change/Remove buttons into `[card-actions]`; both render outside the card's clipped body,
 * so -- unlike the classic layout -- they stay focusable and visible even when the card's
 * description/features are collapsed. The picker is unaffected: it already lived outside the card.
 */
@Component({
  selector: 'app-transformation-panel-beta',
  templateUrl: './transformation-panel-beta.html',
  styleUrl: './transformation-panel-beta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntityCard, CardSelectionGrid, CollapsibleCardGroup],
})
export class TransformationPanelBeta extends TransformationPanel {
  /**
   * A restricted attached card short-circuits to the same 2-field locked shape every other
   * `EntityCardData` mapper in this app returns -- `EntityCard` draws the locked face itself off
   * `restricted`/`expansionName`, so this never reaches `current.name`/`.description`/`.features`
   * (all absent on a redacted stub) to build a fabricated card.
   */
  readonly entityCard = computed<EntityCardData | null>(() => {
    const current = this.card();
    if (!current) return null;
    if (current.restricted) {
      return { id: current.id, cardType: 'transformationCard', restricted: true, expansionName: current.expansionName };
    }

    return {
      id: current.id,
      name: current.name,
      cardType: 'transformationCard',
      description: current.description,
      features: current.features?.map(feature => ({ name: feature.name, description: feature.description ?? '' })),
      badges: this.isVampire()
        ? [{ label: 'Feed', value: `${this.currentTokens()}/${this.maxTokens}` }]
        : this.isWerewolf()
          ? [{ label: this.wolfFormActive() ? 'Wolf form' : 'Human form' }]
          : undefined,
    };
  });
}
