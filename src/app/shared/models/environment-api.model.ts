export type EnvironmentType = 'EXPLORATION' | 'TRAVERSAL' | 'EVENT' | 'SOCIAL';

export interface EnvironmentFeatureResponse {
  id: number;
  name: string;
  description?: string;
}

/**
 * Response DTO for Environment entities -- GM-facing scene stat blocks (never
 * selected or equipped by a player). Exactly one of `difficulty` or
 * `difficultySpecial` is populated: most environments print a plain numeric
 * Difficulty, but at least one core-book environment prints
 * `Difficulty: Special (see "Relative Strength")` instead, which is preserved
 * verbatim in `difficultySpecial` rather than discarded.
 */
export interface EnvironmentResponse {
  id: number;
  name: string;
  tier: number;
  environmentType: EnvironmentType;
  description?: string;
  impulses?: string;
  difficulty?: number;
  difficultySpecial?: string;
  potentialAdversaries?: string;
  isOfficial: boolean;
  isPublic: boolean;
  expansionId: number;
  expansion?: { id: number; name: string; isPublished: boolean };
  creatorId?: number;
  featureIds?: number[];
  features?: EnvironmentFeatureResponse[];
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
  /** Whether this environment is SRD-licensed content, freely usable without owning the
   * sourcebook it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this environment because the viewer lacks access to
   * its expansion (SRD vs. paid-expansion content gating); every other field except `id` may
   * then be omitted. See `environment.mapper.ts`'s `mapEnvironmentToCardData`. */
  restricted?: boolean;
  /** The paid book this environment belongs to, present only alongside `restricted: true` and
   * only when the backend knows it. */
  expansionName?: string;
}

export interface EnvironmentFilters {
  page?: number;
  size?: number;
  tier?: number;
  environmentType?: EnvironmentType | string;
  isOfficial?: boolean;
  expansionId?: number;
}
