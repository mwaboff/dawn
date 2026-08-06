import { ItemFormValue } from '../models/item-form-value.model';

/**
 * Advisory power-level checks for homebrew items.
 *
 * Every function here returns *advice*, never an error: Daggerheart's own text invites tables to
 * build gear the books never printed, so nothing in this module may block a save. The hard rules
 * (name length, tier range, positive thresholds) live in the form's validators instead.
 */

/** Damage modifier a printed primary weapon carries per tier, near enough. */
export const PRIMARY_MODIFIER_PER_TIER = 3;

/** Damage modifier a printed secondary weapon carries per tier, near enough. */
export const SECONDARY_MODIFIER_PER_TIER = 2;

/**
 * How far a modifier may sit from the printed baseline before it is worth mentioning. Set to a
 * full tier's worth of damage so that ordinary tuning stays quiet and only real outliers speak up.
 */
export const MODIFIER_ADVISORY_TOLERANCE = 3;

/** The highest Armor Score on any published armor. */
export const PUBLISHED_MAX_ARMOR_SCORE = 12;

/** Shown next to the damage dice so nobody goes looking for a dice-count field. */
export const DICE_COUNT_NOTE = 'Damage dice count comes from your Proficiency.';

/** The damage modifier a book-standard weapon of this tier and slot would carry. */
export function expectedDamageModifier(tier: number, isPrimary: boolean): number {
  const perTier = isPrimary ? PRIMARY_MODIFIER_PER_TIER : SECONDARY_MODIFIER_PER_TIER;
  return tier * perTier;
}

/**
 * Advice when a weapon's damage modifier is far from what the books print for its tier and slot,
 * or `null` when it is close enough to say nothing. Out-of-range tiers return `null` -- the tier
 * field's own validator already has something to say about those.
 */
export function damageModifierAdvice(
  tier: number,
  isPrimary: boolean,
  modifier: number,
): string | null {
  if (!Number.isInteger(tier) || tier < 1 || tier > 4) return null;
  if (!Number.isFinite(modifier)) return null;

  const expected = expectedDamageModifier(tier, isPrimary);
  if (Math.abs(modifier - expected) <= MODIFIER_ADVISORY_TOLERANCE) return null;

  const slot = isPrimary ? 'primaries' : 'secondaries';
  return `Tier ${tier} ${slot} in the books deal about +${expected}.`;
}

/** Advice when an Armor Score is higher than anything published, or `null` when it is not. */
export function armorScoreAdvice(baseScore: number): string | null {
  if (!Number.isFinite(baseScore) || baseScore <= PUBLISHED_MAX_ARMOR_SCORE) return null;
  return `Armor Score above ${PUBLISHED_MAX_ARMOR_SCORE} exceeds anything published.`;
}

/**
 * Every advisory that applies to an item as currently filled in, in display order. Values are
 * coerced because a `<select>` or a number input hands back strings; loot has nothing to advise on.
 */
export function itemAdvisories(value: ItemFormValue): string[] {
  const notes = [
    value.kind === 'weapon'
      ? damageModifierAdvice(Number(value.tier), value.isPrimary, Number(value.modifier))
      : null,
    value.kind === 'armor' ? armorScoreAdvice(Number(value.baseScore)) : null,
  ];
  return notes.filter((note): note is string => note !== null);
}
