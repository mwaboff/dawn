import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

/**
 * The single-vs-multi-select rule shared by `CardSelectionGrid` (classic, `DaggerheartCard`-based)
 * and `EntitySelectionGrid` (beta, `EntityCard`-based) -- the same domain rule ("what does clicking
 * a card do") in two renderers, which dawn/CLAUDE.md's DRY section calls out as exactly the case
 * worth consolidating: two implementations of one rule is a bug factory, and a consumer swapping
 * between the two grids should get identical selection behaviour, not just similar-looking
 * behaviour that can silently diverge.
 */

/**
 * Whether `card` counts as selected. At `maxSelections === 1` a caller may track the choice either
 * via `selectedCard` or via a one-element `selectedCards` -- both grids accept either, so both are
 * checked.
 */
export function isCardSelected(
  card: CardData,
  selectedCard: CardData | undefined,
  selectedCards: CardData[],
  maxSelections: number,
): boolean {
  if (maxSelections === 1) {
    return selectedCard?.id === card.id || selectedCards.some(c => c.id === card.id);
  }
  return selectedCards.some(c => c.id === card.id);
}

/**
 * The `selectedCards` array after `card` is clicked. Single-select (`maxSelections === 1`) behaves
 * like a radio button: clicking the current selection clears it, clicking any other card replaces
 * it. Multi-select behaves like a capped set of checkboxes: clicking a selected card removes it,
 * clicking an unselected one adds it unless `maxSelections` is already reached, in which case the
 * click is a no-op (the array comes back unchanged).
 */
export function nextCardSelection(
  card: CardData,
  selectedCard: CardData | undefined,
  selectedCards: CardData[],
  maxSelections: number,
): CardData[] {
  if (maxSelections === 1) {
    const isCurrentlySelected = isCardSelected(card, selectedCard, selectedCards, maxSelections);
    return isCurrentlySelected ? [] : [card];
  }

  const idx = selectedCards.findIndex(c => c.id === card.id);
  if (idx >= 0) return selectedCards.filter(c => c.id !== card.id);
  if (selectedCards.length >= maxSelections) return selectedCards;
  return [...selectedCards, card];
}
