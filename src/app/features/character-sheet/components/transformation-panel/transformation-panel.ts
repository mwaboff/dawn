import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TransformationCardResponse } from '../../../../shared/models/transformation-card-api.model';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';
import { CardSelectionGrid } from '../../../../shared/components/card-selection-grid/card-selection-grid';
import { CardData, RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { LockIcon } from '../../../../shared/components/lock-icon/lock-icon';
import { mapTransformationCardToCardData } from '../../../../shared/mappers/transformation-card.mapper';
import { isVampireTransformation, isWerewolfTransformation } from '../../utils/transformation-card.utils';

const MAX_FEED_TOKENS = 6;

/**
 * The transformation panel covers all of acquisition and display: an empty state with a
 * "Choose a transformation" entry point for the owner when nothing is attached, an attached card's
 * features and mechanics, and a "Change"/"Remove" pair once one is attached. "Change" reuses
 * the same picker -- per the rule that a PC can have only one transformation, selecting a new card
 * always replaces the FK, it never adds to a collection.
 *
 * The parent only renders this panel when the sheet's `transformationEnabled` flag is set, which
 * only a GM can set from the Campaign page. There is no player-facing path to it.
 *
 * The Vampire Feed token pool and Werewolf Wolf Form toggle stay card-name-driven -- see
 * `transformation-card.utils.ts` -- since neither is a structured field on the response.
 */
@Component({
  selector: 'app-transformation-panel',
  templateUrl: './transformation-panel.html',
  // `transformation-panel-restricted.css` is split out for the same reason `entity-card-restricted
  // .css` is: `transformation-panel.css` is already at the 4kB budget warning, so the locked
  // face's rules get their own budget instead of pushing the main file toward the 8kB error.
  styleUrls: ['./transformation-panel.css', './transformation-panel-restricted.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe, CardSelectionGrid, LockIcon],
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
  /** Collapsed by default; the header badges carry the live state a player needs mid-combat. */
  readonly expanded = signal(false);

  /**
   * A restricted attached card's `.name` is redacted along with everything else -- reading it
   * unguarded (`this.card()?.name ?? 'No transformation'`) would misreport a locked, still-attached
   * transformation as "no transformation chosen", which is wrong AND hides the fact that the
   * player is currently stuck in a form they can't see. The shared placeholder title takes over
   * instead, same as every other locked face.
   */
  readonly headerName = computed(() => {
    const c = this.card();
    if (!c) return 'No transformation';
    return c.restricted ? RESTRICTED_CARD_TITLE : c.name;
  });
  /**
   * The panel only renders once a GM has enabled transformations for this character, so the empty
   * state addresses someone who has already been granted one and just has not picked yet. Anyone
   * else looking at the sheet gets the bare fact instead of instructions they cannot act on.
   */
  readonly emptyCopy = computed(() =>
    this.isOwner()
      ? 'Your GM opened transformations for this character. Choose the one that fits where your story is headed.'
      : 'No transformation chosen yet.',
  );
  readonly isVampire = computed(() => isVampireTransformation(this.card()?.name));
  readonly isWerewolf = computed(() => isWerewolfTransformation(this.card()?.name));
  readonly currentTokens = computed(() => this.tokens() ?? 0);
  readonly features = computed(() => this.card()?.features ?? []);
  readonly maxTokens = MAX_FEED_TOKENS;

  /** Exposed for the template; the copy itself lives in `daggerheart-card.model.ts` so this face
   * never drifts from the shared/adversary/martial-stance/beastform locked faces. */
  readonly lockedMessage = computed(() => restrictedCardMessage(this.card()?.expansionName));

  readonly catalogOptions = computed<CardData[]>(() => this.catalog().map(mapTransformationCardToCardData));
  readonly selectedOption = computed<CardData | undefined>(() => {
    const current = this.card();
    return current ? this.catalogOptions().find(option => option.id === current.id) : undefined;
  });

  toggleSection(): void {
    this.expanded.update(open => !open);
  }

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
