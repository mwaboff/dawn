export type LevelUpTabId =
  | 'tier-achievements' | 'advancements' | 'martial-stance' | 'domain-card' | 'domain-trades' | 'review';

export interface LevelUpTab {
  id: LevelUpTabId;
  label: string;
}

export const ALL_LEVEL_UP_TABS: LevelUpTab[] = [
  { id: 'tier-achievements', label: 'Tier Achievements' },
  { id: 'advancements', label: 'Advancements' },
  { id: 'martial-stance', label: 'Martial Stance' },
  { id: 'domain-card', label: 'Domain Card' },
  { id: 'domain-trades', label: 'Card Trades' },
  { id: 'review', label: 'Review' },
];
