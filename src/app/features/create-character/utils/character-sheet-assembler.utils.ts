import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { TraitAssignments } from '../models/trait.model';
import { Experience } from '../models/experience.model';
import { CharacterSheetData, DEFAULT_MAJOR_THRESHOLD, DEFAULT_SEVERE_THRESHOLD } from '../models/character-sheet.model';

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

  const weaponIds: number[] = [];
  if (params.primaryWeapon) weaponIds.push(params.primaryWeapon.id);
  if (params.secondaryWeapon) weaponIds.push(params.secondaryWeapon.id);

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
    activePrimaryWeaponId: params.primaryWeapon?.id ?? null,
    activeSecondaryWeaponId: params.secondaryWeapon?.id ?? null,
    activeArmorId: armor?.id ?? null,
    inventoryWeaponIds: weaponIds,
    inventoryArmorIds: armor ? [armor.id] : [],
    communityCardIds: [params.communityCard.id],
    ancestryCardIds: [params.ancestryCard.id],
    subclassCardIds: [params.subclassCard.id],
    domainCardIds: params.domainCards.map((c) => c.id),
    experiences: params.experiences
      .filter((exp) => exp.name.trim() !== '' && exp.modifier !== null)
      .map((exp) => ({ name: exp.name.trim(), modifier: exp.modifier! })),
  };
}
