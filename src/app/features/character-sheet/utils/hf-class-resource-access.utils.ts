import { ClassCardResponse } from '../../create-character/models/character-sheet-api.model';
import { hasClassFeatureNamed } from './class-feature-access.utils';

/**
 * Name of the Warlock class feature that grants the Patron Die and the Favor economy
 * ("Patron's Pact"). Matched against `classes[].classFeatures[]`, mirroring
 * `hasBeastformFeature`, so multiclass and homebrew classes granting the same feature work too.
 */
const PATRONS_PACT_FEATURE_NAME = "patron's pact";

/**
 * Name of the Brawler class feature that grants the Combo Die ("Combo Strike").
 */
const COMBO_STRIKE_FEATURE_NAME = 'combo strike';

/**
 * True when any of the character's classes has the Warlock "Patron's Pact" feature, which grants
 * both the Favor resource and the level-scaled Patron Die.
 */
export function hasWarlockResources(classes: ClassCardResponse[] | undefined): boolean {
  return hasClassFeatureNamed(classes, PATRONS_PACT_FEATURE_NAME);
}

/**
 * True when any of the character's classes has the Brawler "Combo Strike" feature, which grants
 * the stored Combo Die resource.
 */
export function hasBrawlerResources(classes: ClassCardResponse[] | undefined): boolean {
  return hasClassFeatureNamed(classes, COMBO_STRIKE_FEATURE_NAME);
}
