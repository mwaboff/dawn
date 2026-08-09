import { EntityCardData } from '../../../shared/components/entity-card/entity-card.model';
import { ArmorResponse } from '../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import {
  buildArmorDisplay,
  buildLootDisplay,
  buildWeaponDisplay,
} from '../../character-sheet/utils/character-sheet-view.mapper';
import { armorToEntity, lootToEntity, weaponToEntity } from './entity-card.mapper';
import { InventoryItemType } from './inventory-card.mapper';

/** A catalogue item as the list endpoints return it, before it belongs to anybody. */
export type CatalogItem = WeaponResponse | ArmorResponse | LootApiResponse;

/**
 * Why a piece of homebrew is visible to this player. Official content has none -- everyone sees it,
 * so saying so would be noise on every second row.
 */
export type ItemProvenance = 'yours' | 'campaign' | 'public';

/**
 * "Public", not "Community": Community is a Daggerheart character trait with its own card accent in
 * this very palette, so the word already means something else everywhere else in the app.
 */
export const PROVENANCE_LABELS: Record<ItemProvenance, string> = {
  yours: 'Yours',
  campaign: 'Campaign',
  public: 'Public',
};

/** The long form, for the Add button's accessible name -- the chip alone is a two-word shorthand. */
export const PROVENANCE_DESCRIPTIONS: Record<ItemProvenance, string> = {
  yours: 'custom gear you created',
  campaign: 'custom gear shared with your campaign',
  public: 'custom gear shared publicly',
};

/** One row in the finder: the card to draw, the item to add, and where the item came from. */
export interface CatalogCardEntry {
  readonly type: InventoryItemType;
  readonly itemId: number;
  readonly name: string;
  readonly card: EntityCardData;
  readonly provenance: ItemProvenance | null;
  /** The untouched response, handed straight back to the sheet's add handler. */
  readonly item: CatalogItem;
}

/** Qualified by type: a weapon and a piece of loot can share a catalogue id. */
export function catalogEntryKey(entry: Pick<CatalogCardEntry, 'type' | 'itemId'>): string {
  return `${entry.type}-${entry.itemId}`;
}

/**
 * Official gear has no author. Anything with one is homebrew, and the reason the viewer can see it
 * is what the chip names: their own, a campaign they are in, or the public catalogue. `campaignIds`
 * is the item's own sharing list rather than an intersection with the viewer's campaigns -- the
 * server has already decided the item is visible, so this only has to say why it plausibly is.
 */
export function itemProvenance(
  item: { createdByUserId?: number | null; campaignIds?: number[] },
  viewerId: number | null,
): ItemProvenance | null {
  if (item.createdByUserId === null || item.createdByUserId === undefined) return null;
  if (viewerId !== null && item.createdByUserId === viewerId) return 'yours';
  return item.campaignIds?.length ? 'campaign' : 'public';
}

/**
 * The one line a `compact` card shows. Tier leads it because tier is the fact that decides whether
 * a piece of gear belongs on this character at all -- and `EntityCard` draws no badges at `compact`,
 * so the tier badge every other size shows is not available here.
 */
function headlineWithTier(tier: number | undefined, fact: string | undefined): string | undefined {
  const parts = [tier ? `T${tier}` : null, fact || null].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

/**
 * Ids are qualified so a catalogue card and an inventory card can coexist in the DOM. Both grids are
 * mounted while the finder is open, both feed `EntityCard`'s `entity-card-body-{type}-{id}` template,
 * and they draw ids from different tables -- catalogue item 3 and inventory entry 3 collided, which
 * pointed one card's `aria-controls` at the other card's body.
 */
function catalogCardId(itemId: number): string {
  return `catalog-${itemId}`;
}

/**
 * Catalogue gear as `EntityCardData`, via the same `entity-card.mapper` functions the inventory
 * uses. A weapon in the finder and the same weapon once carried are the same card, which is the
 * point: the row a player picks is the row they get.
 *
 * `proficiency` is the viewing character's, so the damage on the card is what this character would
 * actually roll rather than the printed base -- the finder is opened from one sheet, never in the
 * abstract. Nothing here is equipped yet, hence the `null`/`false` equip arguments.
 */
export function weaponCatalogEntry(
  weapon: WeaponResponse,
  proficiency: number,
  viewerId: number | null,
): CatalogCardEntry {
  const card = weaponToEntity(buildWeaponDisplay(weapon.id, weapon, proficiency), null);
  return {
    type: 'weapon',
    itemId: weapon.id,
    name: weapon.name,
    card: { ...card, id: catalogCardId(weapon.id), headline: headlineWithTier(weapon.tier, card.headline) },
    provenance: itemProvenance(weapon, viewerId),
    item: weapon,
  };
}

export function armorCatalogEntry(armor: ArmorResponse, viewerId: number | null): CatalogCardEntry {
  const card = armorToEntity(buildArmorDisplay(armor.id, armor), false);
  return {
    type: 'armor',
    itemId: armor.id,
    name: armor.name,
    card: { ...card, id: catalogCardId(armor.id), headline: headlineWithTier(armor.tier, card.headline) },
    provenance: itemProvenance(armor, viewerId),
    item: armor,
  };
}

/**
 * Loot is the one type whose identity lives in its description rather than in a stat line, and most
 * loot carries no cost tags -- so `lootToEntity`'s headline is usually empty and a collapsed row
 * would read as a bare name. The description stands in, trimmed to something that fits one line.
 */
export function lootCatalogEntry(loot: LootApiResponse, viewerId: number | null): CatalogCardEntry {
  const card = lootToEntity(buildLootDisplay(loot.id, loot));
  const fact = card.headline || summarize(loot.description);
  return {
    type: 'loot',
    itemId: loot.id,
    name: loot.name,
    card: { ...card, id: catalogCardId(loot.id), headline: headlineWithTier(loot.tier, fact) },
    provenance: itemProvenance(loot, viewerId),
    item: loot,
  };
}

/** Cut at the first sentence, then at a hard cap -- the header ellipsises whatever is left over. */
function summarize(description: string | undefined): string | undefined {
  if (!description) return undefined;
  const firstSentence = description.split(/(?<=[.!?])\s/)[0].trim();
  if (!firstSentence) return undefined;
  return firstSentence.length > 80 ? `${firstSentence.slice(0, 79).trimEnd()}…` : firstSentence;
}
