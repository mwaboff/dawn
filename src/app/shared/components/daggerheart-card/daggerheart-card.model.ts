/**
 * Adding a member here is only half the job: give it a matching `[data-card-type='<name>']` rule
 * in shared/styles/card-accents.css and a `--color-card-<name>` token in styles.css. A type with
 * no rule compiles fine and renders as a white card with no accent, which has shipped twice.
 */
export type CardType =
  | 'class'
  | 'subclass'
  | 'heritage'
  | 'community'
  | 'ancestry'
  | 'domain'
  | 'domainCard'
  | 'weapon'
  | 'armor'
  | 'loot'
  | 'companion'
  | 'subclassPath'
  | 'feature'
  | 'environment'
  | 'beastform'
  | 'transformationCard'
  | 'martialStance'
  | 'adversary';

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  class: 'Class',
  subclass: 'Subclass',
  heritage: 'Heritage',
  community: 'Community',
  ancestry: 'Ancestry',
  domain: 'Domain',
  domainCard: 'Domain Card',
  weapon: 'Weapon',
  armor: 'Armor',
  loot: 'Loot',
  companion: 'Companion',
  subclassPath: 'Subclass Path',
  feature: 'Feature',
  environment: 'Environment',
  beastform: 'Beastform',
  transformationCard: 'Transformation Card',
  martialStance: 'Martial Stance',
  adversary: 'Adversary',
};

export interface CardFeature {
  id?: number;
  name: string;
  description: string;
  subtitle?: string;
  tags?: string[];
}

export interface CardData {
  id: number;
  name: string;
  description: string;
  cardType: CardType;
  subtitle?: string;
  subtitleSecondary?: string;
  tags?: string[];
  features?: CardFeature[];
  metadata?: Record<string, unknown>;
}
