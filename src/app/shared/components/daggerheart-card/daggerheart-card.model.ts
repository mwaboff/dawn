export type CardType =
  | 'class'
  | 'subclass'
  | 'heritage'
  | 'community'
  | 'ancestry'
  | 'domain'
  | 'weapon'
  | 'armor'
  | 'loot'
  | 'companion'
  | 'subclassPath';

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  class: 'Class',
  subclass: 'Subclass',
  heritage: 'Heritage',
  community: 'Community',
  ancestry: 'Ancestry',
  domain: 'Domain',
  weapon: 'Weapon',
  armor: 'Armor',
  loot: 'Loot',
  companion: 'Companion',
  subclassPath: 'Subclass Path',
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
  tags?: string[];
  features?: CardFeature[];
  metadata?: Record<string, unknown>;
}
