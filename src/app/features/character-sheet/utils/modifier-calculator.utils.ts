import { DisplayStat, ModifierSource } from '../models/character-sheet-view.model';
import { CharacterSheetResponse, ModifierResponse } from '../../create-character/models/character-sheet-api.model';

export interface SourcedModifier {
  target: string;
  operation: 'SET' | 'MULTIPLY' | 'ADD';
  value: number;
  sourceName: string;
}

export function applyModifiers(
  baseValue: number,
  modifiers: SourcedModifier[],
  target: string,
): DisplayStat {
  const relevant = modifiers.filter(m => m.target === target);

  if (relevant.length === 0) {
    return { base: baseValue, modified: baseValue, hasModifier: false, modifierSources: [] };
  }

  let result = baseValue;
  const modifierSources: ModifierSource[] = [];

  const sets = relevant.filter(m => m.operation === 'SET');
  if (sets.length > 0) {
    result = sets[sets.length - 1].value;
  }

  const multiplies = relevant.filter(m => m.operation === 'MULTIPLY');
  for (const mod of multiplies) {
    result = Math.floor(result * mod.value);
  }

  const adds = relevant.filter(m => m.operation === 'ADD');
  for (const mod of adds) {
    result += mod.value;
  }

  for (const mod of relevant) {
    modifierSources.push({
      sourceName: mod.sourceName,
      operation: mod.operation,
      value: mod.value,
    });
  }

  return {
    base: baseValue,
    modified: result,
    hasModifier: result !== baseValue,
    modifierSources: result !== baseValue ? modifierSources : [],
  };
}

export function collectEquipmentModifiers(sheet: CharacterSheetResponse): SourcedModifier[] {
  const modifiers: SourcedModifier[] = [];

  if (sheet.activeArmor?.features) {
    for (const feature of sheet.activeArmor.features) {
      if (feature.modifiers) {
        modifiers.push(...feature.modifiers.map(m => toSourced(m, sheet.activeArmor!.name)));
      }
    }
  }

  if (sheet.activePrimaryWeapon?.features) {
    for (const feature of sheet.activePrimaryWeapon.features) {
      if (feature.modifiers) {
        modifiers.push(...feature.modifiers.map(m => toSourced(m, sheet.activePrimaryWeapon!.name)));
      }
    }
  }

  if (sheet.activeSecondaryWeapon?.features) {
    for (const feature of sheet.activeSecondaryWeapon.features) {
      if (feature.modifiers) {
        modifiers.push(...feature.modifiers.map(m => toSourced(m, sheet.activeSecondaryWeapon!.name)));
      }
    }
  }

  return modifiers;
}

function toSourced(mod: ModifierResponse, sourceName: string): SourcedModifier {
  return {
    target: mod.target,
    operation: mod.operation as SourcedModifier['operation'],
    value: mod.value,
    sourceName,
  };
}
