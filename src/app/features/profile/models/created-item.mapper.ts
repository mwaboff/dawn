import { WeaponResponse, WeaponFeatureResponse } from '../../../shared/models/weapon-api.model';
import { ArmorResponse, ArmorFeatureResponse } from '../../../shared/models/armor-api.model';
import { LootApiResponse, LootFeature } from '../../../shared/models/loot-api.model';
import { CreatedItemFeature, CreatedItemSummary } from './created-item.model';

function mapFeatures(features?: (WeaponFeatureResponse | ArmorFeatureResponse | LootFeature)[]): CreatedItemFeature[] | undefined {
  return features?.map(feature => ({ name: feature.name, description: feature.description }));
}

export function mapWeaponToItemSummary(weapon: WeaponResponse): CreatedItemSummary {
  return {
    id: weapon.id,
    itemType: 'weapon',
    name: weapon.name,
    tier: weapon.tier,
    trait: weapon.trait,
    range: weapon.range,
    burden: weapon.burden,
    damageNotation: weapon.damage?.notation,
    features: mapFeatures(weapon.features),
  };
}

export function mapArmorToItemSummary(armor: ArmorResponse): CreatedItemSummary {
  return {
    id: armor.id,
    itemType: 'armor',
    name: armor.name,
    tier: armor.tier,
    baseScore: armor.baseScore,
    baseMajorThreshold: armor.baseMajorThreshold,
    baseSevereThreshold: armor.baseSevereThreshold,
    features: mapFeatures(armor.features),
  };
}

export function mapLootToItemSummary(loot: LootApiResponse): CreatedItemSummary {
  return {
    id: loot.id,
    itemType: 'loot',
    name: loot.name,
    tier: loot.tier,
    description: loot.description,
    isConsumable: loot.isConsumable,
    features: mapFeatures(loot.features),
  };
}
