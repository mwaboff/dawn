import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { EntityCardData, EntityCardFeature } from '../components/entity-card/entity-card.model';

/**
 * Adapts the app's universal `CardData` shape onto `EntityCardData`, so any surface whose data
 * pipeline already terminates in `CardData` (weapon/armor/loot catalogues, class/subclass/ancestry
 * browse lists, search results, ...) can render through the beta `EntityCard` face without a
 * second, parallel formatting pass.
 *
 * This is deliberately a *structural* remap, not a domain-aware one: `mapWeaponResponseToCardData`,
 * `mapSubclassResponseToCardData` etc. (this directory) already chose which raw fields become
 * `subtitle`/`tags`/`subtitleSecondary` and formatted them into display strings. Re-deriving
 * `EntityCardData`'s `stats`/`headline`/`eyebrow` from the same raw domain fields here would be a
 * second implementation of that formatting -- the "two implementations of one game rule" bug
 * factory dawn/CLAUDE.md warns about. Compare
 * `features/character-sheet-beta/utils/entity-card.mapper.ts`, which *is* domain-aware: it builds
 * `EntityCardData` straight from typed, unformatted sheet view-models (no `CardData` in between),
 * so deriving `stats`/`headline`/`eyebrow` there is the one and only place that happens.
 *
 * Field-by-field judgement calls:
 * - `tags` -> `badges`, one `{ label: tag }` chip per tag. `CardData.tags` already reads as a row
 *   of short chips in the classic renderer (`daggerheart-card.html`'s `.card__tag`s), which is
 *   exactly what `EntityCardData.badges` is for. A bare tag has no natural label/value split, so
 *   the whole string becomes the chip's `label` -- `EntityCardBadge.value` is left unset rather
 *   than guessing a split that would be wrong for most tags (e.g. "TWO-HANDED", "1 HOPE").
 * - `subtitleSecondary` -> `meta`, as a single `{ label: subtitleSecondary }` row (no `value`, so
 *   `entity-card.html` renders it as a bare prose line rather than fabricating a `Label: value`
 *   pair). `subtitleSecondary` carries free text across its callers -- "Tier 3", a domain list
 *   ("Blade · Bone"), a damage notation -- with no shared structure to split into a real label and
 *   value, so `meta`'s bare-label rendering is the closest honest fit.
 * - `metadata` -> dropped. It is bookkeeping (ids, raw enums, unformatted modifier objects,
 *   `accentColor`) for callers that already hold the original `CardData`, not display data -- see
 *   e.g. `weapon.mapper.ts`'s `metadata.modifiers` (`{ target, operation, value }`, unformatted) vs
 *   `EntityCardFeature.modifiers` (`{ label, value }`, display-ready). Formatting one into the
 *   other needs the same target/operation vocabulary knowledge the sheet's own mapper carries, so
 *   it stays there rather than being half-reimplemented here. A caller that needs `metadata` (e.g.
 *   `card-selection-grid.ts`'s `cardAccentColor`) reads it off the source `CardData` directly.
 * - `headline`, `eyebrow`, `stats` -> left unset. Nothing on generic `CardData` maps to them
 *   without per-type knowledge (see above); a caller with a compact/eyebrow/stat-line need can
 *   layer its own thin mapper over this one's output, the way `entity-card.mapper.ts` does today.
 *
 * `cardType` is passed straight through and every one of its 17 members is handled identically --
 * there is no per-type branch to maintain here, and therefore nothing to miss when an 18th is
 * added (`daggerheart-card.model.ts`'s `CardType` doc comment already covers the actual per-type
 * chore: a `--color-card-*` token and a `card-accents.css` rule).
 */
export function cardDataToEntityCard(card: CardData): EntityCardData {
  const badges = card.tags?.length ? card.tags.map(tag => ({ label: tag })) : undefined;
  const meta = card.subtitleSecondary ? [{ label: card.subtitleSecondary }] : undefined;
  const features = card.features?.length ? card.features.map(mapFeature) : undefined;

  return {
    id: card.id,
    name: card.name,
    cardType: card.cardType,
    subtitle: card.subtitle,
    description: card.description || undefined,
    badges,
    meta,
    features,
  };
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
