import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CardSkeleton } from '../../../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../../../shared/components/card-error/card-error';
import { DaggerheartCard } from '../../../../shared/components/daggerheart-card/daggerheart-card';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { stanceTier, groupStancesByTier } from '../../../../shared/utils/stance-tier-group.utils';

export const REQUIRED_STANCE_COUNT = 2;
export const SELECTABLE_STANCE_TIER = 1;


/**
 * Character-creation step for the Martial Artist's "Stance Fighter" feature: "choose two martial
 * stances from Tier 1." Only tier 1 is selectable here -- higher tiers render disabled with an
 * unlock hint, matching the tier-grouped precedent in `martial-stance-panel`/`beastform-section`.
 */
@Component({
  selector: 'app-martial-stance-selector',
  imports: [CardSkeleton, CardError, DaggerheartCard],
  templateUrl: './martial-stance-selector.html',
  styleUrl: './martial-stance-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MartialStanceSelector {
  readonly cards = input<CardData[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly selectedCards = input<CardData[]>([]);

  readonly stancesSelected = output<CardData[]>();

  readonly requiredCount = REQUIRED_STANCE_COUNT;

  readonly tierGroups = computed(() => groupStancesByTier(this.cards()));
  readonly selectionCount = computed(() => this.selectedCards().length);

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
