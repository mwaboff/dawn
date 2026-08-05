/**
 * Discriminates what a tab actually renders. `id` stays a plain, opaque string (see
 * `LevelUpTabId` below) because `training` tabs are generated one-per-companion at
 * `computeVisibleTabs` time (`training-${companionId}`), not drawn from a fixed literal set --
 * only `kind` needs to stay a closed union, since it is the thing `level-up.html`'s
 * `@switch (activeTabKind())` actually dispatches on.
 */
export type LevelUpTabKind =
  | 'tier-achievements' | 'advancements' | 'companion' | 'martial-stance' | 'training'
  | 'domain-card' | 'domain-trades' | 'review';

/**
 * `id` was previously a closed literal union itself; now a plain string so a `training-7` id
 * (unique and stable, but not known ahead of time) type-checks. Every existing call site that
 * assigns a literal ('advancements', etc.) still type-checks fine against `string`, so this is a
 * type-only widening with no consumer changes required outside `level-up.ts`/`level-up.html`.
 */
export type LevelUpTabId = string;

export interface LevelUpTab {
  id: LevelUpTabId;
  label: string;
  kind: LevelUpTabKind;
  /** Set only on `kind: 'companion'` (when exactly one restorable candidate exists) or `kind:
   * 'training'` entries -- which companion this tab acts on. */
  companionId?: number;
}

/**
 * The static, non-generated tabs, in wizard order. `training` tabs are NOT listed here -- they
 * don't exist until `computeVisibleTabs` builds one per eligible companion. See that function for
 * where `companion` and `training` get spliced in.
 */
export const ALL_LEVEL_UP_TABS: LevelUpTab[] = [
  { id: 'tier-achievements', label: 'Tier Achievements', kind: 'tier-achievements' },
  { id: 'advancements', label: 'Advancements', kind: 'advancements' },
  { id: 'companion', label: 'Companion', kind: 'companion' },
  { id: 'martial-stance', label: 'Martial Stance', kind: 'martial-stance' },
  { id: 'domain-card', label: 'Domain Card', kind: 'domain-card' },
  { id: 'domain-trades', label: 'Card Trades', kind: 'domain-trades' },
  { id: 'review', label: 'Review', kind: 'review' },
];
