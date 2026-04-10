import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../../../shared/components/adversary-card/adversary-card.model';

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
  expansionId?: number;
  isOfficial?: boolean;
  cardType?: string;
  featureType?: string;
  adversaryType?: string;
  domainCardType?: string;
  associatedDomainId?: number;
  trait?: string;
  range?: string;
  burden?: string;
  isConsumable?: boolean;
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
  expansionId?: number;
  isOfficial?: boolean;
  cardType?: string;
  featureType?: string;
  adversaryType?: string;
  domainCardType?: string;
  associatedDomainId?: number;
  trait?: string;
  range?: string;
  burden?: string;
  isConsumable?: boolean;
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
  FEATURE: 'Features',
  CLASS: 'Classes',
  SUBCLASS_CARD: 'Subclass Cards',
  ANCESTRY_CARD: 'Ancestry Cards',
  COMMUNITY_CARD: 'Community Cards',
  DOMAIN_CARD: 'Domain Cards',
  DOMAIN: 'Domains',
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
  FEATURE: '✦',
  CLASS: '⚜',
  SUBCLASS_CARD: '✺',
  ANCESTRY_CARD: '❀',
  COMMUNITY_CARD: '⧫',
  DOMAIN_CARD: '✧',
  DOMAIN: '⬢',
};
