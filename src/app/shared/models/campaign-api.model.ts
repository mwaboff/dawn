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
  pendingCharacterSheets?: CharacterSheetSummary[];
  playerCharacterIds: number[];
  playerCharacters?: CharacterSheetSummary[];
  nonPlayerCharacterIds: number[];
  nonPlayerCharacters?: CharacterSheetSummary[];
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
}

export interface CharacterSheetSummary {
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

export interface InviteResponse {
  token: string;
  campaignId: number;
  expiresAt: string;
}
