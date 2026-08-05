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
  | 'BEASTFORM'
  | 'ENCOUNTER'
  | 'EXPANSION'
  | 'SUBCLASS_PATH'
  | 'QUESTION'
  | 'CARD_COST_TAG'
  | 'TRANSFORMATION_CARD'
  | 'MARTIAL_STANCE'
  | 'CONDITION';

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
  SUBCLASS_PATH: 'Subclass Paths',
  EXPANSION: 'Expansions',
  BEASTFORM: 'Beastforms',
  ENCOUNTER: 'Encounters',
  QUESTION: 'Questions',
  CARD_COST_TAG: 'Cost Tags',
  TRANSFORMATION_CARD: 'Transformation Cards',
  MARTIAL_STANCE: 'Martial Stances',
  CONDITION: 'Conditions',
};

export const typeGlyphs: Partial<Record<SearchableEntityType, string>> = {
  WEAPON: '⚔',
  ARMOR: '⛨',
  LOOT: '◈',
  ADVERSARY: '☗',
  ENVIRONMENT: '⛰',
  BEASTFORM: '☾',
  FEATURE: '✦',
  CLASS: '⚜',
  SUBCLASS_CARD: '✺',
  ANCESTRY_CARD: '❀',
  COMMUNITY_CARD: '⧫',
  DOMAIN_CARD: '✧',
  DOMAIN: '⬢',
  TRANSFORMATION_CARD: '☍',
  MARTIAL_STANCE: '☯',
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
  'BEASTFORM',
  'TRANSFORMATION_CARD',
  'MARTIAL_STANCE',
];
