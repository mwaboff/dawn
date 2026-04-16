export type FeatureType =
  | 'HOPE'
  | 'ANCESTRY'
  | 'CLASS'
  | 'COMMUNITY'
  | 'DOMAIN'
  | 'ITEM'
  | 'SUBCLASS'
  | 'OTHER';

export const FEATURE_TYPE_LABELS: Record<FeatureType, string> = {
  HOPE: 'Hope',
  ANCESTRY: 'Ancestry',
  CLASS: 'Class',
  COMMUNITY: 'Community',
  DOMAIN: 'Domain',
  ITEM: 'Item',
  SUBCLASS: 'Subclass',
  OTHER: 'Other',
};

export const DEFAULT_FEATURE_TYPE_FOR_CARD: Record<string, FeatureType> = {
  domainCard: 'DOMAIN',
  ancestry: 'ANCESTRY',
  community: 'COMMUNITY',
  subclass: 'SUBCLASS',
  'class': 'CLASS',
  weapon: 'ITEM',
  armor: 'ITEM',
  loot: 'ITEM',
};

export function defaultFeatureTypeForCard(cardType: string): FeatureType {
  return DEFAULT_FEATURE_TYPE_FOR_CARD[cardType] ?? 'OTHER';
}
