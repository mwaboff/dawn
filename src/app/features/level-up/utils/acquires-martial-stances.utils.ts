import { AdvancementChoice } from '../models/level-up-api.model';
import { SubclassCardResponse } from '../../../shared/models/subclass-api.model';
import { hasMartialStances } from '../../character-sheet/utils/martial-stance-access.utils';
import { acquiresSubclassFeature } from './acquires-subclass-feature.utils';

/**
 * True when a chosen UPGRADE_SUBCLASS/MULTICLASS advancement newly grants a subclass card whose
 * features include "Stance Fighter" (the Martial Artist's foundation feature) -- e.g. a
 * multiclassed character picking the Martial Artist foundation card. A thin `hasMartialStances`
 * binding over `acquiresSubclassFeature`, which owns the actual scan (see that module) --
 * `acquiresCompanionFeature` is the other binding, over `hasCompanionFeature`.
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
  return acquiresSubclassFeature(
    chosen,
    ownedSubclassIds,
    subclassCardLookup,
    alreadyHasMartialStances,
    (card) => hasMartialStances([card]),
  );
}
