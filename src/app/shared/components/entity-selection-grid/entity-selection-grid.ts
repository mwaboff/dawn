import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { EntityCard } from '../entity-card/entity-card';
import { EntitySkeleton } from '../entity-skeleton/entity-skeleton';
import { CardError } from '../card-error/card-error';
import { CardData } from '../daggerheart-card/daggerheart-card.model';
import { EntityCardData, EntityCardSize } from '../entity-card/entity-card.model';
import { cardDataToEntityCard } from '../../mappers/card-data-to-entity-card.mapper';
import { isCardSelected, nextCardSelection } from '../../utils/card-selection.utils';
import { isRovingTabKey, nextRovingTabIndex } from '../../utils/roving-tabindex.utils';

/**
 * The selectable beta counterpart to `CardSelectionGrid` -- pick-one-or-many rendered as
 * `EntityCard`s instead of `DaggerheartCard`s. Mirrors `CardSelectionGrid`'s public API closely so
 * a caller swaps between the two with close to a one-line template change:
 *
 * ```html
 * @if (sheetLayout() === 'beta') {
 *   <app-entity-selection-grid
 *     [cards]="classCards()" [loading]="classCardsLoading()" [error]="classCardsError()"
 *     [selectedCard]="selectedClass()" ariaLabel="Choose a class"
 *     (cardSelected)="onClassSelected($event)"
 *   />
 * } @else {
 *   <app-card-selection-grid
 *     [cards]="classCards()" [loading]="classCardsLoading()" [error]="classCardsError()"
 *     [selectedCard]="selectedClass()"
 *     (cardSelected)="onClassSelected($event)"
 *   />
 * }
 * ```
 *
 * Takes and emits `CardData`, not `EntityCardData` -- the caller's existing selection state
 * (`selectedCard`/`selectedCards` signals) and handlers keep working untouched across the swap;
 * this component alone converts to the beta card shape via `cardDataToEntityCard` internally.
 *
 * `EntityCard` has no built-in click/select behaviour (see its own doc comment) -- it is a
 * disclosure card whose header button already owns the "click the card" gesture for expand/
 * collapse. Nesting a second interactive control inside that header button would be both invalid
 * HTML and an ambiguous click target, so selection lives in `EntityCard`'s existing
 * `[card-controls]` slot instead, as a dedicated control below the (separately toggleable) body.
 *
 * Single-select renders `role="radio"`/`aria-checked` controls inside a `role="radiogroup"`, with
 * roving-tabindex arrow-key navigation (`ArrowLeft`/`ArrowRight`/`Home`/`End`, ARIA APG's radio
 * group pattern -- "selection follows focus", the same as a native `<input type="radio">` group).
 * Multi-select renders `role="checkbox"`/`aria-checked` controls inside a plain `role="group"`;
 * checkboxes need no roving tabindex, each is independently in the tab order. Selected state is
 * never colour-only: the control's text always says "Selected"/"Select"/"Limit reached" (WCAG
 * 1.4.1), and an at-max-and-unselected control carries `aria-disabled` rather than losing focusability
 * outright (it stays reachable so a screen-reader user hears why it's unavailable).
 */
@Component({
  selector: 'app-entity-selection-grid',
  imports: [EntityCard, EntitySkeleton, CardError],
  templateUrl: './entity-selection-grid.html',
  styleUrl: './entity-selection-grid.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitySelectionGrid {
  readonly cards = input.required<CardData[]>();
  readonly loading = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly selectedCard = input<CardData>();
  readonly selectedCards = input<CardData[]>([]);
  readonly maxSelections = input<number>(1);
  readonly skeletonCount = input<number>(6);
  /**
   * `CardSelectionGrid`'s `layout` is a grid-column concern (`'wide'` -> one column instead of a
   * multi-column fill) that also happens to switch `DaggerheartCard`'s own internal layout.
   * `EntityCard` has no internal "wide" mode to match (its only size axis is `size`, set per card,
   * not per grid) -- `'wide'` here reproduces just the grid-column half: a single-column
   * arrangement (`.entity-selection-grid--wide`), with each card otherwise unchanged.
   */
  readonly layout = input<'default' | 'wide'>('default');
  /**
   * `'auto'` (default): the grid renders however many columns `layout`'s floor width fits --
   * today's exact, unchanged behaviour. `2`: caps the grid at 2 columns (stepping to 1 below
   * 768px) regardless of viewport width, for text-dense cards -- domain cards run 45-618 characters
   * of rules text per the actual imported card data (core-import/intermediate/04-domain-cards.json),
   * median ~270 -- where a 3rd/4th auto-fit column would squeeze that prose into an unreadably
   * narrow strip. Not part of `CardSelectionGrid`'s API; there is no classic equivalent to mirror,
   * since `DaggerheartCard`'s own grid has never needed a column cap. Independent of `layout`:
   * `layout="wide"` still forces a single column outright regardless of `columns` (see the class
   * binding in the template) -- an explicit "always 1 column" request wins over a "cap at 2" one.
   */
  readonly columns = input<'auto' | 2>('auto');
  /**
   * The accessible name for the selection group (`role="radiogroup"`/`role="group"`). Not part of
   * `CardSelectionGrid`'s API -- `DaggerheartCard` selection carries no ARIA role at all, so there
   * was nothing to name. A `radiogroup`/`group` with no name fails WCAG 4.1.2, so pass something
   * specific ("Choose a class"); the default below is a safety net, not a real label.
   */
  readonly ariaLabel = input<string>('Select an option');
  /**
   * The `EntityCard` resting size for every card in the grid -- `'normal'` (default) preserves
   * every existing caller's exact rendering. `'compact'` is for browse-and-add rows the way
   * `item-finder-result.html` uses it: a single scannable line that expands to the full card on
   * click, with no new expand machinery needed (`EntityCard`'s own header button already does it).
   */
  readonly size = input<EntityCardSize>('normal');
  /**
   * How a `card` becomes the `EntityCardData` this grid renders. Defaults to the generic
   * `cardDataToEntityCard` (today's exact, unchanged behaviour) -- pass a domain-aware mapper (see
   * `environment-card-to-entity-card.mapper.ts`) when a caller needs a `headline`/`eyebrow`/`stats`
   * the generic pass deliberately leaves unset (see that frozen mapper's own doc comment on why).
   */
  readonly cardMapper = input<(card: CardData) => EntityCardData>(cardDataToEntityCard);

  readonly cardSelected = output<CardData>();
  readonly cardsSelected = output<CardData[]>();

  private readonly grid = viewChild<ElementRef<HTMLElement>>('grid');

  entityCard(card: CardData): EntityCardData {
    return this.cardMapper()(card);
  }

  isRadioGroup(): boolean {
    return this.maxSelections() === 1;
  }

  /** `layout="wide"` (always 1 column) wins over `columns="2"` (cap at 2) -- see the `columns` doc. */
  isColumnCapped(): boolean {
    return this.columns() === 2 && this.layout() !== 'wide';
  }

  isSelected(card: CardData): boolean {
    return isCardSelected(card, this.selectedCard(), this.selectedCards(), this.maxSelections());
  }

  isAtMax(card: CardData): boolean {
    return !this.isRadioGroup() && !this.isSelected(card) && this.selectedCards().length >= this.maxSelections();
  }

  /** Roving tabindex: the checked radio is reachable by Tab, every other radio is skipped. */
  controlTabIndex(card: CardData): number {
    if (!this.isRadioGroup()) return 0;
    const cards = this.cards();
    const active = cards.find(c => this.isSelected(c)) ?? cards[0];
    return active?.id === card.id ? 0 : -1;
  }

  selectLabel(card: CardData): string {
    if (this.isSelected(card)) return `${card.name} selected`;
    if (this.isAtMax(card)) return `${card.name}, selection limit reached`;
    return `Select ${card.name}`;
  }

  onSelect(card: CardData): void {
    if (this.isAtMax(card)) return;
    // Matches CardSelectionGrid.onCardClicked: `cardSelected` always names the clicked card in
    // single-select mode, even when the click clears the selection (`cardsSelected` reflects that).
    if (this.isRadioGroup()) this.cardSelected.emit(card);
    this.cardsSelected.emit(nextCardSelection(card, this.selectedCard(), this.selectedCards(), this.maxSelections()));
  }

  onControlKeydown(event: KeyboardEvent, index: number): void {
    if (!this.isRadioGroup() || !isRovingTabKey(event.key)) return;
    const cards = this.cards();
    const next = cards[nextRovingTabIndex(event.key, index, cards.length)];
    if (!next) return;
    event.preventDefault();
    this.onSelect(next);
    this.focusRadioAt(cards.indexOf(next));
  }

  private focusRadioAt(index: number): void {
    const radios = this.grid()?.nativeElement.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    radios?.[index]?.focus();
  }
}
