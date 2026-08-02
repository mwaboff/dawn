import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CardSkeleton } from '../../../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../../../shared/components/card-error/card-error';
import { DaggerheartCard } from '../../../../shared/components/daggerheart-card/daggerheart-card';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { stanceTier, groupStancesByTier } from '../../../../shared/utils/stance-tier-group.utils';


/**
 * Level-up step for the Martial Artist's "Stance Fighter" feature. Two call shapes, both driven
 * by `requiredCount`:
 * - Ongoing (`requiredCount` 1): "choose an additional stance from your tier or lower" every
 *   level-up -- `maxTier` is `tierForLevel(nextLevel)`.
 * - Acquisition (`requiredCount` 2): a character newly granted the foundation card (e.g.
 *   multiclassing into Martial Artist) gets the same "choose two martial stances from Tier 1"
 *   grant as at character creation in one shot -- the caller pins `maxTier` to 1 in that case.
 * Already-known stances render selected and disabled (never hidden) so the player sees their
 * whole known-stances sheet filling in, matching the printed tracking sheet's "mark the circle"
 * metaphor.
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
  readonly requiredCount = input<number>(1);
  readonly selectedStanceIds = input<number[]>([]);

  readonly stancesSelected = output<number[]>();

  readonly tierGroups = computed(() => groupStancesByTier(this.cards()));
  readonly selectionCount = computed(() => this.selectedStanceIds().length);
  readonly isSelectionComplete = computed(() => this.selectionCount() === this.requiredCount());
  readonly instruction = computed(() =>
    this.requiredCount() > 1
      ? `Choose ${this.requiredCount()} martial stances from Tier 1`
      : 'Choose an additional stance from your tier or lower',
  );

  isKnown(card: CardData): boolean {
    return this.knownStanceIds().includes(card.id);
  }

  isSelectable(card: CardData): boolean {
    return !this.isKnown(card) && stanceTier(card) <= this.maxTier();
  }

  isSelected(card: CardData): boolean {
    return this.isKnown(card) || this.selectedStanceIds().includes(card.id);
  }

  /**
   * Disabled when the stance is already known, out of tier, or when the selection cap is already
   * met and this card isn't one of the picks. Without the cap arm, surplus cards stay focusable
   * and report `aria-disabled="false"` while their click silently no-ops -- the multi-select
   * equivalent of a dead control. Deselecting a chosen card is always allowed, so the user is
   * never stuck at the cap.
   */
  isDisabled(card: CardData): boolean {
    if (this.isKnown(card) || !this.isSelectable(card)) return true;
    return this.isSelectionComplete() && !this.selectedStanceIds().includes(card.id);
  }

  onCardClicked(card: CardData): void {
    if (this.isDisabled(card)) return;

    const current = this.selectedStanceIds();
    const idx = current.indexOf(card.id);

    if (idx >= 0) {
      this.stancesSelected.emit(current.filter(id => id !== card.id));
    } else if (current.length < this.requiredCount()) {
      this.stancesSelected.emit([...current, card.id]);
    }
  }
}
