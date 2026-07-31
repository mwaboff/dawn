import { ClassCardResponse } from '../../create-character/models/character-sheet-api.model';

/**
 * Name of the class feature that grants access to Beastform options. Matched case-insensitively
 * against every class the character has, rather than hardcoding `'Druid'`, so multiclass
 * characters and homebrew/expansion classes that grant the feature work too.
 */
const BEASTFORM_FEATURE_NAME = 'beastform';

/**
 * Highest Beastform tier a character can assume. Beastform lets a druid transform into a creature
 * "of your tier or lower", and a multiclassed character uses the tier of their FULL character
 * level -- the rulebook's example is a level 7 wizard multiclassing into druid getting the tier 3
 * options -- so this is derived from character level alone, never from a per-class level.
 */
export function tierForLevel(level: number): number {
  if (level <= 1) return 1;
  if (level <= 4) return 2;
  if (level <= 7) return 3;
  return 4;
}

/**
 * True when any of the character's classes has a class feature named "Beastform".
 *
 * Scans ALL classes, not the deprecated singular `class`, because that one only ever holds the
 * lowest-id class -- a level 7 wizard/druid would otherwise never see the section. Returns false
 * for an absent `classes` array (an older response, or `expand=class` not requested) so the
 * section simply does not render instead of crashing.
 */
export function hasBeastformFeature(classes: ClassCardResponse[] | undefined): boolean {
  return (classes ?? []).some(characterClass =>
    (characterClass.classFeatures ?? []).some(
      feature => feature.name?.trim().toLowerCase() === BEASTFORM_FEATURE_NAME,
    ),
  );
}
