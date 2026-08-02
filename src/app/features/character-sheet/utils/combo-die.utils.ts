import { ComboDieType } from '../../create-character/models/character-sheet-api.model';

/**
 * Brawler Combo Die sizes in ascending order, matching the backend's DiceType order.
 * The Combo Die starts at d4 and steps up one size per purchased "Upgrade Combo Die"
 * advancement (once per tier); an unset die on the sheet means it is still the starting d4.
 */
export const COMBO_DIE_LADDER: readonly ComboDieType[] = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'];

export function stepComboDie(current: ComboDieType | undefined, steps: number): ComboDieType {
  const start = Math.max(0, COMBO_DIE_LADDER.indexOf(current ?? 'D4'));
  return COMBO_DIE_LADDER[Math.min(start + steps, COMBO_DIE_LADDER.length - 1)];
}

export function formatComboDie(die: ComboDieType): string {
  return die.toLowerCase();
}
