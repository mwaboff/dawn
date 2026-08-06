import { of, throwError } from 'rxjs';

import { PaginatedResponse } from '../../../shared/models/api.model';
import { CampaignResponse } from '../../../shared/models/campaign-api.model';
import { CampaignService } from '../../../shared/services/campaign.service';
import { readSaveErrorMessage, shareableCampaignOptions } from './item-form-host.utils';

function campaignPage(
  campaigns: { id: number; name: string; isEnded?: boolean }[],
): PaginatedResponse<CampaignResponse> {
  return {
    content: campaigns as CampaignResponse[],
    currentPage: 0,
    pageSize: 100,
    totalElements: campaigns.length,
    totalPages: 1,
  };
}

function serviceReturning(page: PaginatedResponse<CampaignResponse>): CampaignService {
  return { getMyCampaigns: () => of(page) } as unknown as CampaignService;
}

describe('shareableCampaignOptions', () => {
  it('maps campaigns to picker options', async () => {
    const service = serviceReturning(campaignPage([{ id: 3, name: 'The Long Dark' }]));

    const options = await new Promise(resolve =>
      shareableCampaignOptions(service).subscribe(resolve),
    );

    expect(options).toEqual([{ id: 3, label: 'The Long Dark' }]);
  });

  it('leaves out ended campaigns, which no new homebrew should be shared into', async () => {
    const service = serviceReturning(
      campaignPage([
        { id: 1, name: 'Finished', isEnded: true },
        { id: 2, name: 'Running', isEnded: false },
      ]),
    );

    const options = await new Promise(resolve =>
      shareableCampaignOptions(service).subscribe(resolve),
    );

    expect(options).toEqual([{ id: 2, label: 'Running' }]);
  });

  it('offers nothing rather than failing when the campaigns cannot be fetched', async () => {
    const service = {
      getMyCampaigns: () => throwError(() => new Error('offline')),
    } as unknown as CampaignService;

    const options = await new Promise(resolve =>
      shareableCampaignOptions(service).subscribe(resolve),
    );

    expect(options).toEqual([]);
  });
});

describe('readSaveErrorMessage', () => {
  it('spells out every field error, since the body carries no top-level message', () => {
    const message = readSaveErrorMessage({
      error: { fieldErrors: { name: 'must not be blank', tier: 'must be at least 1' } },
    });

    expect(message).toBe('name: must not be blank; tier: must be at least 1');
  });

  it('prefers field errors over a top-level message', () => {
    const message = readSaveErrorMessage({
      error: { message: 'Validation failed', fieldErrors: { name: 'must not be blank' } },
    });

    expect(message).toBe('name: must not be blank');
  });

  it('falls back to the top-level message when there are no field errors', () => {
    expect(readSaveErrorMessage({ error: { message: 'Item name already taken' } }))
      .toBe('Item name already taken');
  });

  it('ignores an empty field-error map', () => {
    expect(readSaveErrorMessage({ error: { message: 'Nope', fieldErrors: {} } })).toBe('Nope');
  });

  it('has something to say about an unrecognisable failure', () => {
    expect(readSaveErrorMessage(null)).toBe('Save failed. Please try again.');
    expect(readSaveErrorMessage({})).toBe('Save failed. Please try again.');
  });
});
