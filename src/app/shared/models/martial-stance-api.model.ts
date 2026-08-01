export interface MartialStanceFeatureResponse {
  id: number;
  name: string;
  description?: string;
}

/**
 * Response DTO for MartialStance entities -- Hope & Fear's "Stance Fighter" modal combat states
 * (16 stances, 4 per tier). Mirrors `com.aboff.core.model.dto.dh.response.MartialStanceResponse`.
 *
 * A printed stance is a name plus one effect sentence, so unlike other card types there is no
 * inline feature substructure expected on official content -- `featureIds`/`features` exist for
 * parity with the shared card pattern and homebrew use, but stay empty for official stances.
 */
export interface MartialStanceResponse {
  id: number;
  name: string;
  /** Always included. */
  expansionId: number;
  /** Included only when `?expand=expansion`. */
  expansion?: { id: number; name: string; isPublished: boolean };
  /** The tier level of the martial stance (1-4). */
  tier?: number;
  /** Whether this martial stance is from official game content. */
  isOfficial?: boolean;
  /** Effect text of the martial stance. */
  description?: string;
  /** Always included when present. */
  featureIds?: number[];
  /** Included only when `?expand=features`. */
  features?: MartialStanceFeatureResponse[];
  /** ID of the original martial stance if this is a custom copy (absent if original). */
  originalMartialStanceId?: number;
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
}

export interface MartialStanceFilters {
  page?: number;
  size?: number;
  tier?: number;
  isOfficial?: boolean;
  expansionId?: number;
}
