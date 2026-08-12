import { CardData, CardEntityDisplay, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { EntityCardBadge, EntityCardData, EntityCardFeature } from '../components/entity-card/entity-card.model';
import { CUSTOM_CONTENT_TAG, CUSTOM_ITEM_BADGE } from './custom-content.util';

/**
 * Adapts the app's universal `CardData` shape onto `EntityCardData`, so any surface whose data
 * pipeline already terminates in `CardData` (weapon/armor/loot catalogues, class/subclass/ancestry
 * browse lists, search results, ...) can render through the beta `EntityCard` face without a
 * second, parallel formatting pass.
 *
 * This is still deliberately a *structural* remap, not a domain-aware one, and that is exactly why
 * the badge/stat/meta split arrives pre-computed in `CardData.entityDisplay` instead of being
 * parsed out here. `mapWeaponResponseToCardData`, `mapArmorResponseToCardData` etc. (this
 * directory) already chose which raw fields become `subtitle`/`tags`/`subtitleSecondary` and
 * formatted them into display strings; re-deriving `EntityCardData`'s `badges`/`stats`/`meta` from
 * those joined strings would mean teaching this file that "Score: 4" is a labelled number while
 * "TWO-HANDED" is not -- a second implementation of the formatting those mappers own, i.e. the
 * "two implementations of one game rule" bug factory dawn/CLAUDE.md warns about. So the mapper that
 * knew the difference records it once, while it still holds the typed response, and this file only
 * moves the parts into their slots. Compare
 * `features/character-sheet-beta/utils/entity-card.mapper.ts`, which *is* domain-aware: it builds
 * `EntityCardData` straight from typed, unformatted sheet view-models (no `CardData` in between).
 *
 * Field-by-field judgement calls, with `entityDisplay` present:
 * - `badges` = the scalar first (`Tier`/`Level`, never both), then each `state` entry as a bare
 *   label, then the `Custom` provenance chip -- the fixed order and three-chip ceiling
 *   `EntityCardData.badges` documents. Provenance still comes from `tags`, because
 *   `CUSTOM_CONTENT_TAG` is the one tag with a fixed spelling this file can recognise without
 *   knowing anything about the card's domain.
 * - `subtitle` = `entityDisplay.subtitle ?? card.subtitle`, and an empty string counts as "no
 *   subtitle": armor's classic subtitle is the literal "Armor", which the beta type tab already
 *   says, so its mapper blanks it rather than repeating the kind under the name.
 * - `meta` = `entityDisplay.meta`. The old `subtitleSecondary` single-row fallback still applies,
 *   but only while the `entityDisplay` is empty of badge/stat/meta content: `subtitleSecondary` is
 *   the classic card's overflow line for the very facts the split re-homes (it is the literal
 *   "Tier N" on every migrated mapper that sets one), so once a mapper has put its scalar, state,
 *   numbers or named facts in their slots, repeating that line as a bare meta row would print the
 *   same fact twice on one card.
 *
 * With `entityDisplay` absent the old behaviour is kept exactly -- every tag becomes a chip,
 * `subtitleSecondary` becomes a single bare-label meta row -- so a mapper that has not been given
 * one (ancestry, community, domain, transformation cards, and any caller outside this directory)
 * still renders as it does today.
 *
 * - `metadata` -> dropped. It is bookkeeping (ids, raw enums, unformatted modifier objects,
 *   `accentColor`) for callers that already hold the original `CardData`, not display data -- see
 *   e.g. `weapon.mapper.ts`'s `metadata.modifiers` (`{ target, operation, value }`, unformatted) vs
 *   `EntityCardFeature.modifiers` (`{ label, value }`, display-ready). Formatting one into the
 *   other needs the same target/operation vocabulary knowledge the sheet's own mapper carries, so
 *   it stays there rather than being half-reimplemented here. A caller that needs `metadata` (e.g.
 *   `card-selection-grid.ts`'s `cardAccentColor`) reads it off the source `CardData` directly.
 * - `headline` and `eyebrow` -> left unset. Nothing on generic `CardData` maps to them, and neither
 *   is worth an `entityDisplay` slot: `eyebrow` is reserved for a kind `CardType` cannot name, and
 *   `headline` only shows at `compact` size, which no `CardData`-fed surface renders at today.
 *
 * `cardType` is passed straight through and every one of its 18 members is handled identically --
 * there is no per-type branch to maintain here, and therefore nothing to miss when a 19th is added
 * (`daggerheart-card.model.ts`'s `CardType` doc comment already covers the actual per-type chore: a
 * `--color-card-*` token and a `card-accents.css` rule).
 */
export function cardDataToEntityCard(card: CardData): EntityCardData {
  // A redacted stub (`card.restricted`) carries nothing else safe to read -- no name, subtitle,
  // tags, features, or `entityDisplay`. `EntityCard` draws its own locked face off `restricted`/
  // `expansionName` (the same shared copy every other face uses), so this passes the flag straight
  // through instead of inventing a name/description for a normal-looking card to display.
  if (card.restricted) {
    return { id: card.id, cardType: card.cardType, restricted: true, expansionName: card.expansionName };
  }

  const display = card.entityDisplay;
  const secondaryMeta = card.subtitleSecondary ? [{ label: card.subtitleSecondary }] : undefined;
  const common = {
    id: card.id,
    name: card.name,
    cardType: card.cardType,
    description: card.description || undefined,
    features: card.features?.length ? card.features.map(mapFeature) : undefined,
  };

  if (!display) {
    return {
      ...common,
      subtitle: card.subtitle,
      badges: card.tags?.length ? card.tags.map(tag => ({ label: tag })) : undefined,
      meta: secondaryMeta,
    };
  }

  const badges = buildBadges(display, card.tags);
  const carriesNothing = !display.scalar && !display.state?.length && !display.stats?.length;

  return {
    ...common,
    subtitle: (display.subtitle ?? card.subtitle) || undefined,
    badges: badges.length ? badges : undefined,
    stats: display.stats?.length ? display.stats : undefined,
    meta: display.meta?.length ? display.meta : (carriesNothing ? secondaryMeta : undefined),
  };
}

function buildBadges(display: CardEntityDisplay, tags: string[] | undefined): EntityCardBadge[] {
  const badges: EntityCardBadge[] = [];

  if (display.scalar) {
    badges.push({ label: display.scalar.label, value: display.scalar.value });
  }
  for (const state of display.state ?? []) {
    badges.push({ label: state });
  }
  if (tags?.includes(CUSTOM_CONTENT_TAG)) {
    badges.push(CUSTOM_ITEM_BADGE);
  }

  return badges;
}

/**
 * `CardFeature.subtitle` is dropped, not carried into `EntityCardFeature` (which has no subtitle
 * slot). Its callers use it one of two ways: as a fixed per-card-type category repeated on every
 * feature ("Weapon Feature", "Subclass Feature", ...) -- already said once by the card's own type
 * tab, so repeating it on every feature line is exactly the "same fact twice" `entity-card.mapper
 * .ts`'s `weaponToEntity` doc comment calls out as deliberately avoided -- or as genuinely
 * per-feature info (`environment.mapper.ts`'s timing label). Both are lost here; a caller that
 * needs the second case can still reach `CardFeature.subtitle` on the original `CardData`.
 *
 * `modifiers` is left unset for the same reason `metadata` is dropped above: `CardFeature` carries
 * no per-feature modifiers at all (they live in `CardData.metadata.modifiers`, in the raw
 * `{ target, operation, value }` shape, not the display-ready `{ label, value }` `EntityCardData`
 * expects).
 */
function mapFeature(feature: CardFeature): EntityCardFeature {
  return {
    name: feature.name || undefined,
    description: feature.description,
    tags: feature.tags,
  };
}
