import { CompanionTrainingOption } from '../../../../../../shared/models/companion-api.model';

export interface CompanionTrainingOptionMeta {
  option: CompanionTrainingOption;
  label: string;
  /** One-line summary of the option's effect, from the printed Ranger Companion sheet's
   * Training checkbox list (companions plan §2.5). */
  effect: string;
}

/** All 8 Training options, in the printed sheet's order. */
export const COMPANION_TRAINING_OPTIONS: readonly CompanionTrainingOptionMeta[] = [
  { option: 'INTELLIGENT', label: 'Intelligent', effect: 'Permanent +1 to a chosen companion Experience.' },
  { option: 'LIGHT_IN_THE_DARK', label: 'Light in the Dark', effect: 'An additional Hope slot you can mark.' },
  { option: 'CREATURE_COMFORT', label: 'Creature Comfort', effect: 'Once per rest, gain a Hope or both clear a Stress.' },
  { option: 'ARMORED', label: 'Armored', effect: 'Their damage can mark an Armor Slot instead of Stress.' },
  { option: 'VICIOUS', label: 'Vicious', effect: 'Increase damage dice or range by one step.' },
  { option: 'RESILIENT', label: 'Resilient', effect: 'An additional Stress slot.' },
  { option: 'BONDED', label: 'Bonded', effect: 'Can save you from your last Hit Point.' },
  { option: 'AWARE', label: 'Aware', effect: 'Permanent +2 Evasion.' },
];

export const COMPANION_TRAINING_LABELS: Readonly<Record<CompanionTrainingOption, string>> =
  Object.fromEntries(COMPANION_TRAINING_OPTIONS.map(o => [o.option, o.label])) as Record<CompanionTrainingOption, string>;
