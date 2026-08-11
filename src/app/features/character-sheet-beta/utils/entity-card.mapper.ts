import {
  EntityCardBadge,
  EntityCardData,
  EntityCardFeature,
  EntityCardStat,
} from '../../../shared/components/entity-card/entity-card.model';
import {
  ArmorDisplay,
  CardSummary,
  DomainCardSummary,
  FeatureDisplay,
  LootDisplay,
  SubclassCardSummary,
  WeaponDisplay,
} from '../../character-sheet/models/character-sheet-view.model';
import { CUSTOM_ITEM_BADGE } from '../../../shared/mappers/custom-content.util';
import { titleCase } from '../../../shared/utils/text.utils';
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
    // "MASTERY" -- the qualifying noun within the kind, which is what `subtitle` is for. It is not
    // the power-level scalar a Tier/Level badge carries, so title-casing it into the subtitle is
    // both the right slot and the printed spelling.
    subtitle: card.level ? titleCase(card.level) : undefined,
    meta: meta.length ? meta : undefined,
    description: card.description,
    features: mapFeatures(card.features),
  };
}

/** Official gear has no author; anything with one was written by a player. */
export function isCustomItem(item: { createdByUserId?: number | null }): boolean {
  return item.createdByUserId !== null && item.createdByUserId !== undefined;
}

/**
 * Title case on both words, matching the printed books (514 "One-Handed" / 326 "Two-Handed" across
 * the Core and Hope & Fear texts, and no lowercase instance of either) and matching what
 * `shared/mappers/weapon.mapper.ts` has always rendered on the classic card. This map used to say
 * "One-handed", so the same weapon read differently on the beta sheet than in the beta reference
 * browser -- the exact inconsistency the slot contract exists to remove.
 */
const BURDEN_LABELS: Record<string, string> = {
  ONE_HANDED: 'One-Handed',
  TWO_HANDED: 'Two-Handed',
};

/**
 * Chips every piece of gear can carry, in the fixed order `EntityCardData.badges` documents: the
 * power-level scalar first so tier lands in the same place on every card, then live state the
 * reader can change, then provenance. Three chips is the ceiling, which this hits exactly.
 */
function itemBadges(
  item: { tier?: number; createdByUserId?: number | null },
  equipped?: EntityCardBadge,
): EntityCardBadge[] | undefined {
  const badges: EntityCardBadge[] = [];
  if (item.tier) badges.push({ label: 'Tier', value: String(item.tier) });
  if (equipped) badges.push(equipped);
  if (isCustomItem(item)) badges.push(CUSTOM_ITEM_BADGE);
  return badges.length ? badges : undefined;
}

/**
 * Weapon, armor and loot as cards. The weapon's numbers keep the order the equipped-weapon panel
 * already uses -- damage, trait, range, burden -- so a player who has learned the panel reads the
 * card without relearning it. Each is a labelled cell: `EntityCard` stacks a small uppercase label
 * over its value, so the label costs no extra line and a bare "Presence" in a row of four values no
 * longer has to be guessed at.
 *
 * The weapon's own slot eligibility is deliberately NOT a type-tab override here. The tab always
 * answers "what kind of card is this", and "Primary Weapon" there beside an "Equipped Primary" badge
 * is the same fact said twice; the eligibility rides on the Equip button, which is where it is
 * actionable (see `inventory-card.mapper.ts`).
 *
 * `equippedSlot` is the character's state rather than the weapon's, so it arrives as an argument.
 */
export function weaponToEntity(weapon: WeaponDisplay, equippedSlot: WeaponSlot | null): EntityCardData {
  const stats: EntityCardStat[] = [];
  if (weapon.damage) stats.push({ label: 'Damage', value: weapon.damage });
  if (weapon.trait) stats.push({ label: 'Trait', value: weapon.trait });
  if (weapon.range) stats.push({ label: 'Range', value: weapon.range });
  if (weapon.burden) stats.push({ label: 'Burden', value: BURDEN_LABELS[weapon.burden] ?? weapon.burden });

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
    // Same wording and order as the Equipped Armor panel. The labels matter more here than on a
    // weapon -- three bare numbers would say nothing on their own -- and the card draws each label
    // above its value, so the colons that used to be baked into the value string are gone.
    stats: [
      { label: 'Score', value: String(armor.baseScore) },
      { label: 'Major', value: String(armor.baseMajorThreshold) },
      { label: 'Severe', value: String(armor.baseSevereThreshold) },
    ],
    features: mapFeatures(armor.features),
  };
}

/**
 * Loot carries its rules as prose rather than as named features, so the description is the body and
 * there is nothing to map into `features`. "Consumable" is a subtype of loot, not a kind of card, so
 * it goes in the subtitle and the tab keeps saying "Loot" -- a reader who has learned that the tab
 * answers "what am I looking at" gets the same answer here as on every other card.
 *
 * Cost tags are the one stat that needs no label: "1 HANDFUL" already names its own unit, and a
 * "Cost" label above each of two tags would repeat itself.
 */
export function lootToEntity(loot: LootDisplay): EntityCardData {
  return {
    id: loot.inventoryEntryId,
    name: loot.name,
    cardType: 'loot',
    subtitle: loot.isConsumable ? 'Consumable' : undefined,
    headline: loot.costTags[0],
    badges: itemBadges(loot),
    stats: loot.costTags.length ? loot.costTags.map(tag => ({ value: tag })) : undefined,
    description: loot.description,
  };
}

/**
 * The three facts on the printed card's header land in three different slots, by kind rather than by
 * where they sit on the card: the domain and the card type are what qualifies this card within
 * domain cards ("Valor · Spell"), so they are the subtitle; level is the power-level scalar, so it
 * is the one badge; recall cost is a number, so it is a stat. `card.type` is a raw server enum, so
 * it is title-cased into the printed spelling.
 */
export function domainCardToEntity(card: DomainCardSummary): EntityCardData {
  const subtitleParts = [card.domainName, card.type ? titleCase(card.type) : undefined].filter(Boolean);

  return {
    id: card.id,
    name: card.name,
    cardType: 'domainCard',
    subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
    badges: card.level !== undefined ? [{ label: 'Level', value: String(card.level) }] : undefined,
    stats: card.recallCost !== undefined ? [{ label: 'Recall', value: String(card.recallCost) }] : undefined,
    description: card.description,
    features: mapFeatures(card.features),
  };
}
