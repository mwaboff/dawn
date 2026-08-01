import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TransformationCardResponse } from '../../../../shared/models/transformation-card-api.model';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';
import { CardSelectionGrid } from '../../../../shared/components/card-selection-grid/card-selection-grid';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { mapTransformationCardToCardData } from '../../../../shared/mappers/transformation-card.mapper';
import { isVampireTransformation, isWerewolfTransformation } from '../../utils/transformation-card.utils';

const MAX_FEED_TOKENS = 6;

/**
 * The transformation panel covers all of acquisition and display: an empty state with an
 * "Add a Transformation" entry point for the owner when nothing is attached, an attached card's
 * features/questions/mechanics, and a "Change"/"Remove" pair once one is attached. "Change" reuses
 * the same picker as "Add" -- per the rule that a PC can have only one transformation, selecting a
 * new card always replaces the FK, it never adds to a collection.
 *
 * The Vampire Feed token pool and Werewolf Wolf Form toggle stay card-name-driven -- see
 * `transformation-card.utils.ts` -- since neither is a structured field on the response.
 */
@Component({
  selector: 'app-transformation-panel',
  templateUrl: './transformation-panel.html',
  styleUrl: './transformation-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe, CardSelectionGrid],
})
export class TransformationPanel {
  readonly card = input<TransformationCardResponse | null>(null);
  readonly catalog = input<TransformationCardResponse[]>([]);
  readonly catalogLoading = input(false);
  readonly catalogError = input(false);
  readonly isOwner = input(false);
  readonly tokens = input<number | null>(null);
  readonly wolfFormActive = input(false);
  readonly canAct = input(false);

  readonly tokensChange = output<number>();
  readonly wolfFormToggle = output<boolean>();
  readonly cardSelected = output<number>();
  readonly cardRemoved = output<void>();

  readonly pickerOpen = signal(false);

  readonly isVampire = computed(() => isVampireTransformation(this.card()?.name));
  readonly isWerewolf = computed(() => isWerewolfTransformation(this.card()?.name));
  readonly currentTokens = computed(() => this.tokens() ?? 0);
  readonly features = computed(() => this.card()?.features ?? []);
  readonly questions = computed(() => this.card()?.questions ?? []);
  readonly maxTokens = MAX_FEED_TOKENS;

  readonly catalogOptions = computed<CardData[]>(() => this.catalog().map(mapTransformationCardToCardData));
  readonly selectedOption = computed<CardData | undefined>(() => {
    const current = this.card();
    return current ? this.catalogOptions().find(option => option.id === current.id) : undefined;
  });

  openPicker(): void {
    if (!this.canAct()) return;
    this.pickerOpen.set(true);
  }

  closePicker(): void {
    this.pickerOpen.set(false);
  }

  onOptionSelected(option: CardData): void {
    if (!this.canAct()) return;
    this.pickerOpen.set(false);
    if (option.id === this.card()?.id) return;
    this.cardSelected.emit(option.id);
  }

  onRemove(): void {
    if (!this.canAct()) return;
    this.cardRemoved.emit();
  }

  adjustTokens(amount: number): void {
    if (!this.canAct()) return;
    const next = Math.min(this.maxTokens, Math.max(0, this.currentTokens() + amount));
    if (next !== this.currentTokens()) {
      this.tokensChange.emit(next);
    }
  }

  onWolfFormToggle(): void {
    if (!this.canAct()) return;
    this.wolfFormToggle.emit(!this.wolfFormActive());
  }
}
