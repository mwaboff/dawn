import { ModifierResponse } from '../../features/create-character/models/character-sheet-api.model';

export type ModifierTarget =
  | 'BONUS_DOMAIN_CARD_SELECTIONS';

interface FeatureLike {
  modifiers?: readonly ModifierResponse[];
}

export function sumFeatureModifier(
  features: readonly FeatureLike[] | undefined,
  target: ModifierTarget,
): number {
  if (!features) return 0;
  return features.reduce((acc, f) => acc + sumOne(f.modifiers, target), 0);
}

function sumOne(modifiers: readonly ModifierResponse[] | undefined, target: ModifierTarget): number {
  if (!modifiers) return 0;
  return modifiers
    .filter(m => m.target === target && m.operation === 'ADD')
    .reduce((s, m) => s + m.value, 0);
}
