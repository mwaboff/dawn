import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { CampaignService } from './campaign.service';
import { CampaignResponse, CreateCampaignRequest } from '../models/campaign-api.model';

function buildCampaignResponse(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test Campaign',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

describe('CampaignService', () => {
  let service: CampaignService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CampaignService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call getMyCampaigns with correct URL and params', () => {
    service.getMyCampaigns(0, 50, 'creator').subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/campaigns/mine' &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '50' &&
        r.params.get('expand') === 'creator',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], currentPage: 0, pageSize: 50, totalElements: 0, totalPages: 0 });
  });

  it('should send withCredentials on getMyCampaigns', () => {
    service.getMyCampaigns().subscribe();

    const req = httpTesting.expectOne(r => r.url === 'http://localhost:8080/api/dh/campaigns/mine');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ content: [], currentPage: 0, pageSize: 50, totalElements: 0, totalPages: 0 });
  });

  it('should call getCampaign with correct URL', () => {
    service.getCampaign(5, 'creator,gameMasters').subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/campaigns/5' &&
        r.params.get('expand') === 'creator,gameMasters',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildCampaignResponse({ id: 5 }));
  });

  it('should call createCampaign with correct body', () => {
    const request: CreateCampaignRequest = { name: 'New Campaign', description: 'Desc' };
    service.createCampaign(request).subscribe();

    const req = httpTesting.expectOne(r => r.url === 'http://localhost:8080/api/dh/campaigns');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(buildCampaignResponse({ id: 2, name: 'New Campaign' }));
  });

  it('should call removePlayer with correct URL', () => {
    service.removePlayer(1, 3).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/1/players/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(buildCampaignResponse());
  });

  it('should call removeCharacterSheet with correct URL', () => {
    service.removeCharacterSheet(1, 10).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/1/character-sheets/10');
    expect(req.request.method).toBe('DELETE');
    req.flush(buildCampaignResponse());
  });

  it('should call approveCharacterSheet with correct URL', () => {
    service.approveCharacterSheet(1, 10).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/1/character-sheets/10/approve');
    expect(req.request.method).toBe('POST');
    req.flush(buildCampaignResponse());
  });

  it('should call rejectCharacterSheet with correct URL', () => {
    service.rejectCharacterSheet(1, 10).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/1/character-sheets/10/reject');
    expect(req.request.method).toBe('POST');
    req.flush(buildCampaignResponse());
  });

  it('should call generateInvite with correct URL', () => {
    service.generateInvite(1).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/1/invites');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'abc123', campaignId: 1, expiresAt: '2026-01-02T00:00:00' });
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getCampaign(999).subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === 'http://localhost:8080/api/dh/campaigns/999');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(error?.status).toBe(404);
  });
});
