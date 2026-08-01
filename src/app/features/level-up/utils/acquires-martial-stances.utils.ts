import { AdvancementChoice } from '../models/level-up-api.model';
import { SubclassCardResponse } from '../../../shared/models/subclass-api.model';
import { hasMartialStances } from '../../character-sheet/utils/martial-stance-access.utils';

const ACQUISITION_ADVANCEMENT_TYPES = new Set<string>(['UPGRADE_SUBCLASS', 'MULTICLASS']);

/**
 * True when a chosen UPGRADE_SUBCLASS/MULTICLASS advancement newly grants a subclass card whose
 * features include "Stance Fighter" (the Martial Artist's foundation feature) -- e.g. a
 * multiclassed character picking the Martial Artist foundation card. Mirrors
 * `countBonusSlotsFromAdvancements`'s shape (same advancement types, same "skip already-owned
 * ids" guard) since both read a newly-acquired subclass card's features off the same
 * `selectedAdvancements` / `subclassCardId` / cached-card-lookup plumbing.
 *
 * Detection goes through `hasMartialStances`, the single place the "Stance Fighter" feature name
 * is matched, so this only ever answers "did this level-up newly grant the feature" -- it never
 * hand-rolls its own feature-name check, and it says nothing about whether the character already
 * had the feature (that's `hasMartialStances` on the existing `subclassCards`).
 */
export function acquiresMartialStances(
  chosen: readonly AdvancementChoice[],
  ownedSubclassIds: ReadonlySet<number>,
  subclassCardLookup: (id: number) => SubclassCardResponse | undefined,
  alreadyHasMartialStances: boolean,
): boolean {
  // Acquisition means gaining Stance Fighter for the FIRST time. A character who already has it
  // is in the ongoing "+1 per level-up" case, even if this level-up grants a second card carrying
  // the same feature -- the initial "choose two from Tier 1" grant fires once per character, not
  // once per card. Guarding on the owned card ids alone would miss that, since a different card
  // id carrying the same feature would otherwise read as a fresh acquisition.
  if (alreadyHasMartialStances) return false;
  return chosen.some(a => {
    if (!ACQUISITION_ADVANCEMENT_TYPES.has(a.type)) return false;
    if (a.subclassCardId == null) return false;
    if (ownedSubclassIds.has(a.subclassCardId)) return false;
    const card = subclassCardLookup(a.subclassCardId);
    return card !== undefined && hasMartialStances([card]);
  });
}
