import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CardSkeleton } from '../../../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../../../shared/components/card-error/card-error';
import { DaggerheartCard } from '../../../../shared/components/daggerheart-card/daggerheart-card';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
import { EntitySelectionGrid } from '../../../../shared/components/entity-selection-grid/entity-selection-grid';
import { CardSurfaceDirective } from '../../../../shared/directives/card-surface.directive';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { EntityCardData } from '../../../../shared/components/entity-card/entity-card.model';
import { cardDataToEntityCard } from '../../../../shared/mappers/card-data-to-entity-card.mapper';
import { stanceTier, groupStancesByTier } from '../../../../shared/utils/stance-tier-group.utils';

export const REQUIRED_STANCE_COUNT = 2;
export const SELECTABLE_STANCE_TIER = 1;


/**
 * Character-creation step for the Martial Artist's "Stance Fighter" feature: "choose two martial
 * stances from Tier 1." Only tier 1 is selectable here -- higher tiers render disabled with an
 * unlock hint, matching the tier-grouped precedent in `martial-stance-panel`/`beastform-section`.
 *
 * `cardFormat="beta"` keeps the same tier grouping and Tier-1-only selectability: the Tier 1 group
 * renders through `EntitySelectionGrid` (the same multi-select semantics classic uses, just as
 * `EntityCard`s), and every higher tier renders as plain, non-interactive `EntityCard`s with a
 * literal "Locked" status in place of a select control -- mirroring the "Owned"/"Locked" status
 * text `SubclassPathSelector`'s own beta branch already uses, rather than a disabled selection
 * control (there is nothing to select there in classic mode either -- `DaggerheartCard`'s
 * `[disabled]` input just removes the click handler, it never renders an "unavailable" control).
 */
@Component({
  selector: 'app-martial-stance-selector',
  imports: [CardSkeleton, CardError, DaggerheartCard, EntityCard, EntitySelectionGrid, CardSurfaceDirective],
  templateUrl: './martial-stance-selector.html',
  styleUrl: './martial-stance-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MartialStanceSelector {
  readonly cards = input<CardData[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly selectedCards = input<CardData[]>([]);
  readonly cardFormat = input<'classic' | 'beta'>('classic');

  readonly stancesSelected = output<CardData[]>();

  readonly requiredCount = REQUIRED_STANCE_COUNT;
  readonly selectableTier = SELECTABLE_STANCE_TIER;

  readonly tierGroups = computed(() => groupStancesByTier(this.cards()));
  readonly selectionCount = computed(() => this.selectedCards().length);
  readonly stanceAriaLabel = computed(() => `Choose ${this.requiredCount} martial stances`);

  entityCard(card: CardData): EntityCardData {
    return cardDataToEntityCard(card);
  }

  isSelectable(card: CardData): boolean {
    return stanceTier(card) === SELECTABLE_STANCE_TIER;
  }

  isSelected(card: CardData): boolean {
    return this.selectedCards().some(c => c.id === card.id);
  }

  onCardClicked(card: CardData): void {
    if (!this.isSelectable(card)) return;

    const current = this.selectedCards();
    const idx = current.findIndex(c => c.id === card.id);

    if (idx >= 0) {
      this.stancesSelected.emit(current.filter(c => c.id !== card.id));
    } else if (current.length < this.requiredCount) {
      this.stancesSelected.emit([...current, card]);
    }
  }
}
