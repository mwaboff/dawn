import { EntityCardBadge, EntityCardData, EntityCardFeature } from '../../../shared/components/entity-card/entity-card.model';
import {
  ArmorDisplay,
  CardSummary,
  DomainCardSummary,
  FeatureDisplay,
  LootDisplay,
  SubclassCardSummary,
  WeaponDisplay,
} from '../../character-sheet/models/character-sheet-view.model';
import { WeaponSlot } from '../../character-sheet/utils/inventory-equip.utils';

/**
 * View-model mapping only -- `character-sheet-beta` inherits every save pipeline, equip
 * constraint and handler from `CharacterSheet` unchanged. This is the one piece of new "logic"
 * the beta page adds: turning the inherited `CharacterSheetView` card summaries into
 * `EntityCardData`, the shape the shared `EntityCard` component renders.
 */

function mapFeatures(features: readonly FeatureDisplay[]): EntityCardFeature[] {
  return features.map(feature => ({
    // A blank name (see character-sheet-view.mapper.ts's `mapFeature`) means "no rules name",
    // not "named ''" -- entity-card.html's `@if (feature.name)` needs it absent, not empty.
    name: feature.name || undefined,
    description: feature.description,
    tags: feature.tags,
    modifiers: feature.modifiers.map(modifier => ({ label: modifier.label, value: modifier.value })),
  }));
}

export function classCardToEntity(card: CardSummary): EntityCardData {
  return {
    id: card.id,
    name: card.name,
    cardType: 'class',
    description: card.description,
    features: mapFeatures(card.features),
  };
}

export function ancestryCardToEntity(card: CardSummary): EntityCardData {
  return {
    id: card.id,
    name: card.name,
    cardType: 'ancestry',
    description: card.description,
    features: mapFeatures(card.features),
  };
}

export function communityCardToEntity(card: CardSummary): EntityCardData {
  return {
    id: card.id,
    name: card.name,
    cardType: 'community',
    description: card.description,
    features: mapFeatures(card.features),
  };
}

export function subclassCardToEntity(card: SubclassCardSummary): EntityCardData {
  const meta: EntityCardBadge[] = [];
  if (card.domainNames?.length) meta.push({ label: 'Domains', value: card.domainNames.join(', ') });
  if (card.associatedClassName) meta.push({ label: 'Class', value: card.associatedClassName });

  return {
    id: card.id,
    name: card.name,
    cardType: 'subclass',
    // card.level is the server's SubclassLevel enum name -- "FOUNDATION"/"SPECIALIZATION"/
    // "MASTERY" -- exactly the italic subtitle line EntityCardData documents, not a numeric badge.
    subtitle: card.level,
    meta: meta.length ? meta : undefined,
    description: card.description,
    features: mapFeatures(card.features),
  };
}

/**
 * The homebrew mark. Both a chip and a glyph, because neither alone is enough: the glyph is
 * `aria-hidden` decoration (see `EntityCardBadge.glyph`) and the word is what a screen reader and a
 * colour-blind reader actually get.
 */
export const CUSTOM_ITEM_BADGE: EntityCardBadge = { label: 'Custom', glyph: '✦' };

/** Official gear has no author; anything with one was written by a player. */
export function isCustomItem(item: { createdByUserId?: number | null }): boolean {
  return item.createdByUserId !== null && item.createdByUserId !== undefined;
}

const BURDEN_LABELS: Record<string, string> = {
  ONE_HANDED: 'One-handed',
  TWO_HANDED: 'Two-handed',
};

/** Chips every piece of gear can carry, in scan order: what it's doing, how good it is, who wrote it. */
function itemBadges(
  item: { tier?: number; createdByUserId?: number | null },
  equipped?: EntityCardBadge,
): EntityCardBadge[] | undefined {
  const badges: EntityCardBadge[] = [];
  if (equipped) badges.push(equipped);
  if (item.tier) badges.push({ label: 'Tier', value: String(item.tier) });
  if (isCustomItem(item)) badges.push(CUSTOM_ITEM_BADGE);
  return badges.length ? badges : undefined;
}

/**
 * Weapon, armor and loot as cards. The classic inventory row showed a weapon's numbers as bare
 * chips -- "2d8+1 phys", "Melee", "Agility" -- which only reads if you already know the order.
 * Here every number is a labelled `meta` line instead, so the card says what each value is.
 *
 * `equippedSlot` is the character's state rather than the weapon's, so it arrives as an argument;
 * the eyebrow ("Primary Weapon") is the weapon's own slot eligibility and comes off the item.
 */
export function weaponToEntity(weapon: WeaponDisplay, equippedSlot: WeaponSlot | null): EntityCardData {
  const meta: EntityCardBadge[] = [];
  if (weapon.damage) meta.push({ label: 'Damage', value: weapon.damage });
  if (weapon.range) meta.push({ label: 'Range', value: weapon.range });
  if (weapon.trait) meta.push({ label: 'Trait', value: weapon.trait });
  if (weapon.burden) meta.push({ label: 'Burden', value: BURDEN_LABELS[weapon.burden] ?? weapon.burden });

  return {
    id: weapon.inventoryEntryId,
    name: weapon.name,
    cardType: 'weapon',
    eyebrow: weapon.isPrimary ? 'Primary Weapon' : 'Secondary Weapon',
    headline: weapon.damage || undefined,
    badges: itemBadges(
      weapon,
      equippedSlot ? { label: 'Equipped', value: equippedSlot === 'primary' ? 'Primary' : 'Secondary' } : undefined,
    ),
    meta: meta.length ? meta : undefined,
    features: mapFeatures(weapon.features),
  };
}

export function armorToEntity(armor: ArmorDisplay, equipped: boolean): EntityCardData {
  return {
    id: armor.inventoryEntryId,
    name: armor.name,
    cardType: 'armor',
    headline: `Armor Score ${armor.baseScore}`,
    badges: itemBadges(armor, equipped ? { label: 'Equipped' } : undefined),
    meta: [
      { label: 'Armor Score', value: String(armor.baseScore) },
      { label: 'Damage Thresholds', value: `Major ${armor.baseMajorThreshold} / Severe ${armor.baseSevereThreshold}` },
    ],
    features: mapFeatures(armor.features),
  };
}

/**
 * Loot carries its rules as prose rather than as named features, so the description is the body and
 * there is nothing to map into `features`. Consumables say so in the type tab, where the reader is
 * already looking for what kind of thing this is.
 */
export function lootToEntity(loot: LootDisplay): EntityCardData {
  return {
    id: loot.inventoryEntryId,
    name: loot.name,
    cardType: 'loot',
    eyebrow: loot.isConsumable ? 'Consumable' : undefined,
    headline: loot.costTags[0],
    badges: itemBadges(loot),
    meta: loot.costTags.length ? [{ label: 'Cost', value: loot.costTags.join(', ') }] : undefined,
    description: loot.description,
  };
}

export function domainCardToEntity(card: DomainCardSummary): EntityCardData {
  const badges: EntityCardBadge[] = [];
  if (card.level !== undefined) badges.push({ label: `Lvl ${card.level}` });
  if (card.type) badges.push({ label: card.type });
  if (card.recallCost !== undefined) badges.push({ label: `Recall ${card.recallCost}` });

  return {
    id: card.id,
    name: card.name,
    cardType: 'domainCard',
    // Domain cards show their domain ("Valor") in the type tab instead of "Domain Card".
    eyebrow: card.domainName,
    badges: badges.length ? badges : undefined,
    description: card.description,
    features: mapFeatures(card.features),
  };
}
