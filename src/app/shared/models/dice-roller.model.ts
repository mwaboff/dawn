export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export const DICE_TYPES: readonly DiceType[] =
  ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;

export const DICE_SIDES: Readonly<Record<DiceType, number>> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

export interface DiceSelection {
  type: DiceType;
  count: number;
}

export interface RollRequest {
  dice: DiceSelection[];
  includeDuality: boolean;
  label?: string;
}

export interface DieResult {
  type: DiceType;
  value: number;
}

export interface DualityResult {
  hope: number;
  fear: number;
  outcome: 'hope' | 'fear' | 'crit';
}

export interface RollResult {
  id: string;
  timestamp: number;
  diceResults: DieResult[];
  duality: DualityResult | null;
  total: number;
  label?: string;
}

export const DICE_ROLLER_THEMES = ['tavern-scroll'] as const;
export type DiceRollerTheme = 'tavern-scroll';
