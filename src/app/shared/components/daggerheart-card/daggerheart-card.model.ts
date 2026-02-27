export type CardType =
  | 'class'
  | 'subclass'
  | 'heritage'
  | 'community'
  | 'ancestry'
  | 'domain';

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  class: 'Class',
  subclass: 'Subclass',
  heritage: 'Heritage',
  community: 'Community',
  ancestry: 'Ancestry',
  domain: 'Domain',
};

export interface CardFeature {
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
