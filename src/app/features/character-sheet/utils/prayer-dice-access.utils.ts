import {
  ClassCardResponse,
  SubclassCardResponse,
} from '../../create-character/models/character-sheet-api.model';
import { hasClassFeatureNamed, hasSubclassFeatureNamed } from './class-feature-access.utils';

/**
 * Name of the Seraph *class* feature that grants Prayer Dice. Matched against
 * `classes[].classFeatures[]` like "Patron's Pact", not against subclass features, because the
 * rules put Prayer Dice on the class itself even though the die count comes from the subclass.
 */
const PRAYER_DICE_FEATURE_NAME = 'prayer dice';

/**
 * Name of the Divine Wielder specialization feature that improves the Prayer Dice roll:
 * "When you roll your Prayer Dice, you can roll an additional die and discard the lowest result."
 * It is a *subclass* feature, so it lives on `subclassCards[].features[]`.
 */
const DEVOUT_FEATURE_NAME = 'devout';

/**
 * True when the character has the Seraph "Prayer Dice" class feature, and so should see the
 * Prayer Dice tracker.
 */
export function hasPrayerDice(classes: ClassCardResponse[] | undefined): boolean {
  return hasClassFeatureNamed(classes, PRAYER_DICE_FEATURE_NAME);
}

/**
 * True when the character has the Divine Wielder "Devout" feature, which lets them roll one extra
 * Prayer Die and discard the lowest result.
 */
export function hasDevout(subclassCards: SubclassCardResponse[] | undefined): boolean {
  return hasSubclassFeatureNamed(subclassCards, DEVOUT_FEATURE_NAME);
}
