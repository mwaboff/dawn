import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../components/adversary-card/adversary-card.model';

export type SearchableEntityType =
  | 'DOMAIN'
  | 'CLASS'
  | 'FEATURE'
  | 'ANCESTRY_CARD'
  | 'COMMUNITY_CARD'
  | 'SUBCLASS_CARD'
  | 'DOMAIN_CARD'
  | 'WEAPON'
  | 'ARMOR'
  | 'LOOT'
  | 'ADVERSARY'
  | 'ENVIRONMENT'
  | 'COMPANION'
  | 'BEASTFORM'
  | 'ENCOUNTER'
  | 'EXPANSION'
  | 'SUBCLASS_PATH'
  | 'QUESTION'
  | 'CARD_COST_TAG';

export interface SearchParams {
  q: string;
  types?: SearchableEntityType[];
  tier?: number;
  level?: number;
  expansionId?: number;
  isOfficial?: boolean;
  cardType?: string;
  featureType?: string;
  adversaryType?: string;
  domainCardType?: string;
  associatedDomainId?: number;
  associatedClassId?: number;
  trait?: string;
  range?: string;
  burden?: string;
  isConsumable?: boolean;
  environmentType?: string;
  page?: number;
  size?: number;
}

export interface SearchResultResponse {
  type: SearchableEntityType;
  id: number;
  name: string;
  relevanceScore: number | null;
  expandedEntity: unknown;
}

export interface SearchResponse {
  results: SearchResultResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  query: string;
}

export interface SearchFilters {
  tier?: number;
  level?: number;
  expansionId?: number;
  isOfficial?: boolean;
  cardType?: string;
  featureType?: string;
  adversaryType?: string;
  domainCardType?: string;
  associatedDomainId?: number;
  associatedClassId?: number;
  trait?: string;
  range?: string;
  burden?: string;
  isConsumable?: boolean;
  environmentType?: string;
}

export interface BrowseResult {
  cards: CardData[];
  adversaries: AdversaryData[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

export const typeLabels: Partial<Record<SearchableEntityType, string>> = {
  WEAPON: 'Weapons',
  ARMOR: 'Armor',
  LOOT: 'Loot',
  ADVERSARY: 'Adversaries',
  ENVIRONMENT: 'Environments',
  FEATURE: 'Features',
  CLASS: 'Classes',
  SUBCLASS_CARD: 'Subclasses',
  ANCESTRY_CARD: 'Ancestries',
  COMMUNITY_CARD: 'Communities',
  DOMAIN_CARD: 'Domain Cards',
  DOMAIN: 'Domains',
  COMPANION: 'Companions',
  SUBCLASS_PATH: 'Subclass Paths',
  EXPANSION: 'Expansions',
  BEASTFORM: 'Beastforms',
  ENCOUNTER: 'Encounters',
  QUESTION: 'Questions',
  CARD_COST_TAG: 'Cost Tags',
};

export const typeGlyphs: Partial<Record<SearchableEntityType, string>> = {
  WEAPON: '⚔',
  ARMOR: '⛨',
  LOOT: '◈',
  ADVERSARY: '☗',
  ENVIRONMENT: '⛰',
  FEATURE: '✦',
  CLASS: '⚜',
  SUBCLASS_CARD: '✺',
  ANCESTRY_CARD: '❀',
  COMMUNITY_CARD: '⧫',
  DOMAIN_CARD: '✧',
  DOMAIN: '⬢',
  COMPANION: '❦',
};

/**
 * The ordered list of types users can browse or filter by in the UI.
 * FEATURE is intentionally excluded — the backend may return feature results
 * in search responses, but features have no standalone browse endpoint and
 * no card design, so they are not surfaced as a browsable category.
 */
export const BROWSABLE_TYPES: SearchableEntityType[] = [
  'DOMAIN',
  'CLASS',
  'SUBCLASS_CARD',
  'ANCESTRY_CARD',
  'COMMUNITY_CARD',
  'DOMAIN_CARD',
  'WEAPON',
  'ARMOR',
  'LOOT',
  'ADVERSARY',
  'ENVIRONMENT',
  'COMPANION',
];

/**
 * Types with zero backend search-index registration -- no `SearchableEntityType` enum
 * member, no `SearchFieldMapping`, no `@SearchIndexed`, no backfill. Sending one of these
 * in `/api/search`'s `types=` param fails Spring's enum conversion and surfaces as an
 * HTTP 400, not an empty result set.
 *
 * COMPANION is user-owned per-character data (a `Companion` cascades from `CharacterSheet`,
 * not catalogue content), so it is deliberately never indexed into the shared search table.
 * It remains in `BROWSABLE_TYPES` and `SUPPORTED_BROWSE_TYPES` -- browsing companions via
 * their dedicated `/api/dh/companions` endpoint works fine -- but callers must never route
 * it into `SearchService`. See `isSearchableType()`.
 */
export const SEARCH_UNSUPPORTED_TYPES: readonly SearchableEntityType[] = ['COMPANION'];

/** Type guard: true unless `type` is in `SEARCH_UNSUPPORTED_TYPES`. */
export function isSearchableType(type: SearchableEntityType): boolean {
  return !SEARCH_UNSUPPORTED_TYPES.includes(type);
}
