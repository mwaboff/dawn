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
} from '../../create-character/models/character-sheet-api.model';
import {
  CharacterSheetView,
  WeaponDisplay,
  ArmorDisplay,
  CardSummary,
  SubclassCardSummary,
  DomainCardSummary,
  FeatureDisplay,
  TraitDisplay,
  ExperienceDisplay,
} from '../models/character-sheet-view.model';
import { applyModifiers, collectEquipmentModifiers } from './modifier-calculator.utils';

export function mapToCharacterSheetView(sheet: CharacterSheetResponse): CharacterSheetView {
  const modifiers = collectEquipmentModifiers(sheet);

  return {
    id: sheet.id,
    name: sheet.name,
    pronouns: sheet.pronouns,
    level: sheet.level,

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

    activePrimaryWeapon: sheet.activePrimaryWeapon ? mapWeapon(sheet.activePrimaryWeapon) : null,
    activeSecondaryWeapon: sheet.activeSecondaryWeapon ? mapWeapon(sheet.activeSecondaryWeapon) : null,
    activeArmor: sheet.activeArmor ? mapArmor(sheet.activeArmor) : null,

    subclassCards: (sheet.subclassCards ?? []).map(c => mapSubclassCardSummary(c)),
    ancestryCards: (sheet.ancestryCards ?? []).map(c => mapCardSummary(c)),
    communityCards: (sheet.communityCards ?? []).map(c => mapCardSummary(c)),
    domainCards: (sheet.domainCards ?? []).map(c => mapDomainCardSummary(c)),

    experiences: (sheet.experiences ?? []).map(mapExperience),
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

function mapExperience(exp: ExperienceResponse): ExperienceDisplay {
  return {
    id: exp.id,
    description: exp.description,
    modifier: exp.modifier,
  };
}
