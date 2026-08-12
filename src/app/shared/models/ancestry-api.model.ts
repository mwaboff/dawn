import { ModifierResponse } from '../../features/create-character/models/character-sheet-api.model';

export interface AncestryCostTag {
  id: number;
  label: string;
  category: string;
}

export interface AncestryFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: AncestryCostTag[];
  modifiers?: ModifierResponse[];
}

export interface AncestryCardResponse {
  id: number;
  name: string;
  description: string;
  cardType: 'ANCESTRY';
  expansionId: number;
  isOfficial: boolean;
  isMixed?: boolean;
  featureIds: number[];
  features: AncestryFeatureResponse[];
  costTagIds: number[];
  costTags: AncestryCostTag[];
  createdAt: string;
  lastModifiedAt: string;
  /** Whether this ancestry is SRD-licensed content, freely usable without owning the sourcebook
   * it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this ancestry because the viewer lacks access to its
   * expansion (SRD vs. paid-expansion content gating); every other field except `id` may then be
   * omitted. See `ancestry.mapper.ts`'s `mapAncestryResponseToCardData`. */
  restricted?: boolean;
  /** The paid book this ancestry belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}

export interface CreateMixedAncestryRequest {
  name: string;
  description: string;
  expansionId: number;
  featureIds: [number, number];
}
