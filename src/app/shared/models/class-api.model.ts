export interface ClassCostTag {
  label: string;
  value: number;
}

export interface ClassFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  costTags?: ClassCostTag[];
}

export interface ClassResponse {
  id: number;
  name: string;
  description: string;
  startingEvasion: number;
  startingHitPoints: number;
  hopeFeatures: ClassFeatureResponse[];
  classFeatures: ClassFeatureResponse[];
  expansionId?: number;
  isOfficial: boolean;
  isPublic: boolean;
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
  /** Whether this class is SRD-licensed content, freely usable without owning the sourcebook
   * it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this class because the viewer lacks access to its
   * expansion (SRD vs. paid-expansion content gating); every other field except `id` may then be
   * omitted. See `class.mapper.ts`'s `mapClassResponseToCardData`. */
  restricted?: boolean;
  /** The paid book this class belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}

export type { PaginatedResponse } from './api.model';
