import { AdversaryData } from '../components/adversary-card/adversary-card.model';
import { CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import {
  EntityCardBadge,
  EntityCardData,
  EntityCardFeature,
  EntityCardStat,
} from '../components/entity-card/entity-card.model';
import { titleCase } from '../utils/text.utils';
import { improvisedTierStats } from '../utils/improvised-tier-stats.utils';

/**
 * Adapts `AdversaryData` onto `EntityCardData` for the encounter manager's compact-then-expand
 * rows (the same `app-entity-card size="compact"` pattern `item-finder-result.html` uses for
 * gear) -- adversaries have no place in the generic `cardDataToEntityCard` pipeline
 * (`card-data-to-entity-card.mapper.ts`) because `AdversaryData` isn't a `CardData`, so this is a
 * dedicated, domain-aware mapper rather than a second generic pass.
 *
 * Field-by-field, following `EntityCardData`'s slot contract -- which fact goes where is fixed
 * across every card type now, so a GM who has learned to read a weapon can read an adversary:
 * - `eyebrow` is left unset so the tab reads "Adversary" from `CARD_TYPE_LABELS`, the same answer
 *   to "what am I looking at" every other card gives. It used to carry the adversary type, which
 *   made the tab mean "what kind of adversary" here and "what kind of card" everywhere else.
 * - `subtitle` is the adversary type ("Bruiser", title-cased -- see `titleCase`'s own doc comment
 *   on why raw `BRUISER` never reaches the UI). It is the qualifying noun within the kind, which
 *   is what `subtitle` is for now that the tab cannot carry a subtype. The type name is real text
 *   at every `size` that renders a subtitle, so elite/minion/solo status is legible without a
 *   body, satisfying WCAG 1.4.1 even though the encounter manager's compact rows don't carry
 *   `AdversaryCard`'s dashed/bold/wide-tracking modifier styling for that status.
 * - `badges[0]` is the effective tier, as `{ label: 'Tier', value }`. Tier is the power-level
 *   scalar every card type now leads its header with -- an adversary's Tier chip sits exactly
 *   where a weapon's does -- so it belongs in `badges`, not in `subtitle` where it used to live
 *   competing with the type for the same line. Badges therefore always have at least one entry.
 * - `headline` carries ONLY "Retiered from Tier N", and only when the GM has retiered this one.
 *   It used to lead with `Difficulty N`, back when `compact` rendered the headline alone and no
 *   badges: difficulty was the one fact that could reach a collapsed roster row. `compact` now
 *   renders `subtitle · headline` plus the scalar chip (`entity-card.ts`'s `compactLine` and
 *   `headerBadges`), so the type and the tier reach that row directly and difficulty no longer has
 *   to ride in the headline to be seen -- it is in `stats`, one expand away, and repeating it in the
 *   header only crowded out the type name a GM scans an encounter list for.
 *   The retier fact stays because nothing else carries it at `compact`: it names the ORIGINAL
 *   printed tier, which the Tier chip has stopped showing precisely because the GM retiered it.
 *   `headline` is also folded into the header's accessible name (`headerLabel`), so it survives for
 *   a screen-reader user comparing collapsed rows -- unlike classic `AdversaryCard`, which shows its
 *   retiered marker unconditionally because it has a body to show it in.
 * - `stats` is the numbers ledger (Difficulty/HP/Stress/Evasion/Major/Severe/Atk), each a
 *   `{ label, value }` cell the card draws as a small uppercase label over its number -- the label
 *   is never baked into the value string, because a bare "8 4 12 15" says nothing on its own the
 *   way a weapon's "2d8+1 phys" does, and the card, not the mapper, owns how the pairing is drawn.
 * - `meta` carries the named facts a bare number can't: the attack line (weapon/range/damage,
 *   already assembled the same way `run-adversary-detail.ts`'s `attackDetailLabel` is), each
 *   Experience, and Motives & Tactics. Labels carry no colon -- the card's two-column grid is what
 *   separates label from value.
 * - `description`/`features` map straight across, the same as every other mapper in this file.
 *
 * `effectiveTier` mirrors `AdversaryCard`'s own `effectiveTier` input (the encounter roster's
 * "retier" control): when set and different from the printed tier, Difficulty/Thresholds/Attack
 * Modifier swap to the book's Improvised Statistics by Tier table (`improvised-tier-stats.utils.ts`)
 * -- the weapon/range/damage line does not retier, matching `AdversaryCard`'s own scope for this.
 * The "Retiered from Tier N" badge follows the Tier chip because it is live state the GM toggled,
 * and it names a fact (the ORIGINAL printed tier) shown nowhere else once the Tier chip is showing
 * the EFFECTIVE tier, so it is new information rather than the same scalar twice.
 */
export function adversaryToEntityCard(adversary: AdversaryData, effectiveTier?: number): EntityCardData {
  // Same redacted-stub short-circuit as `cardDataToEntityCard` -- a restricted adversary carries
  // nothing else safe to read, and the retier controls below make no sense against placeholder
  // numbers. `EntityCard` draws the locked face itself off the flag, so this stops short of
  // inventing a name/description the way it used to.
  if (adversary.restricted) {
    return { id: adversary.id, cardType: 'adversary', restricted: true, expansionName: adversary.expansionName };
  }

  const isRetiered = effectiveTier !== undefined && effectiveTier !== adversary.tier;
  const retiered = isRetiered ? improvisedTierStats(effectiveTier!) : undefined;
  const difficulty = retiered?.difficulty ?? adversary.difficulty;
  const majorThreshold = retiered?.majorThreshold ?? adversary.majorThreshold;
  const severeThreshold = retiered?.severeThreshold ?? adversary.severeThreshold;
  const attackModifier = retiered?.attackModifier ?? adversary.attackModifier;

  const stats = buildStats(adversary, { difficulty, majorThreshold, severeThreshold, attackModifier });
  const meta = buildMeta(adversary);
  const features = adversary.features?.length ? adversary.features.map(mapFeature) : undefined;
  const retieredLabel = `Retiered from Tier ${adversary.tier}`;
  const badges: EntityCardBadge[] = [{ label: 'Tier', value: String(effectiveTier ?? adversary.tier) }];
  if (isRetiered) badges.push({ label: retieredLabel });

  return {
    id: adversary.id,
    name: adversary.name,
    cardType: 'adversary',
    subtitle: titleCase(adversary.adversaryType),
    headline: isRetiered ? retieredLabel : undefined,
    badges,
    stats: stats.length ? stats : undefined,
    meta: meta.length ? meta : undefined,
    description: adversary.description || undefined,
    features,
  };
}

interface EffectiveNumbers {
  difficulty?: number;
  majorThreshold?: number;
  severeThreshold?: number;
  attackModifier?: number;
}

function buildStats(adversary: AdversaryData, effective: EffectiveNumbers): EntityCardStat[] {
  const stats: EntityCardStat[] = [];
  if (effective.difficulty !== undefined) stats.push({ label: 'Difficulty', value: String(effective.difficulty) });
  if (adversary.hitPointMax !== undefined) stats.push({ label: 'HP', value: String(adversary.hitPointMax) });
  if (adversary.stressMax !== undefined) stats.push({ label: 'Stress', value: String(adversary.stressMax) });
  if (adversary.evasion !== undefined) stats.push({ label: 'Evasion', value: String(adversary.evasion) });
  if (effective.majorThreshold !== undefined) stats.push({ label: 'Major', value: String(effective.majorThreshold) });
  if (effective.severeThreshold !== undefined) stats.push({ label: 'Severe', value: String(effective.severeThreshold) });
  if (effective.attackModifier !== undefined) {
    stats.push({ label: 'Atk', value: formatModifier(effective.attackModifier) });
  }
  return stats;
}

function buildMeta(adversary: AdversaryData): EntityCardBadge[] {
  const meta: EntityCardBadge[] = [];

  const attack = formatAttack(adversary);
  if (attack) meta.push({ label: 'Attack', value: attack });

  for (const experience of adversary.experiences ?? []) {
    meta.push({ label: experience.description, value: formatModifier(experience.modifier) });
  }

  if (adversary.motivesAndTactics) {
    meta.push({ label: 'Motives & Tactics', value: adversary.motivesAndTactics });
  }

  return meta;
}

/**
 * `Claws · Very Close · 1d12+2 phy` -- same assembly and reasoning as `run-adversary-detail.ts`'s
 * `attackDetailLabel`: the range enum is title-cased, and `damage.notation` is the backend's
 * already-formatted printed line (already ending in "phy"/"mag" for every adversary), so nothing
 * else is appended to it.
 */
function formatAttack(adversary: AdversaryData): string | undefined {
  if (!adversary.weaponName) return undefined;
  return [adversary.weaponName, titleCase(adversary.attackRange) || undefined, adversary.damage?.notation]
    .filter((part): part is string => !!part)
    .join(' · ');
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function mapFeature(feature: CardFeature): EntityCardFeature {
  return {
    name: feature.name || undefined,
    description: feature.description,
    tags: feature.tags,
  };
}
