import { CardSummary, SubclassCardSummary } from '../../character-sheet/models/character-sheet-view.model';

/**
 * The order the combined "Class & Subclass" group renders in: every class first, then the subclass
 * cards grouped under the class that granted them. Lives here rather than inline in the beta sheet
 * because it is a domain rule (a multiclassed character's card order) and the sheet template must
 * stay a projection of it -- see .agents/rules on domain rules living in one tested util.
 */
export type ClassGroupEntry =
  | { readonly kind: 'class'; readonly card: CardSummary }
  | { readonly kind: 'subclass'; readonly card: SubclassCardSummary };

/** `SubclassCardSummary.level` arrives as the server's `SubclassLevel` enum name, upper case. */
const SUBCLASS_LEVEL_ORDER = ['FOUNDATION', 'SPECIALIZATION', 'MASTERY'];

function levelRank(level: string | undefined): number {
  const rank = SUBCLASS_LEVEL_ORDER.indexOf((level ?? '').toUpperCase());
  return rank < 0 ? SUBCLASS_LEVEL_ORDER.length : rank;
}

function byLevel(cards: readonly SubclassCardSummary[]): SubclassCardSummary[] {
  return [...cards].sort((a, b) => levelRank(a.level) - levelRank(b.level));
}

/**
 * Orders class cards followed by their subclass cards for a single combined card group.
 *
 * `classCards` order is preserved exactly -- the server emits classes in acquisition order
 * (original class first, then multiclasses as they were taken), which no client-side sort can
 * reconstruct. Subclass cards follow that same class order, Foundation before Specialization
 * before Mastery within each class.
 *
 * A subclass whose `associatedClassId` matches no class card (a partially-expanded response, say)
 * is never dropped: it lands after every grouped card, level-ordered like the rest. That bucket
 * is a degraded path with no meaningful order to preserve -- the server holds subclass cards in a
 * `HashSet`, so arrival order is not guaranteed and only breaks ties between equal levels.
 */
export function orderClassGroupCards(
  classCards: readonly CardSummary[],
  subclassCards: readonly SubclassCardSummary[],
): ClassGroupEntry[] {
  const classIds = classCards.map(card => card.id);
  const grouped: SubclassCardSummary[][] = classIds.map(() => []);
  const unmatched: SubclassCardSummary[] = [];

  for (const card of subclassCards) {
    const index = card.associatedClassId === undefined ? -1 : classIds.indexOf(card.associatedClassId);
    if (index < 0) unmatched.push(card);
    else grouped[index].push(card);
  }

  const orderedSubclasses = [...grouped.flatMap(byLevel), ...byLevel(unmatched)];

  return [
    ...classCards.map((card): ClassGroupEntry => ({ kind: 'class', card })),
    ...orderedSubclasses.map((card): ClassGroupEntry => ({ kind: 'subclass', card })),
  ];
}
