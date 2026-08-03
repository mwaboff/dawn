/**
 * The display-ready shape `RosterPanel` renders -- deliberately domain-agnostic (no campaign or
 * encounter fields) so one component can present both. Callers map their own response type to
 * this via `roster-panel.mapper.ts`.
 */
export interface RosterPanelItem {
  id: number;
  name: string;
  /** e.g. "GM: dungeon_master" or "Tier 3". */
  metaPrimary: string;
  /** e.g. "4 players" or "8/10 pts". */
  metaSecondary: string;
  /** e.g. "Ended" for a closed campaign. Omitted entirely when there's nothing to flag. */
  badge?: string;
}
