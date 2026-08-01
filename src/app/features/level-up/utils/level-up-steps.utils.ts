import { LevelUpOptionsResponse } from '../models/level-up-api.model';
import { ALL_LEVEL_UP_TABS, LevelUpTab } from '../models/level-up.model';

/**
 * Visible level-up wizard steps. `tier-achievements` only appears on a tier transition;
 * `martial-stance` only appears for characters with the "Stance Fighter" feature (Martial
 * Artist), since the rules grant an additional known stance on every level-up, not just
 * tier transitions -- see `hasMartialStances` in `character-sheet/utils/martial-stance-access.utils.ts`.
 */
export function computeVisibleTabs(options: LevelUpOptionsResponse, hasMartialStances = false): LevelUpTab[] {
  const tierFiltered = options.tierTransition || options.currentTier !== options.nextTier
    ? ALL_LEVEL_UP_TABS
    : ALL_LEVEL_UP_TABS.filter(tab => tab.id !== 'tier-achievements');

  return hasMartialStances ? tierFiltered : tierFiltered.filter(tab => tab.id !== 'martial-stance');
}
