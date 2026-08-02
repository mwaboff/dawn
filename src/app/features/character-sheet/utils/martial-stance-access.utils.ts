import { SubclassCardResponse } from '../../create-character/models/character-sheet-api.model';

/**
 * Name of the subclass foundation feature that grants Martial Stances. "Stance Fighter" is a
 * Brawler *subclass* foundation feature (Martial Artist), not a class feature, so it must be
 * matched against `subclassCards[].features[]` rather than `classes[].classFeatures[]` --
 * unlike `hasBeastformFeature`, which scans classes.
 */
const STANCE_FIGHTER_FEATURE_NAME = 'stance fighter';

/**
 * True when any of the character's subclass cards has a feature named "Stance Fighter".
 *
 * Matched case/whitespace-insensitively and gated by feature name (not subclass name) so
 * homebrew subclasses granting the same feature also work. Returns false (never throws) for an
 * absent `subclassCards` array -- an older response, or `expand=subclassCards` not requested --
 * so the martial stance section simply does not render instead of crashing.
 */
export function hasMartialStances(subclassCards: SubclassCardResponse[] | undefined): boolean {
  return (subclassCards ?? []).some(card =>
    (card.features ?? []).some(
      feature => feature.name?.trim().toLowerCase() === STANCE_FIGHTER_FEATURE_NAME,
    ),
  );
}
