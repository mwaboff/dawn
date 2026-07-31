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
  | 'CAMPAIGN_FRAME'
  | 'BEASTFORM'
  | 'MARTIAL_STANCE'
  | 'ADVERSARY';

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
  BEASTFORM: 'Beastform',
  MARTIAL_STANCE: 'Martial Stance',
  ADVERSARY: 'Adversary',
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
  martialStance: 'MARTIAL_STANCE',
  beastform: 'BEASTFORM',
  // No dedicated FeatureType value for conditions; OTHER is correct. The backend
  // Condition entity has no features relationship at all (there is no
  // condition_features table), so no CONDITION value exists to map to.
  condition: 'OTHER',
  // 'expansion' intentionally omitted: an Expansion has no attachable features.
  // 'adversary' intentionally omitted: adversaries are not an admin card-edit type,
  // so ADVERSARY is a label-only FeatureType here.
};

export function defaultFeatureTypeForCard(cardType: string): FeatureType {
  return DEFAULT_FEATURE_TYPE_FOR_CARD[cardType] ?? 'OTHER';
}
