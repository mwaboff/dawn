import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

/** A tier heading and the stances printed under it, as they appear on the Martial Stances sheet. */
export interface StanceTierGroup {
  tier: number;
  stances: CardData[];
}

/** Reads a martial stance's printed tier from its card metadata. */
export function stanceTier(card: CardData): number {
  return (card.metadata?.['tier'] as number | undefined) ?? 0;
}

/**
 * Groups martial stances by tier, ascending, with each tier's stances sorted by name — the order
 * the printed Martial Stances tracking sheet uses.
 *
 * Shared by the creation selector and the level-up step: both render the same tier-grouped list,
 * and the grouping/sort order is a single domain rule that must not diverge between them.
 */
export function groupStancesByTier(cards: CardData[]): StanceTierGroup[] {
  const byTier = new Map<number, CardData[]>();
  for (const card of cards) {
    const tier = stanceTier(card);
    const group = byTier.get(tier);
    if (group) {
      group.push(card);
    } else {
      byTier.set(tier, [card]);
    }
  }
  return [...byTier.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tier, stances]) => ({ tier, stances: [...stances].sort((a, b) => a.name.localeCompare(b.name)) }));
}
