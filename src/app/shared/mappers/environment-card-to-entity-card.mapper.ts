import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { EntityCardData } from '../components/entity-card/entity-card.model';
import { cardDataToEntityCard } from './card-data-to-entity-card.mapper';

/**
 * Layers the one piece of environment-specific knowledge `cardDataToEntityCard` deliberately
 * leaves unset (`headline`, "left unset. Nothing on generic CardData maps to them without
 * per-type knowledge... a caller with a compact/eyebrow/stat-line need can layer its own thin
 * mapper over this one's output" -- see that file's own doc comment) on top of its generic output,
 * for the encounter manager's compact-then-expand environment rows.
 *
 * `headline` reuses `card.tags[0]` verbatim rather than recomputing it: `environment.mapper.ts`'s
 * `mapEnvironmentToCardData` already built that string as `formatDifficulty(response)`
 * ("Difficulty 15" or the verbatim "Difficulty: Special (...)" callout) and put it first in
 * `tags`, which `cardDataToEntityCard` already turns into `badges[0]`. Compact renders only the
 * header (`headline`); normal/expanded render only the body (`badges`) -- the two are never on
 * screen at once, so reusing the same string in both is not the redundancy the same fact shown
 * twice in two *simultaneously visible* slots would be (see `weaponToEntity`'s own headline/stats
 * duplication for the established precedent this follows).
 */
export function environmentCardToEntityCard(card: CardData): EntityCardData {
  const base = cardDataToEntityCard(card);
  return { ...base, headline: card.tags?.[0] };
}
