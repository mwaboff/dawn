import { ItemKind } from '../../items/item-routes';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';

/**
 * One homebrew item a profile owns, flattened out of whichever of the three tables it came from.
 *
 * Weapons, armor, and loot are separate endpoints with separate id sequences but sit in a single
 * profile panel, so they are normalized to one shape here and carry `kind` to say which service
 * a later edit or delete has to go through.
 */
export interface OwnedCustomItem {
  kind: ItemKind;
  id: number;
  name: string;
  /** Summary line under the name, e.g. "Tier 2 · d8 phy". */
  detail: string;
}

export const ITEM_KIND_TITLES: Record<ItemKind, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  loot: 'Loot',
};

/**
 * Identity for a merged item list. Ids repeat across the three tables -- weapon 7 and armor 7
 * both exist -- so the kind has to be part of the key or a panel row would track and delete the
 * wrong record.
 */
export function ownedItemKey(item: Pick<OwnedCustomItem, 'kind' | 'id'>): string {
  return `${item.kind}:${item.id}`;
}

/** Turns SCREAMING_SNAKE enum values into "Screaming snake" for display. */
function humanizeEnum(value: string): string {
  const spaced = value.replace(/_/g, ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function tierPrefix(tier: number | undefined): string {
  return tier ? `Tier ${tier}` : 'Untiered';
}

export function weaponToOwnedItem(weapon: WeaponResponse): OwnedCustomItem {
  const damage = weapon.damage
    ? `${weapon.damage.diceType}${weapon.damage.modifier ? `+${weapon.damage.modifier}` : ''}`
    : '';
  const parts = [tierPrefix(weapon.tier), weapon.trait ? humanizeEnum(weapon.trait) : '', damage];
  return {
    kind: 'weapon',
    id: weapon.id,
    name: weapon.name,
    detail: parts.filter(Boolean).join(' · '),
  };
}

export function armorToOwnedItem(armor: ArmorResponse): OwnedCustomItem {
  const parts = [tierPrefix(armor.tier), `${armor.baseScore} armor`, `${armor.baseMajorThreshold}/${armor.baseSevereThreshold}`];
  return {
    kind: 'armor',
    id: armor.id,
    name: armor.name,
    detail: parts.filter(Boolean).join(' · '),
  };
}

export function lootToOwnedItem(loot: LootApiResponse): OwnedCustomItem {
  const parts = [tierPrefix(loot.tier), loot.isConsumable ? 'Consumable' : 'Item'];
  return {
    kind: 'loot',
    id: loot.id,
    name: loot.name,
    detail: parts.filter(Boolean).join(' · '),
  };
}
