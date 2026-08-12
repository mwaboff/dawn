import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CardSkeleton } from '../../../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../../../shared/components/card-error/card-error';
import { DaggerheartCard } from '../../../../shared/components/daggerheart-card/daggerheart-card';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
import { CardSurfaceDirective } from '../../../../shared/directives/card-surface.directive';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { EntityCardData } from '../../../../shared/components/entity-card/entity-card.model';
import { cardDataToEntityCard } from '../../../../shared/mappers/card-data-to-entity-card.mapper';
import { stanceTier, groupStancesByTier } from '../../../../shared/utils/stance-tier-group.utils';
import { PreferencesService } from '../../../../core/services/preferences.service';


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
 *
 * In beta (`sheetLayout() === 'beta'`) each card renders as an `EntityCard` with the shared
 * `.entity-select` control (`role="checkbox"`/`aria-checked`, the same vocabulary
 * `EntitySelectionGrid`'s multi-select mode uses) projected into its `[card-controls]` slot --
 * "Known", "Locked", "Select", "Selected", or "Limit reached" depending on state (see
 * `stanceSelectStatusText`). Known and tier-locked cards render that same control `aria-disabled`
 * and permanently checked/unchecked rather than as inert text, so a screen-reader user meets one
 * consistent role for "choose up to N martial stances" everywhere in the app, not a different
 * vocabulary per surface. This is `EntityCard` composed directly, the same way `SubclassPathSelector`'s
 * beta mode is, rather than `EntitySelectionGrid`: that shared grid has no "known" concept -- its
 * `selectedCards` list is fully togglable, so a known stance included in it could be clicked off.
 * Tier grouping stays visual only (a heading per tier, same as classic); `selectedStanceIds` and
 * `requiredCount` are shared across every tier's cards, so the selection cap still applies globally.
 */
@Component({
  selector: 'app-martial-stance-step',
  imports: [CardSkeleton, CardError, DaggerheartCard, EntityCard, CardSurfaceDirective],
  templateUrl: './martial-stance-step.html',
  styleUrl: './martial-stance-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MartialStanceStep {
  private readonly preferences = inject(PreferencesService);
  readonly sheetLayout = this.preferences.sheetLayout;

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

  /**
   * `knownStanceIds` is ungated (every stance the character knows, restricted or not) but `cards`
   * is the SRD-filtered browse list, so a known-but-restricted stance has no matching entry here
   * and never renders at all -- unlike the sheet's own Martial Stances panel, which shows it as a
   * locked placeholder. That inconsistency is an accepted product decision, not a bug: fixing it
   * would need the backend to hand this step a redacted stub for known-but-gated stances (there is
   * no such stub to build one from client-side), and that's been decided against. Don't re-derive
   * this from scratch if it comes up again.
   */
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

  entityCard(card: CardData): EntityCardData {
    return cardDataToEntityCard(card);
  }

  /**
   * The visible `.entity-select__text` for every state -- never colour alone (WCAG 1.4.1). Known
   * and Locked take priority over the generic Selected/Limit-reached/Select text since both are
   * permanent, non-interactive states of the one shared control.
   */
  stanceSelectStatusText(card: CardData): string {
    if (this.isKnown(card)) return 'Known';
    if (!this.isSelectable(card)) return 'Locked';
    if (this.isSelected(card)) return 'Selected';
    if (this.isDisabled(card)) return 'Limit reached';
    return 'Select';
  }

  /** Mirrors `EntitySelectionGrid.selectLabel` -- selection is never conveyed by colour alone. */
  stanceSelectLabel(card: CardData): string {
    if (this.isKnown(card)) return `${card.name}, known`;
    if (!this.isSelectable(card)) return `${card.name}, locked`;
    if (this.isSelected(card)) return `${card.name} selected`;
    if (this.isDisabled(card)) return `${card.name}, selection limit reached`;
    return `Select ${card.name}`;
  }
}
