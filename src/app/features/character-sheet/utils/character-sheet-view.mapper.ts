import {
  CharacterSheetResponse,
  WeaponResponse,
  ArmorResponse,
  CommunityCardResponse,
  AncestryCardResponse,
  SubclassCardResponse,
  DomainCardResponse,
  FeatureResponse,
  ExperienceResponse,
  InventoryWeaponResponse,
  InventoryArmorResponse,
  InventoryLootResponse,
} from '../../create-character/models/character-sheet-api.model';
import {
  CharacterSheetView,
  WeaponDisplay,
  ArmorDisplay,
  LootDisplay,
  CardSummary,
  SubclassCardSummary,
  DomainCardSummary,
  FeatureDisplay,
  TraitDisplay,
  ExperienceDisplay,
  ClassEntry,
} from '../models/character-sheet-view.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { applyModifiers, collectEquipmentModifiers } from './modifier-calculator.utils';

export function mapToCharacterSheetView(sheet: CharacterSheetResponse): CharacterSheetView {
  const modifiers = collectEquipmentModifiers(sheet);

  return {
    id: sheet.id,
    ownerId: sheet.ownerId,
    ownerName: sheet.ownerName,
    name: sheet.name,
    pronouns: sheet.pronouns,
    level: sheet.level,

    proficiency: applyModifiers(sheet.proficiency, modifiers, 'PROFICIENCY'),
    evasion: applyModifiers(sheet.evasion, modifiers, 'EVASION'),
    hitPointMax: applyModifiers(sheet.hitPointMax, modifiers, 'HIT_POINT_MAX'),
    armorScore: applyModifiers(sheet.armorMax, modifiers, 'ARMOR_SCORE'),
    majorDamageThreshold: applyModifiers(sheet.majorDamageThreshold, modifiers, 'MAJOR_DAMAGE_THRESHOLD'),
    severeDamageThreshold: applyModifiers(sheet.severeDamageThreshold, modifiers, 'SEVERE_DAMAGE_THRESHOLD'),
    hopeMax: applyModifiers(sheet.hopeMax, modifiers, 'HOPE_MAX'),
    stressMax: applyModifiers(sheet.stressMax, modifiers, 'STRESS_MAX'),

    hitPointMarked: sheet.hitPointMarked,
    armorMarked: sheet.armorMarked,
    armorMax: sheet.armorMax,
    hopeMarked: sheet.hopeMarked,
    stressMarked: sheet.stressMarked,
    gold: sheet.gold,

    traits: mapTraits(sheet),

    activePrimaryWeapon: mapEquippedWeapon(sheet.inventoryWeapons, 'PRIMARY'),
    activeSecondaryWeapon: mapEquippedWeapon(sheet.inventoryWeapons, 'SECONDARY'),
    activeArmor: mapFirstEquippedArmor(sheet.inventoryArmors),

    subclassCards: (sheet.subclassCards ?? []).map(c => mapSubclassCardSummary(c)),
    ancestryCards: (sheet.ancestryCards ?? []).map(c => mapCardSummary(c)),
    communityCards: (sheet.communityCards ?? []).map(c => mapCardSummary(c)),
    domainCards: (sheet.domainCards ?? []).map(c => mapDomainCardSummary(c)),
    ...splitDomainCards(sheet),
    maxEquippedDomainCards: 5,
    inventoryWeapons: (sheet.inventoryWeapons ?? []).map(w => mapInventoryWeapon(w)),
    inventoryArmors: (sheet.inventoryArmors ?? []).map(a => mapInventoryArmor(a)),
    inventoryItems: (sheet.inventoryItems ?? []).map(i => mapInventoryLoot(i)),

    experiences: (sheet.experiences ?? []).map(mapExperience),

    classEntries: extractClassEntries(sheet.subclassCards ?? []),
  };
}

function mapTraits(sheet: CharacterSheetResponse): TraitDisplay[] {
  return [
    { name: 'Agility', abbreviation: 'AGI', modifier: sheet.agilityModifier, marked: sheet.agilityMarked },
    { name: 'Strength', abbreviation: 'STR', modifier: sheet.strengthModifier, marked: sheet.strengthMarked },
    { name: 'Finesse', abbreviation: 'FIN', modifier: sheet.finesseModifier, marked: sheet.finesseMarked },
    { name: 'Instinct', abbreviation: 'INS', modifier: sheet.instinctModifier, marked: sheet.instinctMarked },
    { name: 'Presence', abbreviation: 'PRE', modifier: sheet.presenceModifier, marked: sheet.presenceMarked },
    { name: 'Knowledge', abbreviation: 'KNO', modifier: sheet.knowledgeModifier, marked: sheet.knowledgeMarked },
  ];
}

function mapWeapon(weapon: WeaponResponse): WeaponDisplay {
  return {
    id: weapon.id,
    name: weapon.name,
    damage: weapon.damage?.notation ?? '',
    trait: weapon.trait ?? '',
    range: weapon.range ?? '',
    burden: weapon.burden ?? '',
    features: (weapon.features ?? []).map(mapFeature),
  };
}

function mapArmor(armor: ArmorResponse): ArmorDisplay {
  return {
    id: armor.id,
    name: armor.name,
    baseScore: armor.baseScore ?? 0,
    features: (armor.features ?? []).map(mapFeature),
  };
}

function mapFeature(feature: FeatureResponse): FeatureDisplay {
  return {
    name: feature.name ?? '',
    description: feature.description,
    tags: (feature.costTags ?? []).map(t => t.label),
  };
}

function mapCardSummary(card: CommunityCardResponse | AncestryCardResponse): CardSummary {
  return {
    id: card.id,
    name: card.name,
    description: card.description,
    features: (card.features ?? []).map(mapFeature),
  };
}

function mapSubclassCardSummary(card: SubclassCardResponse): SubclassCardSummary {
  return {
    id: card.id,
    name: card.name,
    description: card.description,
    features: (card.features ?? []).map(mapFeature),
    associatedClassId: card.associatedClassId,
    associatedClassName: card.associatedClassName,
    subclassPathName: card.subclassPathName,
    domainNames: card.domainNames,
    level: card.level,
  };
}

function mapDomainCardSummary(card: DomainCardResponse): DomainCardSummary {
  return {
    id: card.id,
    name: card.name,
    description: card.description,
    features: (card.features ?? []).map(mapFeature),
    domainName: card.associatedDomainName,
    level: card.level,
    recallCost: card.recallCost,
    type: card.type,
  };
}

function mapLoot(loot: LootApiResponse): LootDisplay {
  return {
    id: loot.id,
    name: loot.name,
    description: loot.description,
    isConsumable: loot.isConsumable ?? false,
    costTags: loot.costTags ?? [],
  };
}

function mapExperience(exp: ExperienceResponse): ExperienceDisplay {
  return {
    id: exp.id,
    description: exp.description,
    modifier: exp.modifier,
  };
}

function splitDomainCards(sheet: CharacterSheetResponse): { equippedDomainCards: DomainCardSummary[]; vaultDomainCards: DomainCardSummary[] } {
  const allCards = (sheet.domainCards ?? []).map(c => mapDomainCardSummary(c));
  const equippedIds = new Set(sheet.equippedDomainCardIds ?? []);
  const vaultIds = new Set(sheet.vaultDomainCardIds ?? []);

  const equippedDomainCards = allCards.filter(c => equippedIds.has(c.id));
  const vaultDomainCards = allCards.filter(c => vaultIds.has(c.id));

  return { equippedDomainCards, vaultDomainCards };
}

function extractClassEntries(subclassCards: SubclassCardResponse[]): ClassEntry[] {
  const seen = new Map<string, ClassEntry>();
  for (const card of subclassCards) {
    const className = card.associatedClassName ?? 'Unknown';
    if (!seen.has(className)) {
      seen.set(className, { className, subclassName: card.subclassPathName });
    }
  }
  return [...seen.values()];
}

function mapEquippedWeapon(weapons: InventoryWeaponResponse[] | undefined, slot: 'PRIMARY' | 'SECONDARY'): WeaponDisplay | null {
  const entry = (weapons ?? []).find(w => w.slot === slot);
  return entry?.weapon ? mapWeapon(entry.weapon) : null;
}

function mapFirstEquippedArmor(armors: InventoryArmorResponse[] | undefined): ArmorDisplay | null {
  const entry = (armors ?? []).find(a => a.equipped);
  return entry?.armor ? mapArmor(entry.armor) : null;
}

function mapInventoryWeapon(entry: InventoryWeaponResponse): WeaponDisplay {
  if (entry.weapon) {
    return mapWeapon(entry.weapon);
  }
  return { id: entry.weaponId, name: '', damage: '', trait: '', range: '', burden: '', features: [] };
}

function mapInventoryArmor(entry: InventoryArmorResponse): ArmorDisplay {
  if (entry.armor) {
    return mapArmor(entry.armor);
  }
  return { id: entry.armorId, name: '', baseScore: 0, features: [] };
}

function mapInventoryLoot(entry: InventoryLootResponse): LootDisplay {
  if (entry.loot) {
    return mapLoot(entry.loot);
  }
  return { id: entry.lootId, name: '', isConsumable: false, costTags: [] };
}
