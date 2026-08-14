import {
  ClassCardResponse,
  SubclassCardResponse,
} from '../../create-character/models/character-sheet-api.model';

/**
 * True when any of the character's classes has a class feature with this name.
 *
 * Matched case- and whitespace-insensitively, and gated by feature name rather than class name, so
 * a multiclass character or a homebrew class granting the same feature is treated the same as the
 * official one. Returns false (never throws) for an absent `classes` array -- an older response, or
 * `expand=classes` not requested -- so the dependent section simply does not render.
 */
export function hasClassFeatureNamed(
  classes: ClassCardResponse[] | undefined,
  featureName: string,
): boolean {
  return (classes ?? []).some(characterClass =>
    (characterClass.classFeatures ?? []).some(
      feature => feature.name?.trim().toLowerCase() === featureName,
    ),
  );
}

/**
 * True when any of the character's subclass cards has a feature with this name.
 *
 * The subclass-card counterpart to {@link hasClassFeatureNamed}, with the same matching and
 * missing-array behaviour. Subclass features live on `subclassCards[].features[]`, a different
 * array from class features, so the two cannot share one lookup.
 */
export function hasSubclassFeatureNamed(
  subclassCards: SubclassCardResponse[] | undefined,
  featureName: string,
): boolean {
  return (subclassCards ?? []).some(card =>
    (card.features ?? []).some(feature => feature.name?.trim().toLowerCase() === featureName),
  );
}
