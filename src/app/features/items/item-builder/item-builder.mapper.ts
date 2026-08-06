import { ArmorResponse } from '../../../shared/models/armor-api.model';
import { FeatureInput } from '../../../shared/models/feature-api.model';
import { FeatureType } from '../../../shared/models/feature-type.model';
import { LootApiResponse, LootFeature } from '../../../shared/models/loot-api.model';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import { CreateItemRequest, ItemResponse } from '../item-submit';
import { ItemKind } from '../item-routes';
import { DEFAULT_ITEM_FORM_VALUE, ItemFormValue } from '../models/item-form-value.model';

/** Features on a custom item are always inline, so every one of them is an ITEM feature. */
const ITEM_FEATURE_TYPE: FeatureType = 'ITEM';

interface GearFeature {
  name: string;
  description: string;
  featureType: string;
  costTags?: { label: string; category: string }[];
  modifiers?: { target: string; operation: string; value: number }[];
}

function featuresFromGear(features: GearFeature[] | undefined): FeatureInput[] {
  return (features ?? []).map(feature => ({
    name: feature.name,
    description: feature.description,
    featureType: (feature.featureType as FeatureType) || ITEM_FEATURE_TYPE,
    // Always null: a custom item belongs to no sourcebook, so neither can its features.
    expansionId: null,
    costTags: (feature.costTags ?? []).map(tag => ({ label: tag.label, category: tag.category })),
    modifiers: (feature.modifiers ?? []).map(mod => ({
      target: mod.target,
      operation: mod.operation,
      value: mod.value,
    })),
  }));
}

/** Loot features carry only a name and description -- there is nothing else on the wire to read. */
function featuresFromLoot(features: LootFeature[] | undefined): FeatureInput[] {
  return (features ?? []).map(feature => ({
    name: feature.name,
    description: feature.description ?? '',
    featureType: ITEM_FEATURE_TYPE,
    expansionId: null,
    costTags: [],
    modifiers: [],
  }));
}

export function weaponToFormValue(weapon: WeaponResponse): ItemFormValue {
  return {
    ...DEFAULT_ITEM_FORM_VALUE,
    kind: 'weapon',
    name: weapon.name,
    tier: weapon.tier,
    campaignIds: weapon.campaignIds ?? [],
    isPublic: weapon.isPublic,
    features: featuresFromGear(weapon.features),
    isPrimary: weapon.isPrimary,
    trait: weapon.trait,
    range: weapon.range,
    burden: weapon.burden,
    diceType: weapon.damage.diceType,
    modifier: weapon.damage.modifier ?? 0,
    damageType: weapon.damage.damageType,
  };
}

export function armorToFormValue(armor: ArmorResponse): ItemFormValue {
  return {
    ...DEFAULT_ITEM_FORM_VALUE,
    kind: 'armor',
    name: armor.name,
    tier: armor.tier,
    campaignIds: armor.campaignIds ?? [],
    isPublic: armor.isPublic,
    features: featuresFromGear(armor.features),
    baseScore: armor.baseScore,
    baseMajorThreshold: armor.baseMajorThreshold,
    baseSevereThreshold: armor.baseSevereThreshold,
  };
}

export function lootToFormValue(loot: LootApiResponse): ItemFormValue {
  return {
    ...DEFAULT_ITEM_FORM_VALUE,
    kind: 'loot',
    name: loot.name,
    tier: loot.tier ?? DEFAULT_ITEM_FORM_VALUE.tier,
    campaignIds: loot.campaignIds ?? [],
    isPublic: loot.isPublic ?? false,
    features: featuresFromLoot(loot.features),
    isConsumable: loot.isConsumable ?? false,
    description: loot.description ?? '',
  };
}

export function responseToFormValue(kind: ItemKind, response: ItemResponse): ItemFormValue {
  switch (kind) {
    case 'weapon':
      return weaponToFormValue(response as WeaponResponse);
    case 'armor':
      return armorToFormValue(response as ArmorResponse);
    case 'loot':
      return lootToFormValue(response as LootApiResponse);
  }
}

/**
 * Builds the payload for both `POST /custom` and `PUT /{id}`: the update endpoint treats a
 * supplied `features` array as the item's complete new set, so the same whole-item body serves
 * either verb.
 *
 * `expansionId` and `isOfficial` are absent on purpose -- the server resolves both for custom
 * content and would ignore whatever was sent. `isPublic` is sent regardless of who is signed in;
 * the server coerces it to false for anyone below moderator.
 */
export function formValueToRequest(value: ItemFormValue): CreateItemRequest {
  const shared = {
    name: value.name.trim(),
    tier: value.tier,
    isPublic: value.isPublic,
    campaignIds: value.campaignIds,
    features: value.features,
  };

  switch (value.kind) {
    case 'weapon':
      return {
        ...shared,
        isPrimary: value.isPrimary,
        trait: value.trait,
        range: value.range,
        burden: value.burden,
        // No `diceCount`: the number of dice comes from the wielder's Proficiency, not the weapon.
        damage: {
          diceType: value.diceType,
          modifier: value.modifier,
          damageType: value.damageType,
        },
      };
    case 'armor':
      return {
        ...shared,
        baseScore: value.baseScore,
        baseMajorThreshold: value.baseMajorThreshold,
        baseSevereThreshold: value.baseSevereThreshold,
      };
    case 'loot':
      return {
        ...shared,
        isConsumable: value.isConsumable,
        description: value.description,
      };
  }
}
