import { AdvancementChoice } from '../models/level-up-api.model';
import { SubclassCardResponse } from '../../../shared/models/subclass-api.model';

export const ACQUISITION_ADVANCEMENT_TYPES = new Set<string>(['UPGRADE_SUBCLASS', 'MULTICLASS']);

/**
 * True when a chosen UPGRADE_SUBCLASS/MULTICLASS advancement newly grants a subclass card that
 * carries some feature -- e.g. a multiclassed character picking the Martial Artist foundation
 * card (Stance Fighter) or the Beastbound Ranger foundation card (Companion). Generic over
 * `cardHasFeature` so `acquiresMartialStances` and `acquiresCompanionFeature` share this scan
 * instead of each re-implementing "walk `chosen`, skip already-owned ids, look the card up, test
 * its features" -- the same domain rule (subclass-feature acquisition detection) with different
 * feature predicates, not two different rules.
 */
export function acquiresSubclassFeature(
  chosen: readonly AdvancementChoice[],
  ownedSubclassIds: ReadonlySet<number>,
  subclassCardLookup: (id: number) => SubclassCardResponse | undefined,
  alreadyHasFeature: boolean,
  cardHasFeature: (card: SubclassCardResponse) => boolean,
): boolean {
  // Acquisition means gaining the feature for the FIRST time. A character who already has it is
  // in the "ongoing per-level-up" case even if this level-up grants a second card carrying the
  // same feature -- the initial grant fires once per character, not once per card.
  if (alreadyHasFeature) return false;
  return chosen.some(a => {
    if (!ACQUISITION_ADVANCEMENT_TYPES.has(a.type)) return false;
    if (a.subclassCardId == null) return false;
    if (ownedSubclassIds.has(a.subclassCardId)) return false;
    const card = subclassCardLookup(a.subclassCardId);
    return card !== undefined && cardHasFeature(card);
  });
}
