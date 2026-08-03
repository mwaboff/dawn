/**
 * Path constants for the `/encounters` feature, so the router config, the navbar link, and every
 * `router.navigate`/`routerLink` call site build the same strings instead of retyping them.
 */
export const ENCOUNTERS_LIST_PATH = '/encounters';
export const ENCOUNTER_NEW_PATH = '/encounters/new';

export function encounterEditPath(id: number): string {
  return `/encounters/${id}/edit`;
}

export function encounterRunPath(id: number): string {
  return `/encounters/${id}/run`;
}
