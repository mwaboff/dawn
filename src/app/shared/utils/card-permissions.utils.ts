import { CardData, CardType } from '../components/daggerheart-card/daggerheart-card.model';

const EDITABLE_ITEM_TYPES: ReadonlySet<CardType> = new Set(['weapon', 'armor', 'loot']);

/**
 * Client-side UX check only — mirrors the backend's ownership rule so the edit
 * affordance appears where it will actually succeed. The server remains the
 * authorization boundary.
 */
export function canEditCustomItem(
  card: CardData,
  currentUserId: number | null | undefined,
  isPrivileged: boolean,
): boolean {
  if (!EDITABLE_ITEM_TYPES.has(card.cardType)) return false;

  const metadata = card.metadata;
  if (!metadata || metadata['isOfficial'] !== false) return false;

  if (isPrivileged) return true;
  return currentUserId != null && currentUserId === metadata['creatorId'];
}
