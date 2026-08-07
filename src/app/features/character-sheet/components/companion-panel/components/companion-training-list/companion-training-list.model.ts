import { CompanionTrainingOption, ViciousAxis } from '../../../../../../shared/models/companion-api.model';

export interface CompanionTrainingOptionMeta {
  option: CompanionTrainingOption;
  label: string;
  /**
   * VERBATIM text from the printed Ranger Companion sheet's Training checkbox list
   * (`resources/rules/chapters/core-01-preparing-for-adventure.md:1351-1365`), not a paraphrase.
   * These are table-adjudicated rules a player reads off the sheet to resolve a moment at the
   * table -- `Bonded`'s dice-and-mark procedure in particular is information, not flavor, and
   * paraphrasing it away breaks play. Layout (not truncation) is how this list handles Bonded's
   * length -- see `companion-training-list.css`/`training-step.css`.
   */
  effect: string;
}

/** All 8 Training options, in the printed sheet's order. */
export const COMPANION_TRAINING_OPTIONS: readonly CompanionTrainingOptionMeta[] = [
  { option: 'INTELLIGENT', label: 'Intelligent', effect: 'Your companion gains a permanent +1 bonus to a Companion Experience of your choice.' },
  { option: 'LIGHT_IN_THE_DARK', label: 'Light in the Dark', effect: 'Use this as an additional Hope slot your character can mark.' },
  { option: 'CREATURE_COMFORT', label: 'Creature Comfort', effect: 'Once per rest, when you take time during a quiet moment to give your companion love and attention, you can gain a Hope or you can both clear a Stress.' },
  { option: 'ARMORED', label: 'Armored', effect: 'When your companion takes damage, you can mark one of your Armor Slots instead of marking one of their Stress.' },
  { option: 'VICIOUS', label: 'Vicious', effect: "Increase your companion's damage dice or range by one step (d6 to d8, Close to Far, etc.)." },
  { option: 'RESILIENT', label: 'Resilient', effect: 'Your companion gains an additional Stress slot.' },
  { option: 'BONDED', label: 'Bonded', effect: 'When you mark your last Hit Point, your companion rushes to your side to comfort you. Roll a number of d6s equal to the unmarked Stress slots they have and mark them. If any roll a 6, your companion helps you up. Clear your last Hit Point and return to the scene.' },
  { option: 'AWARE', label: 'Aware', effect: 'Your companion gains a permanent +2 bonus to their Evasion.' },
];

export const COMPANION_TRAINING_LABELS: Readonly<Record<CompanionTrainingOption, string>> =
  Object.fromEntries(COMPANION_TRAINING_OPTIONS.map(o => [o.option, o.label])) as Record<CompanionTrainingOption, string>;

/** Suffix shown after `Vicious`'s taken-Training label, naming which of the two steps
 * (`core-01:1355`, "Increase your companion's damage dice or range by one step") it applies to. */
export const VICIOUS_AXIS_LABELS: Readonly<Record<ViciousAxis, string>> = {
  DAMAGE_DIE: 'Damage Die',
  RANGE: 'Range',
};
