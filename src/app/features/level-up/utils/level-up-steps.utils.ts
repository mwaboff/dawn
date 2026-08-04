import { LevelUpOptionsResponse } from '../models/level-up-api.model';
import { ALL_LEVEL_UP_TABS, LevelUpTab } from '../models/level-up.model';

/** One eligible companion, enough to build its `training` tab's id and label. */
export interface TrainingTabSource {
  companionId: number;
  name: string;
}

export interface TabVisibility {
  /** Characters with the "Stance Fighter" feature (Martial Artist) -- see
   * `martial-stance-access.utils.ts`'s `hasMartialStances`. */
  hasMartialStances?: boolean;
  /** This level-up grants the Companion feature AND no active companion exists yet -- see
   * `acquires-companion-feature.utils.ts` and `level-up.ts`'s `needsCompanionStep`. */
  needsCompanionStep?: boolean;
  /** One entry per companion eligible for a Training pick this level-up (active,
   * `advancesOnLevelUp`, existed before this level-up) -- `LevelUpOptionsResponse.companionTraining`. */
  trainingCompanions?: readonly TrainingTabSource[];
}

/**
 * Visible level-up wizard steps, in order:
 * `tier-achievements -> advancements -> companion -> martial-stance -> training(xN) -> domain-card
 * -> domain-trades -> review`.
 *
 * `tier-achievements` only appears on a tier transition. `companion` only appears when this
 * level-up newly grants the Companion feature and the character has no active companion yet.
 * `martial-stance` only appears for characters with "Stance Fighter", since that grants an
 * additional known stance on every level-up, not just tier transitions. `training` tabs are
 * generated one per eligible companion -- there is no static config entry for them, unlike every
 * other tab -- and always sit right after where `martial-stance` would be, whether or not
 * `martial-stance` itself is shown.
 */
export function computeVisibleTabs(options: LevelUpOptionsResponse, visibility: TabVisibility = {}): LevelUpTab[] {
  const { hasMartialStances = false, needsCompanionStep = false, trainingCompanions = [] } = visibility;
  const isTierTransition = options.tierTransition || options.currentTier !== options.nextTier;

  const trainingTabs: LevelUpTab[] = trainingCompanions.map(c => ({
    id: `training-${c.companionId}`,
    label: `Training: ${c.name}`,
    kind: 'training',
    companionId: c.companionId,
  }));

  const result: LevelUpTab[] = [];
  for (const tab of ALL_LEVEL_UP_TABS) {
    if (tab.kind === 'tier-achievements' && !isTierTransition) continue;
    if (tab.kind === 'companion' && !needsCompanionStep) continue;
    if (tab.kind === 'martial-stance') {
      if (hasMartialStances) result.push(tab);
      result.push(...trainingTabs);
      continue;
    }
    result.push(tab);
  }
  return result;
}
