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
 * Weapon, armor and loot as cards, with their numbers on one line in the order the equipped-weapon
 * panel already uses -- damage, trait, range, burden. Stacked `Label: value` rows were tried first
 * and read worse: four lines of prose to answer what one glance at "2d8+1 phys / Presence / Melee"
 * answers, on the card a player reads mid-roll.
 *
 * The weapon's own slot eligibility is deliberately NOT a type-tab override here. "Primary Weapon"
 * in the tab beside an "Equipped: Primary" badge is the same fact said twice; the eligibility now
 * rides on the Equip button, which is where it is actionable (see `inventory-card.mapper.ts`).
 *
 * `equippedSlot` is the character's state rather than the weapon's, so it arrives as an argument.
 */
export function weaponToEntity(weapon: WeaponDisplay, equippedSlot: WeaponSlot | null): EntityCardData {
  const stats: string[] = [];
  if (weapon.damage) stats.push(weapon.damage);
  if (weapon.trait) stats.push(weapon.trait);
  if (weapon.range) stats.push(weapon.range);
  if (weapon.burden) stats.push(BURDEN_LABELS[weapon.burden] ?? weapon.burden);

  return {
    id: weapon.inventoryEntryId,
    name: weapon.name,
    cardType: 'weapon',
    headline: weapon.damage || undefined,
    badges: itemBadges(
      weapon,
      equippedSlot ? { label: 'Equipped', value: equippedSlot === 'primary' ? 'Primary' : 'Secondary' } : undefined,
    ),
    stats: stats.length ? stats : undefined,
    features: mapFeatures(weapon.features),
  };
}

export function armorToEntity(armor: ArmorDisplay, equipped: boolean): EntityCardData {
  return {
    id: armor.inventoryEntryId,
    name: armor.name,
    cardType: 'armor',
    headline: `Score ${armor.baseScore}`,
    badges: itemBadges(armor, equipped ? { label: 'Equipped' } : undefined),
    // Labelled, unlike a weapon's: three bare numbers would say nothing on their own. Same wording
    // and order as the Equipped Armor panel.
    stats: [
      `Score: ${armor.baseScore}`,
      `Major: ${armor.baseMajorThreshold}`,
      `Severe: ${armor.baseSevereThreshold}`,
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
    stats: loot.costTags.length ? [...loot.costTags] : undefined,
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
