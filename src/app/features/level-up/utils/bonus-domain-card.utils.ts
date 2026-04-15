import { AdvancementChoice } from '../models/level-up-api.model';
import { SubclassCardResponse } from '../../../shared/models/subclass-api.model';
import { sumFeatureModifier } from '../../../shared/utils/feature-modifier.utils';

/**
 * Slots granted by BONUS_DOMAIN_CARD_SELECTIONS modifiers on subclass cards
 * newly acquired via this level-up's UPGRADE_SUBCLASS / MULTICLASS advancements.
 */
export function countBonusSlotsFromAdvancements(
  chosen: readonly AdvancementChoice[],
  ownedSubclassIds: ReadonlySet<number>,
  subclassCardLookup: (id: number) => SubclassCardResponse | undefined,
): number {
  let total = 0;
  for (const a of chosen) {
    if (a.type !== 'UPGRADE_SUBCLASS' && a.type !== 'MULTICLASS') continue;
    if (a.subclassCardId == null) continue;
    if (ownedSubclassIds.has(a.subclassCardId)) continue;
    const card = subclassCardLookup(a.subclassCardId);
    total += sumFeatureModifier(card?.features, 'BONUS_DOMAIN_CARD_SELECTIONS');
  }
  return total;
}
