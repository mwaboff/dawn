/**
 * Path constants for the `/character` feature, so router.navigate/routerLink call sites build
 * the same strings instead of retyping them.
 */
export function characterSheetPath(id: number): string {
  return `/character/${id}`;
}

export function characterLevelUpPath(id: number): string {
  return `/character/${id}/level-up`;
}

export function characterLevelDownPath(id: number): string {
  return `/character/${id}/level-down`;
}
