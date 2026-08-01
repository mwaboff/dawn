import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CardSkeleton } from '../../../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../../../shared/components/card-error/card-error';
import { DaggerheartCard } from '../../../../shared/components/daggerheart-card/daggerheart-card';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { stanceTier, groupStancesByTier } from '../../../../shared/utils/stance-tier-group.utils';


/**
 * Level-up step for the Martial Artist's "Stance Fighter" feature: "choose an additional stance
 * from your tier or lower" every level. Already-known stances render selected and disabled
 * (never hidden) so the player sees their whole known-stances sheet filling in, matching the
 * printed tracking sheet's "mark the circle" metaphor. `maxTier` comes from `tierForLevel` --
 * reused from `beastform-access.utils.ts` rather than duplicated here.
 */
@Component({
  selector: 'app-martial-stance-step',
  imports: [CardSkeleton, CardError, DaggerheartCard],
  templateUrl: './martial-stance-step.html',
  styleUrl: './martial-stance-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MartialStanceStep {
  readonly cards = input<CardData[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly knownStanceIds = input<number[]>([]);
  readonly maxTier = input.required<number>();
  readonly selectedStanceId = input<number | null>(null);

  readonly stanceSelected = output<number | null>();

  readonly tierGroups = computed(() => groupStancesByTier(this.cards()));
  readonly selectionCount = computed(() => (this.selectedStanceId() !== null ? 1 : 0));

  isKnown(card: CardData): boolean {
    return this.knownStanceIds().includes(card.id);
  }

  isSelectable(card: CardData): boolean {
    return !this.isKnown(card) && stanceTier(card) <= this.maxTier();
  }

  isSelected(card: CardData): boolean {
    return this.isKnown(card) || this.selectedStanceId() === card.id;
  }

  isDisabled(card: CardData): boolean {
    return this.isKnown(card) || !this.isSelectable(card);
  }

  onCardClicked(card: CardData): void {
    if (this.isDisabled(card)) return;

    if (this.selectedStanceId() === card.id) {
      this.stanceSelected.emit(null);
    } else {
      this.stanceSelected.emit(card.id);
    }
  }
}
