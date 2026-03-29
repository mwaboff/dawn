import { LevelUpOptionsResponse } from '../models/level-up-api.model';
import { ALL_LEVEL_UP_TABS, LevelUpTab } from '../models/level-up.model';

export function computeVisibleTabs(options: LevelUpOptionsResponse): LevelUpTab[] {
  if (options.tierTransition || options.currentTier !== options.nextTier) {
    return ALL_LEVEL_UP_TABS;
  }
  return ALL_LEVEL_UP_TABS.filter(tab => tab.id !== 'tier-achievements');
}
