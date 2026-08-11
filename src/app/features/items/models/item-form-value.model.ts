import { FeatureInput, RawFeatureResponse } from '../../../shared/models/feature-api.model';
import {
  DamageType,
  DiceType,
  SELECTABLE_WEAPON_RANGES,
  WeaponBurden,
  WeaponRange,
  WeaponTrait,
} from '../../../shared/models/weapon-api.model';
import { ItemKind } from '../../../shared/utils/item-routes.utils';

/**
 * Everything the item builder can edit, flattened across all three kinds rather than split into a
 * discriminated union. One flat shape keeps a single reactive form behind the kind picker, so
 * switching from weapon to armor and back does not throw away what was already typed.
 *
 * Fields belonging to the kinds that are not selected are ignored when the payload is built.
 */
export interface ItemFormValue {
  kind: ItemKind;
  name: string;
  /** 1-4. Presented as "Rarity" for loot, where the same four steps are Common..Legendary. */
  tier: number;
  campaignIds: number[];
  isPublic: boolean;
  features: FeatureInput[];

  isPrimary: boolean;
  trait: WeaponTrait;
  range: WeaponRange;
  burden: WeaponBurden;
  diceType: DiceType;
  /** Flat damage bonus. The dice *count* is deliberately absent -- it comes from Proficiency. */
  modifier: number;
  damageType: DamageType;

  baseScore: number;
  baseMajorThreshold: number;
  baseSevereThreshold: number;

  isConsumable: boolean;
  description: string;
}

/** A blank item: a tier 1 one-handed primary, and the tier 1 armor the books open with. */
export const DEFAULT_ITEM_FORM_VALUE: ItemFormValue = {
  kind: 'weapon',
  name: '',
  tier: 1,
  campaignIds: [],
  isPublic: false,
  features: [],

  isPrimary: true,
  trait: 'AGILITY',
  range: 'MELEE',
  burden: 'ONE_HANDED',
  diceType: 'D6',
  modifier: 0,
  damageType: 'PHYSICAL',

  baseScore: 3,
  baseMajorThreshold: 5,
  baseSevereThreshold: 11,

  isConsumable: false,
  description: '',
};

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  loot: 'Loot',
};

/**
 * Each kind's accent, reusing the global card-type tokens the codex and character sheet already
 * colour weapons, armor, and loot with. Held as `var(...)` strings so they can be bound straight
 * onto a host as a custom property, which is how the accent reaches both the form's own sections
 * and the dialog chrome around it.
 */
export const ITEM_KIND_ACCENTS: Record<ItemKind, string> = {
  weapon: 'var(--color-card-weapon)',
  armor: 'var(--color-card-armor)',
  loot: 'var(--color-card-loot)',
};

export const WEAPON_TRAIT_LABELS: Record<WeaponTrait, string> = {
  AGILITY: 'Agility',
  STRENGTH: 'Strength',
  FINESSE: 'Finesse',
  INSTINCT: 'Instinct',
  PRESENCE: 'Presence',
  KNOWLEDGE: 'Knowledge',
};

export const WEAPON_RANGE_LABELS: Record<WeaponRange, string> = {
  MELEE: 'Melee',
  VERY_CLOSE: 'Very Close',
  CLOSE: 'Close',
  FAR: 'Far',
  VERY_FAR: 'Very Far',
  OUT_OF_RANGE: 'Out of Range',
};

export const WEAPON_BURDEN_LABELS: Record<WeaponBurden, string> = {
  ONE_HANDED: 'One-Handed',
  TWO_HANDED: 'Two-Handed',
};

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  PHYSICAL: 'Physical',
  MAGIC: 'Magic',
  PHYSICAL_AND_MAGIC: 'Physical or Magic',
};

export const DICE_TYPES: readonly DiceType[] = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'] as const;

/** Tier doubles as loot rarity; the books name the four steps rather than numbering them. */
export const LOOT_RARITY_LABELS: Record<number, string> = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Legendary',
};

export const ITEM_TIERS: readonly number[] = [1, 2, 3, 4] as const;

/** Built from the shared constant so `OUT_OF_RANGE` can never leak into the picker. */
export const WEAPON_RANGE_OPTIONS = SELECTABLE_WEAPON_RANGES.map(value => ({
  value,
  label: WEAPON_RANGE_LABELS[value],
}));

/**
 * Adapts the feature payloads an item carries into the shape `FeatureEditor` seeds itself from.
 *
 * The synthetic negative ids exist only to give the editor's `@for` a unique key per row: a custom
 * item's features are always sent as a complete set, never addressed individually, so no id here
 * ever reaches the API. Real ids are not reused because a re-seeded list mixes saved features with
 * ones that were drafted a moment ago and have no id at all.
 */
export function toEditorFeatures(features: FeatureInput[]): RawFeatureResponse[] {
  return features.map((feature, index) => ({
    id: -(index + 1),
    name: feature.name,
    description: feature.description,
    featureType: feature.featureType,
    expansionId: null,
    costTagIds: [],
    modifierIds: [],
    costTags: feature.costTags ?? [],
    modifiers: feature.modifiers ?? [],
  }));
}
