import { UserResponse } from '../../core/models/auth.model';

export interface CampaignResponse {
  id: number;
  name: string;
  description?: string;
  creatorId: number;
  creator?: UserResponse;
  gameMasterIds: number[];
  gameMasters?: UserResponse[];
  playerIds: number[];
  players?: UserResponse[];
  pendingCharacterSheetIds: number[];
  pendingCharacterSheets?: CampaignCharacterSheet[];
  playerCharacterIds: number[];
  playerCharacters?: CampaignCharacterSheet[];
  nonPlayerCharacterIds: number[];
  nonPlayerCharacters?: CampaignCharacterSheet[];
  characterSummaries?: CampaignCharacterSummary[];
  /** Shared Fear pool, 0-12. Visible to every campaign member -- Fear is public at the table. */
  fear: number;
  /**
   * GM-only session notes. The backend omits this key entirely for non-GMs, so absent means
   * *either* empty *or* not permitted. Never infer permission from its presence.
   */
  gmNotes?: string;
  isEnded: boolean;
  endedAt?: string;
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
}

export interface CampaignCharacterSheet {
  id: number;
  name: string;
  pronouns?: string;
  level: number;
  ownerId: number;
  ownerUsername?: string;
  subclassCards?: { associatedClassName?: string }[];
  createdAt: string;
  lastModifiedAt: string;
}


export interface CampaignCharacterSummary {
  id: number;
  name: string;
  level: number;
  ownerId: number;
  ownerUsername: string;
  ancestryNames: string[];
  subclassNames: string[];
  classNames: string[];
  /** Whether the GM has revealed the Transformation panel on this character's sheet. */
  transformationEnabled: boolean;
  /** The transformation assigned to this character; kept even while `transformationEnabled` is false. */
  transformationCardId?: number;
  transformationCardName?: string;
  /**
   * Whether a GM has granted companion creation to this character outside the Beastbound feature.
   * Turning this off only stops *new* companions from being created -- it never hides or removes a
   * companion the character already has (Companions plan §3.4).
   */
  companionsEnabled: boolean;
}

/**
 * Body of `PUT /dh/campaigns/{campaignId}/character-sheets/{sheetId}/transformation`.
 * `clearTransformationCard` wins over `transformationCardId` when both are sent.
 */
export interface UpdateCharacterTransformationRequest {
  enabled: boolean;
  transformationCardId?: number;
  clearTransformationCard?: boolean;
}

/**
 * The transformation endpoint returns the full character-sheet response, but `shared/` may not
 * import from `features/` (see CLAUDE.md), so this is typed as the narrow slice the campaign page
 * actually consumes rather than re-declaring the sheet contract here.
 */
export interface CharacterTransformationStateResponse {
  id: number;
  transformationEnabled: boolean;
  transformationCardId?: number;
}

/**
 * Body of `PUT /dh/campaigns/{campaignId}/character-sheets/{sheetId}/companions`.
 *
 * This endpoint is part of the core repo's Companions GM-flag work package, which had not shipped
 * when this was written -- built against the documented contract (Companions plan §6.7/§4)
 * rather than a live endpoint. Re-verify field names against the backend once it lands.
 */
export interface UpdateCharacterCompanionsEnabledRequest {
  enabled: boolean;
}

/**
 * The companions-enabled endpoint is expected to return the full character-sheet response, but
 * `shared/` may not import from `features/` (see CLAUDE.md), so this is typed as the narrow slice
 * the campaign page actually consumes rather than re-declaring the sheet contract here -- mirrors
 * {@link CharacterTransformationStateResponse}.
 */
export interface CharacterCompanionsEnabledStateResponse {
  id: number;
  companionsEnabled: boolean;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  gameMasterIds?: number[];
  playerIds?: number[];
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
}

export interface CampaignInviteResponse {
  id: number;
  campaignId: number;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface JoinCampaignResponse {
  campaignId: number;
  campaignName: string;
  message: string;
}
