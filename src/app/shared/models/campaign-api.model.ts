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
