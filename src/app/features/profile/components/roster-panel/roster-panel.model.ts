/**
 * The display-ready shape `RosterPanel` renders -- deliberately domain-agnostic (no campaign or
 * encounter fields) so one component can present both. Callers map their own response type to
 * this via `roster-panel.mapper.ts`.
 */
export interface RosterPanelItem {
  id: number;
  /**
   * Identity for tracking and for targeting the delete confirmation, when `id` alone is not
   * unique within the list. Items are the case that forced this: they come from three tables,
   * so weapon 7, armor 7, and loot 7 can all sit in one panel. Campaigns and encounters each
   * come from a single table and leave this unset, falling back to `id`.
   */
  key?: string;
  name: string;
  /** e.g. "GM: dungeon_master" or "Tier 3". */
  metaPrimary: string;
  /** e.g. "4 players" or "8/10 pts". */
  metaSecondary: string;
  /** e.g. "Ended" for a closed campaign. Omitted entirely when there's nothing to flag. */
  badge?: string;
}
