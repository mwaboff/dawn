export type DomainCardType = 'SPELL' | 'GRIMOIRE' | 'ABILITY' | 'TRANSFORMATION' | 'WILD';

export interface DomainCardCostTag {
  id: number;
  label: string;
  category: string;
}

export interface DomainCardModifierResponse {
  id: number;
  target: string;
  operation: string;
  value: number;
}

export interface DomainCardFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: DomainCardCostTag[];
  modifierIds: number[];
  modifiers: DomainCardModifierResponse[];
}

export interface DomainCardResponse {
  id: number;
  name: string;
  description: string;
  cardType: 'DOMAIN';
  expansionId: number;
  isOfficial: boolean;
  featureIds: number[];
  features: DomainCardFeatureResponse[];
  costTagIds: number[];
  costTags: DomainCardCostTag[];
  associatedDomainId: number;
  associatedDomain?: {
    id: number;
    name: string;
    description: string;
    expansionId: number;
  };
  level: number;
  recallCost: number;
  type: DomainCardType;
  createdAt: string;
  lastModifiedAt: string;
  /** Whether this domain card is SRD-licensed content, freely usable without owning the
   * sourcebook it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this domain card because the viewer lacks access to
   * its expansion (SRD vs. paid-expansion content gating); every other field except `id` may
   * then be omitted. See `domain-card.mapper.ts`'s `mapDomainCardResponseToCardData`. */
  restricted?: boolean;
  /** The paid book this domain card belongs to, present only alongside `restricted: true` and
   * only when the backend knows it. */
  expansionName?: string;
}

export interface DomainResponse {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  expansionId?: number;
  expansion?: {
    id: number;
    name: string;
    isPublished: boolean;
  };
  /** Whether this domain is SRD-licensed content, freely usable without owning the sourcebook
   * it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this domain because the viewer lacks access to its
   * expansion (SRD vs. paid-expansion content gating); every other field except `id` may then be
   * omitted. See `domain.mapper.ts`'s `mapDomainToCardData`. */
  restricted?: boolean;
  /** The paid book this domain belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}
