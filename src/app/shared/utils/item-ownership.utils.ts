/**
 * Whether the viewer may edit this piece of gear. Only the author of a piece of homebrew may:
 * `createdByUserId` is null on official content and absent when the sheet response didn't expand
 * the item, so the equality check covers both without a separate guard.
 *
 * Shared rather than living under `character-sheet/utils/` -- the same question is asked by the
 * inventory (owned gear) and by the codex/reference catalogue (search results, which carry the
 * same `createdByUserId` through `CardData.metadata`), and a second copy of this equality check
 * is a rules bug waiting to diverge (see dawn/CLAUDE.md on domain rules living once).
 */
export function canEditItem(item: { createdByUserId?: number | null }, viewerId: number | null): boolean {
  return viewerId !== null && item.createdByUserId === viewerId;
}
