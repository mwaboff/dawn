import {
  CharacterSheetResponse,
  WeaponResponse,
  ArmorResponse,
  ClassCardResponse,
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
  WeaponDamageDice,
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
import { applyModifiers, collectAllModifiers, SourcedModifier } from './modifier-calculator.utils';
import { DiceType, DICE_TYPES } from '../../../shared/models/dice-roller.model';
import { RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../../../shared/components/daggerheart-card/daggerheart-card.model';

function formatEnumLabel(s: string): string {
  return s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Formats the short damage-type abbreviation. `PHYSICAL_AND_MAGIC` is a per-attack either/or
 * choice (e.g. Shadowblade's "Otherworldly" feature), so it is shown as "Phy/Mag" — never
 * combined damage.
 */
function formatDamageTypeAbbreviation(damageType: string | undefined | null): string {
  switch (damageType?.toUpperCase()) {
    case 'PHYSICAL':
      return 'Phy';
    case 'PHYSICAL_AND_MAGIC':
      return 'Phy/Mag';
    case 'MAGIC':
    default:
      return 'Mag';
  }
}

function formatDamage(damage: DamageRollResponse | undefined | null, proficiency: number): string {
  if (!damage) return '';
  const count = damage.diceCount ?? proficiency;
  const die = damage.diceType.toLowerCase();
  const mod = damage.modifier;
  const type = formatDamageTypeAbbreviation(damage.damageType);
  const modStr = mod && mod > 0 ? `+${mod}` : mod && mod < 0 ? `${mod}` : '';
  return `${count}${die}${modStr} ${type}`;
}

/**
 * `DamageRollResponse.diceType` is typed `string` and real API/fixture data mixes casing
 * (`'d8'`, `'D10'`) — hence the lowercase before comparing against the known `DiceType` union.
 */
function normalizeDiceType(diceType: string): DiceType | null {
  const normalized = diceType.toLowerCase();
  return (DICE_TYPES as readonly string[]).includes(normalized) ? (normalized as DiceType) : null;
}

function buildDamageDice(damage: DamageRollResponse | undefined | null): WeaponDamageDice | null {
  if (!damage) return null;
  const type = normalizeDiceType(damage.diceType);
  if (!type) return null;
  return { type, diceCount: damage.diceCount ?? null, modifier: damage.modifier ?? 0 };
}

/**
 * The placeholder a redacted response mapper returns in place of its normal mapping, for the four
 * card-summary types (class/ancestry/community/subclass/domain all extend or alias `CardSummary`).
 * Mirrors `buildRestrictedCardData` (`daggerheart-card.model.ts`): `name`/`description` are filled
 * with the same shared copy rather than left absent, so a caller that renders them without checking
 * `restricted` first still gets real text, and the classic template's `@if (card.restricted)`
 * branches are what actually draw the locked look.
 */
function buildRestrictedCardSummary(id: number, expansionName?: string): CardSummary {
  return {
    id,
    name: RESTRICTED_CARD_TITLE,
    description: restrictedCardMessage(expansionName),
    features: [],
    restricted: true,
    expansionName,
  };
}

/** See `buildRestrictedCardSummary`. `WeaponDisplay` has no `description` slot, so the locked
 * message is read from `restrictedCardMessage` directly wherever it's needed (the classic
 * template, `entity-card.mapper.ts`) rather than baked in here.
 *
 * `isPrimary: false` -- NOT `true`, even though it happens to be inert today (every restricted
 * weapon's slot-eligibility UI is already gated on `.restricted` before it would read this field;
 * see `weaponCardEntry`/`weaponEquipActions`). `isPrimary` is one of the fields this weapon's own
 * doc comment on `WeaponDisplay.restricted` says is redacted, so defaulting it to `true` would
 * read as "yes, this is genuinely a primary-slot weapon" the moment any future caller reads it
 * without checking `restricted` first -- the exact fabricated-fact failure this whole redaction
 * scheme exists to prevent. `false` is the inert default; nothing downstream treats "not primary"
 * as an affirmative claim the way "primary" would be.
 */
function buildRestrictedWeaponDisplay(entryId: number, id: number, expansionName?: string): WeaponDisplay {
  return {
    id,
    inventoryEntryId: entryId,
    name: RESTRICTED_CARD_TITLE,
    isPrimary: false,
    damage: '',
    trait: '',
    range: '',
    burden: '',
    features: [],
    restricted: true,
    expansionName,
  };
}

/** See `buildRestrictedWeaponDisplay`. */
function buildRestrictedArmorDisplay(entryId: number, id: number, expansionName?: string): ArmorDisplay {
  return {
    id,
    inventoryEntryId: entryId,
    name: RESTRICTED_CARD_TITLE,
    baseScore: 0,
    baseMajorThreshold: 0,
    baseSevereThreshold: 0,
    features: [],
    restricted: true,
    expansionName,
  };
}

/** See `buildRestrictedCardSummary` -- `LootDisplay` does carry a `description`, so (like
 * `CardSummary`) the locked message is baked in here. */
function buildRestrictedLootDisplay(entryId: number, id: number, expansionName?: string): LootDisplay {
  return {
    id,
    inventoryEntryId: entryId,
    name: RESTRICTED_CARD_TITLE,
    description: restrictedCardMessage(expansionName),
    isConsumable: false,
    costTags: [],
    restricted: true,
    expansionName,
  };
}

function formatModifierLabel(target: string, operation: string, value: number): string {
  const label = formatEnumLabel(target);
  if (operation === 'ADD') return `${value >= 0 ? '+' : ''}${value} ${label}`;
  if (operation === 'MULTIPLY') return `×${value} ${label}`;
  return `${label} ${value}`;
}

export function mapToCharacterSheetView(sheet: CharacterSheetResponse): CharacterSheetView {
  const modifiers = collectAllModifiers(sheet);
  const proficiencyStat = applyModifiers(sheet.proficiency, modifiers, 'PROFICIENCY');
  const proficiency = proficiencyStat.modified;

  const equippedArmor = (sheet.inventoryArmors ?? []).find(a => a.equipped)?.armor;
  const level = sheet.level;
  const majorBase = equippedArmor
    ? (equippedArmor.baseMajorThreshold ?? 0) + level
    : level;
  const severeBase = equippedArmor
    ? (equippedArmor.baseSevereThreshold ?? 0) + level
    : level * 2;
  const armorScoreBase = equippedArmor ? (equippedArmor.baseScore ?? 0) : 0;
  // Surfaced to the view so a template can mark Armor Score/Major/Severe as incomplete rather
  // than trusting the `?? 0` fallback above as the whole story -- see `CharacterSheetView
  // .armorRestricted`'s own doc comment for why the arithmetic itself is deliberately unchanged.
  const armorRestricted = equippedArmor?.restricted === true;

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
    armorScore: applyModifiers(armorScoreBase, modifiers, 'ARMOR_SCORE'),
    majorDamageThreshold: applyModifiers(majorBase, modifiers, 'MAJOR_DAMAGE_THRESHOLD'),
    severeDamageThreshold: applyModifiers(severeBase, modifiers, 'SEVERE_DAMAGE_THRESHOLD'),
    armorRestricted,
    hopeMax: applyModifiers(sheet.hopeMax, modifiers, 'HOPE_MAX'),
    stressMax: applyModifiers(sheet.stressMax, modifiers, 'STRESS_MAX'),

    hitPointMarked: sheet.hitPointMarked,
    armorMarked: sheet.armorMarked,
    armorMax: sheet.armorMax,
    hopeMarked: sheet.hopeMarked,
    stressMarked: sheet.stressMarked,
    gold: sheet.gold,

    traits: mapTraits(sheet, modifiers),

    activePrimaryWeapon: mapEquippedWeapon(sheet.inventoryWeapons, 'PRIMARY', proficiency),
    activeSecondaryWeapon: mapEquippedWeapon(sheet.inventoryWeapons, 'SECONDARY', proficiency),
    activeArmor: mapFirstEquippedArmor(sheet.inventoryArmors),

    // `classes` is the multiclass-aware field (every class, in acquisition order) and arrives
    // whenever `expand=class` is requested, which the sheet page always does. `class` is its
    // deprecated singular -- only `classes[0]` -- and is the fallback for older responses and
    // fixtures that predate the plural.
    classCards: (sheet.classes ?? (sheet.class ? [sheet.class] : [])).map(c => mapClassCardSummary(c)),
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
    notes: sheet.notes,
    comboDie: sheet.comboDie,
  };
}

function mapTraits(sheet: CharacterSheetResponse, modifiers: SourcedModifier[]): TraitDisplay[] {
  return [
    { name: 'Agility', abbreviation: 'AGI', modifier: applyModifiers(sheet.agilityModifier, modifiers, 'AGILITY'), marked: sheet.agilityMarked },
    { name: 'Strength', abbreviation: 'STR', modifier: applyModifiers(sheet.strengthModifier, modifiers, 'STRENGTH'), marked: sheet.strengthMarked },
    { name: 'Finesse', abbreviation: 'FIN', modifier: applyModifiers(sheet.finesseModifier, modifiers, 'FINESSE'), marked: sheet.finesseMarked },
    { name: 'Instinct', abbreviation: 'INS', modifier: applyModifiers(sheet.instinctModifier, modifiers, 'INSTINCT'), marked: sheet.instinctMarked },
    { name: 'Presence', abbreviation: 'PRE', modifier: applyModifiers(sheet.presenceModifier, modifiers, 'PRESENCE'), marked: sheet.presenceMarked },
    { name: 'Knowledge', abbreviation: 'KNO', modifier: applyModifiers(sheet.knowledgeModifier, modifiers, 'KNOWLEDGE'), marked: sheet.knowledgeMarked },
  ];
}

/**
 * Exported for the beta sheet's item finder, which draws catalogue gear with the same card mapper
 * the inventory uses (`character-sheet-beta/utils/catalog-card.mapper.ts`) so a weapon reads
 * identically before and after it is picked up. A catalogue item sits in no inventory yet, so the
 * finder passes the item's own id as `entryId`; the resulting display is read for presentation
 * only and never serialized back into an inventory payload.
 */
export function buildWeaponDisplay(entryId: number, weapon: WeaponResponse, proficiency: number): WeaponDisplay {
  if (weapon.restricted) return buildRestrictedWeaponDisplay(entryId, weapon.id, weapon.expansionName);
  return {
    id: weapon.id,
    inventoryEntryId: entryId,
    createdByUserId: weapon.createdByUserId,
    name: weapon.name,
    tier: weapon.tier,
    isPrimary: weapon.isPrimary ?? true,
    damage: formatDamage(weapon.damage, proficiency),
    damageDice: buildDamageDice(weapon.damage),
    trait: weapon.trait ? formatEnumLabel(weapon.trait) : '',
    range: weapon.range ? formatEnumLabel(weapon.range) : '',
    burden: weapon.burden ?? '',
    features: (weapon.features ?? []).map(mapFeature),
  };
}

/** See `buildWeaponDisplay` for why this is exported and what `entryId` means to a catalogue item. */
export function buildArmorDisplay(entryId: number, armor: ArmorResponse): ArmorDisplay {
  if (armor.restricted) return buildRestrictedArmorDisplay(entryId, armor.id, armor.expansionName);
  return {
    id: armor.id,
    inventoryEntryId: entryId,
    createdByUserId: armor.createdByUserId,
    name: armor.name,
    tier: armor.tier,
    baseScore: armor.baseScore ?? 0,
    baseMajorThreshold: armor.baseMajorThreshold ?? 0,
    baseSevereThreshold: armor.baseSevereThreshold ?? 0,
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

function mapClassCardSummary(card: ClassCardResponse): CardSummary {
  if (card.restricted) return buildRestrictedCardSummary(card.id, card.expansionName);
  return {
    id: card.id,
    name: card.name,
    description: card.description,
    features: [
      ...(card.hopeFeatures ?? []).map(mapFeature),
      ...(card.classFeatures ?? []).map(mapFeature),
    ],
  };
}

function mapCardSummary(card: CommunityCardResponse | AncestryCardResponse): CardSummary {
  if (card.restricted) return buildRestrictedCardSummary(card.id, card.expansionName);
  return {
    id: card.id,
    name: card.name,
    description: card.description,
    features: (card.features ?? []).map(mapFeature),
  };
}

function mapSubclassCardSummary(card: SubclassCardResponse): SubclassCardSummary {
  if (card.restricted) return buildRestrictedCardSummary(card.id, card.expansionName);
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
  if (card.restricted) return buildRestrictedCardSummary(card.id, card.expansionName);
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

/** See `buildWeaponDisplay` for why this is exported and what `entryId` means to a catalogue item. */
export function buildLootDisplay(entryId: number, loot: LootApiResponse): LootDisplay {
  if (loot.restricted) return buildRestrictedLootDisplay(entryId, loot.id, loot.expansionName);
  return {
    id: loot.id,
    inventoryEntryId: entryId,
    createdByUserId: loot.createdByUserId,
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
    baseMajorThreshold: 0,
    baseSevereThreshold: 0,
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
