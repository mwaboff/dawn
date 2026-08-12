import {
  CompanionTrainingApiResponse,
  CompanionTrainingOption,
  ViciousAxis,
} from '../../../../../../shared/models/companion-api.model';

export interface CompanionTrainingOptionMeta {
  option: CompanionTrainingOption;
  label: string;
  /**
   * The printed checkbox count for this option on the Ranger Companion sheet -- how many times one
   * companion can ever take it. Mirrors `CompanionTrainingOption.getMaxSelections()` on the backend,
   * which is the enforcing copy; this one exists so the sheet can draw the unfilled boxes too.
   */
  maxSelections: number;
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
  { option: 'INTELLIGENT', label: 'Intelligent', maxSelections: 3, effect: 'Your companion gains a permanent +1 bonus to a Companion Experience of your choice.' },
  { option: 'LIGHT_IN_THE_DARK', label: 'Light in the Dark', maxSelections: 1, effect: 'Use this as an additional Hope slot your character can mark.' },
  { option: 'CREATURE_COMFORT', label: 'Creature Comfort', maxSelections: 1, effect: 'Once per rest, when you take time during a quiet moment to give your companion love and attention, you can gain a Hope or you can both clear a Stress.' },
  { option: 'ARMORED', label: 'Armored', maxSelections: 1, effect: 'When your companion takes damage, you can mark one of your Armor Slots instead of marking one of their Stress.' },
  { option: 'VICIOUS', label: 'Vicious', maxSelections: 3, effect: "Increase your companion's damage dice or range by one step (d6 to d8, Close to Far, etc.)." },
  { option: 'RESILIENT', label: 'Resilient', maxSelections: 3, effect: 'Your companion gains an additional Stress slot.' },
  { option: 'BONDED', label: 'Bonded', maxSelections: 1, effect: 'When you mark your last Hit Point, your companion rushes to your side to comfort you. Roll a number of d6s equal to the unmarked Stress slots they have and mark them. If any roll a 6, your companion helps you up. Clear your last Hit Point and return to the scene.' },
  { option: 'AWARE', label: 'Aware', maxSelections: 3, effect: 'Your companion gains a permanent +2 bonus to their Evasion.' },
];

export const COMPANION_TRAINING_LABELS: Readonly<Record<CompanionTrainingOption, string>> =
  Object.fromEntries(COMPANION_TRAINING_OPTIONS.map(o => [o.option, o.label])) as Record<CompanionTrainingOption, string>;

/** Suffix shown after `Vicious`'s taken-Training label, naming which of the two steps
 * (`core-01:1355`, "Increase your companion's damage dice or range by one step") it applies to. */
export const VICIOUS_AXIS_LABELS: Readonly<Record<ViciousAxis, string>> = {
  DAMAGE_DIE: 'Damage Die',
  RANGE: 'Range',
};

/**
 * One Training option a companion has taken, collapsed across however many times it was taken.
 *
 * A repeatable option (Intelligent, Vicious, Resilient, Aware) arrives from the API as one row per
 * pick; rendering those as separate entries repeats the same rules text up to three times, so they
 * fold into a single entry carrying the count instead.
 */
export interface TakenCompanionTraining {
  readonly option: CompanionTrainingOption;
  readonly label: string;
  readonly effect: string;
  readonly taken: number;
  readonly maxSelections: number;
  /**
   * "Taken 2 of 3", or empty for an option that can only ever be taken once and so has nothing to
   * count. Deliberately text rather than the printed sheet's row of filled/hollow checkboxes: a
   * filled-versus-empty row means "click me to toggle" everywhere else on this sheet (Hope, Stress,
   * Armor all render exactly that as `.resource-box` buttons), and Training is not editable here.
   */
  readonly countLabel: string;
  /**
   * The Vicious steps picked, in the order taken -- "Damage Die, Range". Empty for every other
   * option. Joined here rather than in a template, which would re-join it on every change
   * detection pass, and which the beta card could not reuse.
   */
  readonly viciousAxes: readonly string[];
  readonly viciousAxesLabel: string;
}

/**
 * Groups a companion's raw Training rows into one entry per option, in the printed sheet's order
 * rather than acquisition order -- the sheet is a checklist, and a checklist that reorders itself as
 * you fill it in is harder to read against the physical card.
 */
export function groupCompanionTrainings(
  trainings: readonly CompanionTrainingApiResponse[],
): readonly TakenCompanionTraining[] {
  return COMPANION_TRAINING_OPTIONS.flatMap(meta => {
    const taken = trainings.filter(training => training.option === meta.option);
    if (taken.length === 0) return [];
    const viciousAxes = taken
      .map(training => training.viciousAxis)
      .filter((axis): axis is ViciousAxis => axis !== undefined)
      .map(axis => VICIOUS_AXIS_LABELS[axis]);
    return [
      {
        option: meta.option,
        label: meta.label,
        effect: meta.effect,
        taken: taken.length,
        maxSelections: meta.maxSelections,
        countLabel: meta.maxSelections > 1 ? `Taken ${taken.length} of ${meta.maxSelections}` : '',
        viciousAxes,
        viciousAxesLabel: viciousAxes.join(', '),
      },
    ];
  });
}
