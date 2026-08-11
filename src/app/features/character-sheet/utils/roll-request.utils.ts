import { AdvantageState, RollRequest } from '../../../shared/models/dice-roller.model';
import { TraitDisplay, WeaponDisplay } from '../models/character-sheet-view.model';

/**
 * Builds the roll request for a trait badge. Per RAW, advantage/disadvantage applies to
 * action and reaction rolls, so it is threaded through from the A/N/D menu — `undefined` rolls
 * normal.
 */
export function buildTraitRollRequest(trait: TraitDisplay, advantage?: AdvantageState): RollRequest {
  return {
    dice: [],
    includeDuality: true,
    modifiers: [{ label: trait.name, value: trait.modifier.modified }],
    advantage,
    autoRoll: true,
    label: `${trait.name} Roll`,
  };
}

/**
 * Builds the roll request for an equipped weapon's damage roll. Returns `null` when the weapon
 * has no rollable damage — no damage data, a `diceType` that didn't normalize
 * (see `damageDice` on `WeaponDisplay`), or a resolved dice count of zero — so the template can
 * hide the roll affordance instead of triggering an empty roll.
 *
 * Per RAW, Proficiency multiplies the number of damage dice only; the flat modifier is added
 * once regardless of Proficiency (`d6+3` at Proficiency 3 is `3d6+3`, not `3d6+9`). Advantage/
 * disadvantage never applies to damage rolls, so this request carries no `advantage` field.
 *
 * @param proficiency the wielder's current effective Proficiency (`sheet.proficiency.modified`),
 *   used only when the weapon's own damage data omits an explicit dice count.
 */
export function buildWeaponDamageRollRequest(weapon: WeaponDisplay, proficiency: number): RollRequest | null {
  const dice = weapon.damageDice;
  if (!dice) return null;

  const count = dice.diceCount ?? proficiency;
  if (!count || count <= 0) return null;

  return {
    dice: [{ type: dice.type, count }],
    includeDuality: false,
    modifiers: [{ label: weapon.name, value: dice.modifier }],
    autoRoll: true,
    label: `${weapon.name} Damage`,
  };
}
