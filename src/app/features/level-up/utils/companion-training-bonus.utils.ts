import { AdvancementChoice } from '../models/level-up-api.model';
import { SubclassCardResponse } from '../../../shared/models/subclass-api.model';
import { ACQUISITION_ADVANCEMENT_TYPES } from './acquires-subclass-feature.utils';

/**
 * Feature names the server matches on (`LevelUpService.computeCompanionPicksAvailable`) --
 * Specialization's "Expert Training" (+1) and Mastery's "Advanced Training" (+2). NOT
 * `card.level === 'SPECIALIZATION' | 'MASTERY'`: that would be a second, independent
 * implementation of the same rule that silently disagrees with the server on homebrew subclasses
 * (a homebrew Specialization card with no "Expert Training" feature would still grant +1). It
 * would also disagree on THIS subclass, in production, right now -- Beastbound's Specialization
 * card does not carry "Companion" (that's Foundation-only); it carries "Expert Training" and
 * "Battle-Bonded".
 */
const EXPERT_TRAINING_FEATURE_NAME = 'expert training';
const ADVANCED_TRAINING_FEATURE_NAME = 'advanced training';

/** Case/whitespace-insensitive match on a `SUBCLASS`-typed feature name, same convention as
 * `hasCompanionFeature`/`hasMartialStances` -- the `featureType` check rules out a same-named
 * feature of a different type (see those functions' docs for the concrete production collision). */
function grantsFeatureNamed(card: SubclassCardResponse, featureName: string): boolean {
  return (card.features ?? []).some(
    (f) => f.name?.trim().toLowerCase() === featureName && f.featureType === 'SUBCLASS',
  );
}

/**
 * Extra companion Training picks granted THIS level-up by Beastbound's Expert Training
 * (Specialization, +1) / Advanced Training (Mastery, +2) -- "Choose an additional level-up
 * option" reads as an immediate grant the level-up the card is taken, same level-up the Training
 * step itself appears.
 *
 * The `/level-up/options` endpoint runs BEFORE advancements are chosen, so it cannot know which
 * subclass card (if any) this level-up will grant -- its `picksAvailable` is always the baseline
 * (1). This recomputes the real bonus client-side from the advancement choices, reactively, the
 * same way `acquiresMartialStancesThisLevelUp` already does for the martial-stance step. The
 * server's `validateLevelUpRequest` remains authoritative on submit.
 *
 * Applies uniformly to every eligible companion's tab (`level-up.ts` adds this to each
 * `companionTraining[i].picksAvailable`) -- RAW's "your companion" is a single companion in the
 * common case, and nothing in the rules scopes Expert/Advanced Training to one companion over
 * another when a GM allows several.
 */
export function companionTrainingBonusPicks(
  chosen: readonly AdvancementChoice[],
  ownedSubclassIds: ReadonlySet<number>,
  subclassCardLookup: (id: number) => SubclassCardResponse | undefined,
): number {
  let bonus = 0;
  for (const a of chosen) {
    if (!ACQUISITION_ADVANCEMENT_TYPES.has(a.type)) continue;
    if (a.subclassCardId == null) continue;
    if (ownedSubclassIds.has(a.subclassCardId)) continue;
    const card = subclassCardLookup(a.subclassCardId);
    if (!card) continue;
    if (grantsFeatureNamed(card, ADVANCED_TRAINING_FEATURE_NAME)) bonus += 2;
    else if (grantsFeatureNamed(card, EXPERT_TRAINING_FEATURE_NAME)) bonus += 1;
  }
  return bonus;
}
