import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CampaignService } from './campaign.service';

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

  it('should fetch my campaigns with default params', () => {
    service.getMyCampaigns().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/campaigns/mine' &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '20'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ content: [], currentPage: 0, pageSize: 20, totalElements: 0, totalPages: 0 });
  });

  it('should fetch my campaigns with expand param', () => {
    service.getMyCampaigns(0, 50, 'creator').subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/campaigns/mine' &&
        r.params.get('expand') === 'creator'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], currentPage: 0, pageSize: 50, totalElements: 0, totalPages: 0 });
  });

  it('should fetch a single campaign', () => {
    service.getCampaign(5).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/campaigns/5'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ id: 5, name: 'Test' });
  });

  it('should fetch a campaign with expand param', () => {
    service.getCampaign(5, 'creator,players').subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/campaigns/5' &&
        r.params.get('expand') === 'creator,players'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ id: 5, name: 'Test' });
  });

  it('should create a campaign', () => {
    const request = { name: 'New Campaign' };
    service.createCampaign(request).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ id: 1, name: 'New Campaign' });
  });

  it('should update a campaign', () => {
    const request = { name: 'Updated' };
    service.updateCampaign(3, request).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 3, name: 'Updated' });
  });

  it('should delete a campaign', () => {
    service.deleteCampaign(3).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.withCredentials).toBe(true);
    req.flush(null);
  });

  it('should generate an invite', () => {
    service.generateInvite(3).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/invites');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ id: 1, campaignId: 3, token: 'abc123' });
  });

  it('should join a campaign by token', () => {
    service.joinCampaign('abc123').subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/join/abc123');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ campaignId: 3, campaignName: 'Test', message: 'Joined' });
  });

  it('should end a campaign', () => {
    service.endCampaign(3).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/end');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 3 });
  });

  it('should leave a campaign', () => {
    service.leaveCampaign(3).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/leave');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 3 });
  });

  it('should kick a player', () => {
    service.kickPlayer(3, 7).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/players/7');
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 3 });
  });

  it('should remove a character sheet', () => {
    service.removeCharacterSheet(3, 10).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/character-sheets/10');
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 3 });
  });

  it('should submit a character sheet', () => {
    service.submitCharacterSheet(3, 10).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/character-sheets/10/submit');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 3 });
  });

  it('should approve a character sheet', () => {
    service.approveCharacterSheet(3, 10).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/character-sheets/10/approve');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 3 });
  });

  it('should reject a character sheet', () => {
    service.rejectCharacterSheet(3, 10).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/character-sheets/10/reject');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 3 });
  });

  it('should add an NPC', () => {
    service.addNpc(3, 10).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/npcs/10');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 3 });
  });

  it('should add a game master', () => {
    service.addGameMaster(3, 7).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/game-masters/7');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 3 });
  });

  it('should remove a game master', () => {
    service.removeGameMaster(3, 7).subscribe();

    const req = httpTesting.expectOne('http://localhost:8080/api/dh/campaigns/3/game-masters/7');
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 3 });
  });
});
