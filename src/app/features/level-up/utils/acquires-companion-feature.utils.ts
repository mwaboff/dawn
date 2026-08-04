import { AdvancementChoice } from '../models/level-up-api.model';
import { SubclassCardResponse } from '../../../shared/models/subclass-api.model';
import { hasCompanionFeature } from '../../character-sheet/utils/companion-access.utils';
import { acquiresSubclassFeature } from './acquires-subclass-feature.utils';

/**
 * True when a chosen UPGRADE_SUBCLASS/MULTICLASS advancement newly grants a subclass card
 * carrying the Beastbound Ranger's "Companion" foundation feature -- e.g. multiclassing into
 * Beastbound. The `hasCompanionFeature` binding over `acquiresSubclassFeature`; see
 * `acquires-martial-stances.utils.ts`'s `acquiresMartialStances` for the sibling binding.
 */
export function acquiresCompanionFeature(
  chosen: readonly AdvancementChoice[],
  ownedSubclassIds: ReadonlySet<number>,
  subclassCardLookup: (id: number) => SubclassCardResponse | undefined,
  alreadyHasCompanionFeature: boolean,
): boolean {
  return acquiresSubclassFeature(
    chosen,
    ownedSubclassIds,
    subclassCardLookup,
    alreadyHasCompanionFeature,
    (card) => hasCompanionFeature([card]),
  );
}
