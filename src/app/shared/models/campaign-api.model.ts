import { UserResponse } from '../../core/models/auth.model';

export interface CampaignResponse {
  id: number;
  name: string;
  description?: string;
  joinCode?: string;
  isEnded: boolean;
  creatorId: number;
  creator?: UserResponse;
  playerIds: number[];
  createdAt: string;
  lastModifiedAt: string;
}
