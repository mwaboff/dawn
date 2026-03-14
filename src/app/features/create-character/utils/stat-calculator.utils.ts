import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';

export function calculateDisplayEvasion(
  baseEvasion: number,
  armor: CardData | null,
  primaryWeapon: CardData | null,
  secondaryWeapon: CardData | null,
): number {
  let evasion = baseEvasion;

  const armorModifiers = (armor?.metadata?.['modifiers'] as Modifier[]) ?? [];
  evasion = applyModifiers(evasion, armorModifiers, 'EVASION');

  const primaryModifiers = (primaryWeapon?.metadata?.['modifiers'] as Modifier[]) ?? [];
  evasion = applyModifiers(evasion, primaryModifiers, 'EVASION');

  const secondaryModifiers = (secondaryWeapon?.metadata?.['modifiers'] as Modifier[]) ?? [];
  evasion = applyModifiers(evasion, secondaryModifiers, 'EVASION');

  return evasion;
}

interface Modifier {
  target: string;
  operation: 'ADD' | 'SET' | 'MULTIPLY';
  value: number;
}

function applyModifiers(base: number, modifiers: Modifier[], target: string): number {
  let result = base;
  for (const mod of modifiers) {
    if (mod.target !== target) continue;
    switch (mod.operation) {
      case 'ADD':
        result += mod.value;
        break;
      case 'SET':
        result = mod.value;
        break;
      case 'MULTIPLY':
        result *= mod.value;
        break;
    }
  }
  return result;
}
