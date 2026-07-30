export type FeatureType =
  | 'HOPE'
  | 'ANCESTRY'
  | 'CLASS'
  | 'COMMUNITY'
  | 'DOMAIN'
  | 'ITEM'
  | 'SUBCLASS'
  | 'OTHER'
  | 'TRANSFORMATION'
  | 'ENVIRONMENT'
  | 'CAMPAIGN_FRAME';

export const FEATURE_TYPE_LABELS: Record<FeatureType, string> = {
  HOPE: 'Hope',
  ANCESTRY: 'Ancestry',
  CLASS: 'Class',
  COMMUNITY: 'Community',
  DOMAIN: 'Domain',
  ITEM: 'Item',
  SUBCLASS: 'Subclass',
  OTHER: 'Other',
  TRANSFORMATION: 'Transformation',
  ENVIRONMENT: 'Environment',
  CAMPAIGN_FRAME: 'Campaign Frame',
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
  transformationCard: 'TRANSFORMATION',
  environment: 'ENVIRONMENT',
  // No dedicated FeatureType value for these three; OTHER is correct.
  martialStance: 'OTHER',
  beastform: 'OTHER',
  condition: 'OTHER',
  // 'expansion' intentionally omitted: an Expansion has no attachable features.
};

export function defaultFeatureTypeForCard(cardType: string): FeatureType {
  return DEFAULT_FEATURE_TYPE_FOR_CARD[cardType] ?? 'OTHER';
}
