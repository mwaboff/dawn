/**
 * Path constants for the `/items` builder, so the router config, the navbar link, and every
 * `router.navigate`/`routerLink` call site build the same strings instead of retyping them.
 */

/** The three tables a custom item can live in. Each has its own ids, endpoints, and fields. */
export type ItemKind = 'weapon' | 'armor' | 'loot';

export const ITEM_KINDS: readonly ItemKind[] = ['weapon', 'armor', 'loot'] as const;

export const ITEMS_NEW_PATH = '/items/new';

/** Narrows a `:type` route segment, which is whatever the user put in the address bar. */
export function isItemKind(value: string | null): value is ItemKind {
  return value !== null && (ITEM_KINDS as readonly string[]).includes(value);
}

/**
 * The kind is part of the URL because ids are only unique *within* a table -- weapon 7, armor 7,
 * and loot 7 all exist, so `/items/7/edit` could not say which one to load.
 */
export function itemEditPath(kind: ItemKind, id: number): string {
  return `/items/${kind}/${id}/edit`;
}
