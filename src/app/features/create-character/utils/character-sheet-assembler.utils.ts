import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { TraitAssignments } from '../models/trait.model';
import { Experience } from '../models/experience.model';
import { CharacterSheetData, DEFAULT_MAJOR_THRESHOLD, DEFAULT_SEVERE_THRESHOLD } from '../models/character-sheet.model';

export const MAX_EQUIPPED_DOMAIN_CARDS = 5;

function deduplicateIds(ids: number[]): number[] {
  return [...new Set(ids)];
}

export function assembleCharacterSheet(params: {
  name: string;
  pronouns?: string;
  classCard: CardData;
  subclassCard: CardData;
  ancestryCard: CardData;
  communityCard: CardData;
  traits: TraitAssignments;
  primaryWeapon: CardData | null;
  secondaryWeapon: CardData | null;
  armor: CardData | null;
  experiences: Experience[];
  domainCards: CardData[];
  bonusDomainCards?: CardData[];
}): CharacterSheetData {
  const { classCard, armor, traits } = params;

  const startingEvasion = (classCard.metadata?.['startingEvasion'] as number) ?? 0;
  const startingHitPoints = (classCard.metadata?.['startingHitPoints'] as number) ?? 0;

  const majorDamageThreshold = armor
    ? ((armor.metadata?.['baseMajorThreshold'] as number) ?? DEFAULT_MAJOR_THRESHOLD)
    : DEFAULT_MAJOR_THRESHOLD;
  const severeDamageThreshold = armor
    ? ((armor.metadata?.['baseSevereThreshold'] as number) ?? DEFAULT_SEVERE_THRESHOLD)
    : DEFAULT_SEVERE_THRESHOLD;

  const armorMax = armor ? ((armor.metadata?.['baseScore'] as number) ?? 0) : 0;

  return {
    name: params.name,
    pronouns: params.pronouns || undefined,
    level: 1,
    evasion: startingEvasion,
    hitPointMax: startingHitPoints,
    hitPointMarked: 0,
    hopeMax: 6,
    hopeMarked: 2,
    stressMax: 6,
    stressMarked: 0,
    armorMax,
    armorMarked: 0,
    majorDamageThreshold,
    severeDamageThreshold,
    agilityModifier: traits.agility ?? 0,
    strengthModifier: traits.strength ?? 0,
    finesseModifier: traits.finesse ?? 0,
    instinctModifier: traits.instinct ?? 0,
    presenceModifier: traits.presence ?? 0,
    knowledgeModifier: traits.knowledge ?? 0,
    agilityMarked: false,
    strengthMarked: false,
    finesseMarked: false,
    instinctMarked: false,
    presenceMarked: false,
    knowledgeMarked: false,
    gold: 0,
    inventoryWeapons: buildInventoryWeapons(params.primaryWeapon, params.secondaryWeapon),
    inventoryArmors: armor ? [{ armorId: armor.id, equipped: true }] : [],
    communityCardIds: [params.communityCard.id],
    ancestryCardIds: [params.ancestryCard.id],
    subclassCardIds: [params.subclassCard.id],
    domainCardIds: deduplicateIds([...params.domainCards, ...(params.bonusDomainCards ?? [])].map((c) => c.id)),
    equippedDomainCardIds: deduplicateIds(params.domainCards.map((c) => c.id)).slice(0, MAX_EQUIPPED_DOMAIN_CARDS),
    vaultDomainCardIds: [
      ...deduplicateIds(params.domainCards.map((c) => c.id)).slice(MAX_EQUIPPED_DOMAIN_CARDS),
      ...deduplicateIds((params.bonusDomainCards ?? []).map((c) => c.id)),
    ],
    experiences: params.experiences
      .filter((exp) => exp.name.trim() !== '' && exp.modifier !== null)
      .map((exp) => ({ name: exp.name.trim(), modifier: exp.modifier! })),
  };
}

function buildInventoryWeapons(
  primary: CardData | null,
  secondary: CardData | null,
): { weaponId: number; equipped: boolean; slot?: 'PRIMARY' | 'SECONDARY' }[] {
  const weapons: { weaponId: number; equipped: boolean; slot?: 'PRIMARY' | 'SECONDARY' }[] = [];
  if (primary) {
    weapons.push({ weaponId: primary.id, equipped: true, slot: 'PRIMARY' });
  }
  if (secondary) {
    weapons.push({ weaponId: secondary.id, equipped: true, slot: 'SECONDARY' });
  }
  return weapons;
}
