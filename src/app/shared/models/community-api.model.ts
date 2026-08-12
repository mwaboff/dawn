import { ModifierResponse } from '../../features/create-character/models/character-sheet-api.model';

export interface CommunityCostTag {
  id: number;
  label: string;
  category: string;
}

export interface CommunityFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: CommunityCostTag[];
  modifiers?: ModifierResponse[];
}

export interface CommunityCardResponse {
  id: number;
  name: string;
  description: string;
  cardType: 'COMMUNITY';
  expansionId: number;
  isOfficial: boolean;
  featureIds: number[];
  features: CommunityFeatureResponse[];
  costTagIds: number[];
  costTags: CommunityCostTag[];
  createdAt: string;
  lastModifiedAt: string;
  /** Whether this community is SRD-licensed content, freely usable without owning the
   * sourcebook it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this community because the viewer lacks access to
   * its expansion (SRD vs. paid-expansion content gating); every other field except `id` may
   * then be omitted. See `community.mapper.ts`'s `mapCommunityResponseToCardData`. */
  restricted?: boolean;
  /** The paid book this community belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}
