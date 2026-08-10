import { AdversaryData } from '../components/adversary-card/adversary-card.model';
import { CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { EntityCardBadge, EntityCardData, EntityCardFeature } from '../components/entity-card/entity-card.model';
import { titleCase } from '../utils/text.utils';
import { improvisedTierStats } from '../utils/improvised-tier-stats.utils';

/**
 * Adapts `AdversaryData` onto `EntityCardData` for the encounter manager's compact-then-expand
 * rows (the same `app-entity-card size="compact"` pattern `item-finder-result.html` uses for
 * gear) -- adversaries have no place in the generic `cardDataToEntityCard` pipeline
 * (`card-data-to-entity-card.mapper.ts`) because `AdversaryData` isn't a `CardData`, so this is a
 * dedicated, domain-aware mapper rather than a second generic pass.
 *
 * Field-by-field, each checked against "is this fact already shown somewhere else on the same
 * card" before it gets its own slot:
 * - `eyebrow` carries the adversary type ("Bruiser", title-cased -- see `titleCase`'s own doc
 *   comment on why raw `BRUISER` never reaches the UI). This is the ONE place type appears, and
 *   the type name is real text either way `size` renders -- elite/minion/solo status is legible
 *   without a body, satisfying WCAG 1.4.1 even though the encounter manager's compact rows don't
 *   carry `AdversaryCard`'s dashed/bold/wide-tracking modifier styling for that status.
 * - `subtitle` is `Tier N`, shown only when NOT compact -- it never appears in `badges` too, which
 *   would restate the same fact in the header a second time while expanded.
 * - `headline` is `Difficulty N`: the one fact carried into `compact`, where there's no room for
 *   anything else. Difficulty (not tier) was picked deliberately -- `adversary-browser`'s own tier
 *   filter buttons mean a GM comparing candidates within a compact row list has usually already
 *   narrowed by tier, so the more decision-relevant number at a glance is "how hard is this thing
 *   to hit", the direct analogue of `armorToEntity`'s "Score N" headline.
 *   `headline` and `stats` both carrying Difficulty is not the same duplication `subtitle`/`badges`
 *   would be: `compact` renders ONLY the header (headline), `normal`/`expanded` render ONLY the
 *   body (stats) -- the two are never on screen at once. `weaponToEntity` already relies on this
 *   same header/body split (its `headline` is also its `stats[0]`).
 *   When retiered, `headline` also carries "Retiered from Tier N" (joined with the Difficulty
 *   fact, or standing alone if difficulty is unset) -- `EntityCard` gates `badges` behind
 *   `displaySize() !== 'compact'`, so the encounter roster's always-`compact` rows would otherwise
 *   have no way to show which adversaries were retiered without expanding each one, unlike classic
 *   `AdversaryCard`, which shows its retiered marker unconditionally. `headline` is the one field
 *   `EntityCard` folds into the header's accessible name even at `compact`
 *   (`entity-card.ts`'s `headerLabel`), so it is the natural vehicle for this to survive there too.
 * - `stats` is the numbers-only scannable line (Difficulty/HP/Stress/Evasion/Major/Severe/Atk),
 *   each labelled the way `armorToEntity` labels its own stats -- a bare "8 4 12 15" says nothing
 *   on its own the way a weapon's "2d8+1 phys" does.
 * - `meta` carries the named facts a bare number can't: the attack line (weapon/range/damage,
 *   already assembled the same way `run-adversary-detail.ts`'s `attackDetailLabel` is), each
 *   Experience, and Motives & Tactics.
 * - `description`/`features` map straight across, the same as every other mapper in this file.
 *
 * `effectiveTier` mirrors `AdversaryCard`'s own `effectiveTier` input (the encounter roster's
 * "retier" control): when set and different from the printed tier, Difficulty/Thresholds/Attack
 * Modifier swap to the book's Improvised Statistics by Tier table (`improvised-tier-stats.utils.ts`)
 * -- the weapon/range/damage line does not retier, matching `AdversaryCard`'s own scope for this.
 * A "Retiered from Tier N" badge is the one thing this mapper puts in `badges` (and, per the
 * `headline` note above, also folds into `headline`): it names a fact (the ORIGINAL printed tier)
 * that is not shown anywhere else once `subtitle` is showing the EFFECTIVE tier, so it is new
 * information, not the "tier restated in two slots" this file's other fields deliberately avoid.
 */
export function adversaryToEntityCard(adversary: AdversaryData, effectiveTier?: number): EntityCardData {
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
  const badges: EntityCardBadge[] | undefined = isRetiered ? [{ label: retieredLabel }] : undefined;
  const headlineParts = [
    difficulty !== undefined ? `Difficulty ${difficulty}` : undefined,
    isRetiered ? retieredLabel : undefined,
  ].filter((part): part is string => !!part);

  return {
    id: adversary.id,
    name: adversary.name,
    cardType: 'adversary',
    eyebrow: titleCase(adversary.adversaryType),
    subtitle: `Tier ${effectiveTier ?? adversary.tier}`,
    headline: headlineParts.length ? headlineParts.join(' · ') : undefined,
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

function buildStats(adversary: AdversaryData, effective: EffectiveNumbers): string[] {
  const stats: string[] = [];
  if (effective.difficulty !== undefined) stats.push(`Difficulty ${effective.difficulty}`);
  if (adversary.hitPointMax !== undefined) stats.push(`HP ${adversary.hitPointMax}`);
  if (adversary.stressMax !== undefined) stats.push(`Stress ${adversary.stressMax}`);
  if (adversary.evasion !== undefined) stats.push(`Evasion ${adversary.evasion}`);
  if (effective.majorThreshold !== undefined) stats.push(`Major ${effective.majorThreshold}`);
  if (effective.severeThreshold !== undefined) stats.push(`Severe ${effective.severeThreshold}`);
  if (effective.attackModifier !== undefined) stats.push(`Atk ${formatModifier(effective.attackModifier)}`);
  return stats;
}

function buildMeta(adversary: AdversaryData): { label: string; value?: string }[] {
  const meta: { label: string; value?: string }[] = [];

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
