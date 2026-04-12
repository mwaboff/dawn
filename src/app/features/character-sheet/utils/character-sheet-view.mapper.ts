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
  DamageRollResponse,
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
  FeatureModifierDisplay,
  TraitDisplay,
  ExperienceDisplay,
  ClassEntry,
} from '../models/character-sheet-view.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { applyModifiers, collectEquipmentModifiers } from './modifier-calculator.utils';

function formatEnumLabel(s: string): string {
  return s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

function formatDamage(damage: DamageRollResponse | undefined | null, proficiency: number): string {
  if (!damage) return '';
  const count = damage.diceCount ?? proficiency;
  const die = damage.diceType.toLowerCase();
  const mod = damage.modifier;
  const type = damage.damageType?.toUpperCase() === 'PHYSICAL' ? 'Phy' : 'Mag';
  const modStr = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : '';
  return `${count}${die}${modStr} ${type}`;
}

function formatModifierLabel(target: string, operation: string, value: number): string {
  const label = formatEnumLabel(target);
  if (operation === 'ADD') return `${value >= 0 ? '+' : ''}${value} ${label}`;
  if (operation === 'MULTIPLY') return `×${value} ${label}`;
  return `${label} ${value}`;
}

export function mapToCharacterSheetView(sheet: CharacterSheetResponse): CharacterSheetView {
  const modifiers = collectEquipmentModifiers(sheet);
  const proficiencyStat = applyModifiers(sheet.proficiency, modifiers, 'PROFICIENCY');
  const proficiency = proficiencyStat.modified;

  return {
    id: sheet.id,
    ownerId: sheet.ownerId,
    ownerName: sheet.ownerName,
    name: sheet.name,
    pronouns: sheet.pronouns,
    level: sheet.level,

    proficiency: proficiencyStat,
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

    activePrimaryWeapon: mapEquippedWeapon(sheet.inventoryWeapons, 'PRIMARY', proficiency),
    activeSecondaryWeapon: mapEquippedWeapon(sheet.inventoryWeapons, 'SECONDARY', proficiency),
    activeArmor: mapFirstEquippedArmor(sheet.inventoryArmors),

    subclassCards: (sheet.subclassCards ?? []).map(c => mapSubclassCardSummary(c)),
    ancestryCards: (sheet.ancestryCards ?? []).map(c => mapCardSummary(c)),
    communityCards: (sheet.communityCards ?? []).map(c => mapCardSummary(c)),
    domainCards: (sheet.domainCards ?? []).map(c => mapDomainCardSummary(c)),
    ...splitDomainCards(sheet),
    maxEquippedDomainCards: 5,
    inventoryWeapons: (sheet.inventoryWeapons ?? []).map(w => mapInventoryWeapon(w, proficiency)),
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

function buildWeaponDisplay(entryId: number, weapon: WeaponResponse, proficiency: number): WeaponDisplay {
  return {
    id: weapon.id,
    inventoryEntryId: entryId,
    name: weapon.name,
    tier: weapon.tier,
    isPrimary: weapon.isPrimary ?? true,
    damage: formatDamage(weapon.damage, proficiency),
    trait: weapon.trait ? formatEnumLabel(weapon.trait) : '',
    range: weapon.range ? formatEnumLabel(weapon.range) : '',
    burden: weapon.burden ?? '',
    features: (weapon.features ?? []).map(mapFeature),
  };
}

function buildArmorDisplay(entryId: number, armor: ArmorResponse): ArmorDisplay {
  return {
    id: armor.id,
    inventoryEntryId: entryId,
    name: armor.name,
    tier: armor.tier,
    baseScore: armor.baseScore ?? 0,
    features: (armor.features ?? []).map(mapFeature),
  };
}

function mapFeature(feature: FeatureResponse): FeatureDisplay {
  const rawTags = (feature.costTags ?? []).map(t => t.label);
  const sortedTags = [...rawTags].sort();
  return {
    name: feature.name ?? '',
    description: feature.description,
    tags: sortedTags,
    modifiers: (feature.modifiers ?? []).map(m => ({
      label: formatModifierLabel(m.target, m.operation, m.value),
      value: m.value,
      operation: m.operation as FeatureModifierDisplay['operation'],
      target: m.target,
    })),
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

function buildLootDisplay(entryId: number, loot: LootApiResponse): LootDisplay {
  return {
    id: loot.id,
    inventoryEntryId: entryId,
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

function mapEquippedWeapon(weapons: InventoryWeaponResponse[] | undefined, slot: 'PRIMARY' | 'SECONDARY', proficiency: number): WeaponDisplay | null {
  const entry = (weapons ?? []).find(w => w.slot === slot);
  return entry?.weapon ? buildWeaponDisplay(entry.id, entry.weapon, proficiency) : null;
}

function mapFirstEquippedArmor(armors: InventoryArmorResponse[] | undefined): ArmorDisplay | null {
  const entry = (armors ?? []).find(a => a.equipped);
  return entry?.armor ? buildArmorDisplay(entry.id, entry.armor) : null;
}

function mapInventoryWeapon(entry: InventoryWeaponResponse, proficiency: number): WeaponDisplay {
  if (entry.weapon) {
    return buildWeaponDisplay(entry.id, entry.weapon, proficiency);
  }
  return {
    id: entry.weaponId,
    inventoryEntryId: entry.id,
    name: '',
    isPrimary: true,
    damage: '',
    trait: '',
    range: '',
    burden: '',
    features: [],
  };
}

function mapInventoryArmor(entry: InventoryArmorResponse): ArmorDisplay {
  if (entry.armor) {
    return buildArmorDisplay(entry.id, entry.armor);
  }
  return {
    id: entry.armorId,
    inventoryEntryId: entry.id,
    name: '',
    baseScore: 0,
    features: [],
  };
}

function mapInventoryLoot(entry: InventoryLootResponse): LootDisplay {
  if (entry.loot) {
    return buildLootDisplay(entry.id, entry.loot);
  }
  return {
    id: entry.lootId,
    inventoryEntryId: entry.id,
    name: '',
    isConsumable: false,
    costTags: [],
  };
}
