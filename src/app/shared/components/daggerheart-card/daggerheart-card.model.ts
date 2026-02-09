export type CardType =
  | 'class'
  | 'subclass'
  | 'heritage'
  | 'community'
  | 'ancestry'
  | 'domain';

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
}
