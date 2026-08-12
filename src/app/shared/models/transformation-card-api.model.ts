export interface TransformationCardFeatureResponse {
  id: number;
  name: string;
  description?: string;
}

/**
 * A single one of a Transformation Card's 6 printed questions. Mirrors
 * `com.aboff.core.model.dto.dh.response.QuestionResponse`, scoped to the fields the card view
 * needs -- `questionType` is always `TRANSFORMATION` for questions reached through this DTO, so
 * it is omitted here rather than re-declared as a redundant literal.
 */
export interface TransformationCardQuestionResponse {
  id: number;
  questionText: string;
}

/**
 * Response DTO for TransformationCard entities -- Hope & Fear's narrative identity cards
 * (Demigod, Ghost, Reanimated, Shapeshifter, Vampire, Werewolf). Mirrors
 * `com.aboff.core.model.dto.dh.response.TransformationCardResponse`.
 *
 * No stat block: unlike Beastform/Environment, a Transformation Card has no tier, traits,
 * evasion, or thresholds -- every number lives inside the feature/question prose.
 */
export interface TransformationCardResponse {
  id: number;
  name: string;
  /** Detailed description of the transformation card and its effects. */
  description?: string;
  /** Always included. */
  expansionId: number;
  /** Included only when `?expand=expansion`. */
  expansion?: { id: number; name: string; isPublished: boolean };
  /** Always included. Every printed card has exactly 2. */
  featureIds?: number[];
  /** Included only when `?expand=features`. */
  features?: TransformationCardFeatureResponse[];
  /** Always included. Every printed card has exactly 6. */
  questionIds?: number[];
  /** Included only when `?expand=questions`. */
  questions?: TransformationCardQuestionResponse[];
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
  /** Whether this card is SRD-licensed content, freely usable without owning the sourcebook it
   * belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this card because the viewer lacks access to its
   * expansion (SRD vs. paid-expansion content gating); every other field except `id` may then be
   * omitted. See `transformation-card.mapper.ts`'s `mapTransformationCardToCardData`. */
  restricted?: boolean;
  /** The paid book this card belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}

export interface TransformationCardFilters {
  page?: number;
  size?: number;
  expansionId?: number;
}
