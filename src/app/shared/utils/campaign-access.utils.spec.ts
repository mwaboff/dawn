import { describe, expect, it } from 'vitest';

import { CampaignResponse } from '../models/campaign-api.model';
import { isCampaignGameMaster } from './campaign-access.utils';

function campaign(gameMasterIds: number[]): CampaignResponse {
  return {
    id: 1,
    name: 'The Hollow Road',
    creatorId: 1,
    gameMasterIds,
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    fear: 0,
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
  } as CampaignResponse;
}

describe('isCampaignGameMaster', () => {
  it('is true when the user id is in gameMasterIds', () => {
    expect(isCampaignGameMaster(campaign([5, 9]), 9)).toBe(true);
  });

  it('is false when the user id is not in gameMasterIds', () => {
    expect(isCampaignGameMaster(campaign([5, 9]), 1)).toBe(false);
  });

  it('is false when the campaign is null', () => {
    expect(isCampaignGameMaster(null, 9)).toBe(false);
  });

  it('is false when the campaign is undefined', () => {
    expect(isCampaignGameMaster(undefined, 9)).toBe(false);
  });

  it('is false when the user id is null', () => {
    expect(isCampaignGameMaster(campaign([5, 9]), null)).toBe(false);
  });

  it('is false when the user id is undefined', () => {
    expect(isCampaignGameMaster(campaign([5, 9]), undefined)).toBe(false);
  });
});
