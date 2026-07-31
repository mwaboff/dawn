import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CampaignResponse } from '../../../shared/models/campaign-api.model';
import { GmScreenContext } from './gm-screen-context.service';

function campaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 7,
    name: 'The Hollow Road',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    fear: 3,
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

describe('GmScreenContext', () => {
  let context: GmScreenContext;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), GmScreenContext],
    });
    context = TestBed.inject(GmScreenContext);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('seeds campaign, id, fear and notes from setCampaign', () => {
    context.setCampaign(campaign({ gmNotes: 'the door is a mimic' }));

    expect(context.campaignId()).toBe(7);
    expect(context.fear()).toBe(3);
    expect(context.gmNotes()).toBe('the door is a mimic');
  });

  it('treats absent gmNotes as an empty string', () => {
    context.setCampaign(campaign());

    expect(context.gmNotes()).toBe('');
  });

  it('leaves local fear and notes untouched when patching the campaign', () => {
    context.setCampaign(campaign());
    context.gmNotes.set('typed since the save started');

    context.patchCampaign(campaign({ fear: 9, gmNotes: '' }));

    expect(context.campaign()?.fear).toBe(9);
    expect(context.gmNotes()).toBe('typed since the save started');
  });

  it('tracks saving keys independently', () => {
    context.markSaving('fear');
    context.markSaving('gmNotes');
    context.clearSaving('fear');

    expect(context.isSaving('fear')).toBe(false);
    expect(context.isSaving('gmNotes')).toBe(true);
  });

  it('refreshCampaign re-fetches and reseeds the campaign', () => {
    context.setCampaign(campaign());

    context.refreshCampaign();
    const request = httpMock.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/campaigns/7',
    );
    request.flush(campaign({ fear: 11 }));

    expect(context.fear()).toBe(11);
  });

  it('refreshCampaign is a no-op before a campaign is set', () => {
    context.refreshCampaign();

    httpMock.expectNone(() => true);
  });
});
