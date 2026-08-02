import { stepComboDie, formatComboDie, COMBO_DIE_LADDER } from './combo-die.utils';

describe('combo-die.utils', () => {
  describe('stepComboDie', () => {
    it('treats an unset die as the starting d4', () => {
      expect(stepComboDie(undefined, 1)).toBe('D6');
    });

    it('returns the current die when stepping zero times', () => {
      expect(stepComboDie('D8', 0)).toBe('D8');
    });

    it('steps one size up the ladder', () => {
      expect(stepComboDie('D6', 1)).toBe('D8');
    });

    it('steps multiple sizes at once', () => {
      expect(stepComboDie('D4', 2)).toBe('D8');
    });

    it('caps at the top of the ladder', () => {
      expect(stepComboDie('D20', 1)).toBe('D20');
    });

    it('keeps the ladder in ascending backend DiceType order', () => {
      expect(COMBO_DIE_LADDER).toEqual(['D4', 'D6', 'D8', 'D10', 'D12', 'D20']);
    });
  });

  describe('formatComboDie', () => {
    it('formats the die for display in lowercase', () => {
      expect(formatComboDie('D10')).toBe('d10');
    });
  });
});
