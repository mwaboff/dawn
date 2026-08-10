import { isCardSelected, nextCardSelection } from './card-selection.utils';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

const CARDS: CardData[] = [
  { id: 1, name: 'Warrior', description: 'Strong fighter', cardType: 'class' },
  { id: 2, name: 'Ranger', description: 'Skilled archer', cardType: 'class' },
  { id: 3, name: 'Wizard', description: 'Arcane caster', cardType: 'class' },
];
const [warrior, ranger, wizard] = CARDS;

describe('isCardSelected', () => {
  describe('single-select (maxSelections 1)', () => {
    it('is true when the card matches selectedCard', () => {
      expect(isCardSelected(warrior, warrior, [], 1)).toBe(true);
    });

    it('is true when the card is present in selectedCards', () => {
      expect(isCardSelected(warrior, undefined, [warrior], 1)).toBe(true);
    });

    it('is false when neither selectedCard nor selectedCards match', () => {
      expect(isCardSelected(warrior, ranger, [], 1)).toBe(false);
    });
  });

  describe('multi-select (maxSelections > 1)', () => {
    it('is true when the card is present in selectedCards', () => {
      expect(isCardSelected(warrior, undefined, [warrior, ranger], 2)).toBe(true);
    });

    it('is false when the card is absent from selectedCards', () => {
      expect(isCardSelected(wizard, undefined, [warrior, ranger], 2)).toBe(false);
    });

    it('ignores selectedCard entirely', () => {
      expect(isCardSelected(wizard, wizard, [], 2)).toBe(false);
    });
  });
});

describe('nextCardSelection', () => {
  describe('single-select (maxSelections 1)', () => {
    it('selects the clicked card when nothing is selected', () => {
      expect(nextCardSelection(warrior, undefined, [], 1)).toEqual([warrior]);
    });

    it('clears the selection when clicking the already-selected card via selectedCard', () => {
      expect(nextCardSelection(warrior, warrior, [], 1)).toEqual([]);
    });

    it('clears the selection when clicking the already-selected card via selectedCards', () => {
      expect(nextCardSelection(warrior, undefined, [warrior], 1)).toEqual([]);
    });

    it('replaces the selection when clicking a different card', () => {
      expect(nextCardSelection(ranger, undefined, [warrior], 1)).toEqual([ranger]);
    });
  });

  describe('multi-select (maxSelections > 1)', () => {
    it('adds the clicked card when under the cap', () => {
      expect(nextCardSelection(ranger, undefined, [warrior], 2)).toEqual([warrior, ranger]);
    });

    it('removes the clicked card when it is already selected', () => {
      expect(nextCardSelection(warrior, undefined, [warrior, ranger], 2)).toEqual([ranger]);
    });

    it('is a no-op when at the cap and the clicked card is not selected', () => {
      const atCap = [warrior, ranger];
      expect(nextCardSelection(wizard, undefined, atCap, 2)).toBe(atCap);
    });
  });
});
