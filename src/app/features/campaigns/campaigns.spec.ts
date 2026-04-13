import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Campaigns } from './campaigns';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { PaginatedResponse } from '../../shared/models/api.model';

function buildCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test Campaign',
    creatorId: 1,
    creator: { id: 1, username: 'gm_user', email: 'gm@test.com', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true },
    gameMasterIds: [1],
    playerIds: [2, 3],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [10],
    nonPlayerCharacterIds: [],
    isEnded: false,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function flushCampaigns(httpTesting: HttpTestingController, campaigns: CampaignResponse[]): void {
  const response: PaginatedResponse<CampaignResponse> = {
    content: campaigns,
    currentPage: 0,
    pageSize: 50,
    totalElements: campaigns.length,
    totalPages: 1,
  };
  const req = httpTesting.expectOne(r => r.url.includes('/campaigns/mine'));
  req.flush(response);
}

describe('Campaigns', () => {
  let fixture: ComponentFixture<Campaigns>;
  let component: Campaigns;
  let el: HTMLElement;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Campaigns],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Campaigns);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    flushCampaigns(httpTesting, []);

    expect(component).toBeTruthy();
  });

  it('should show loading skeletons initially', () => {
    fixture.detectChanges();

    expect(el.querySelectorAll('.campaigns-skeleton').length).toBe(3);
    flushCampaigns(httpTesting, []);
  });

  it('should show empty state when no campaigns', () => {
    fixture.detectChanges();
    flushCampaigns(httpTesting, []);
    fixture.detectChanges();

    expect(el.querySelector('.campaigns-empty')).toBeTruthy();
  });

  it('should show empty state text', () => {
    fixture.detectChanges();
    flushCampaigns(httpTesting, []);
    fixture.detectChanges();

    expect(el.querySelector('.campaigns-empty-text')?.textContent?.trim()).toContain('No campaigns yet');
  });

  it('should show error state on HTTP error', () => {
    fixture.detectChanges();
    const req = httpTesting.expectOne(r => r.url.includes('/campaigns/mine'));
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el.querySelector('.campaigns-message')).toBeTruthy();
  });

  it('should render campaign entries', () => {
    fixture.detectChanges();
    flushCampaigns(httpTesting, [
      buildCampaign({ id: 1, name: 'Campaign A' }),
      buildCampaign({ id: 2, name: 'Campaign B' }),
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.campaigns-entry').length).toBe(2);
  });

  it('should display campaign name', () => {
    fixture.detectChanges();
    flushCampaigns(httpTesting, [buildCampaign({ name: 'Dragon Quest' })]);
    fixture.detectChanges();

    expect(el.querySelector('.campaigns-entry-name')?.textContent?.trim()).toBe('Dragon Quest');
  });

  it('should display GM username', () => {
    fixture.detectChanges();
    flushCampaigns(httpTesting, [
      buildCampaign({ creator: { id: 1, username: 'dungeon_master', email: '', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true } }),
    ]);
    fixture.detectChanges();

    expect(el.querySelector('.campaigns-entry-meta')?.textContent).toContain('dungeon_master');
  });

  it('should display player count', () => {
    fixture.detectChanges();
    flushCampaigns(httpTesting, [buildCampaign({ playerIds: [2, 3, 4] })]);
    fixture.detectChanges();

    expect(el.querySelector('.campaigns-entry-meta')?.textContent).toContain('3 players');
  });

  it('should show ended badge for ended campaigns', () => {
    fixture.detectChanges();
    flushCampaigns(httpTesting, [buildCampaign({ isEnded: true })]);
    fixture.detectChanges();

    expect(el.querySelector('.campaigns-badge-ended')).toBeTruthy();
  });

  it('should not show ended badge for active campaigns', () => {
    fixture.detectChanges();
    flushCampaigns(httpTesting, [buildCampaign()]);
    fixture.detectChanges();

    expect(el.querySelector('.campaigns-badge-ended')).toBeFalsy();
  });

  it('should navigate to campaign detail on entry click', () => {
    const navigateSpy = vitest.spyOn(router, 'navigate');
    fixture.detectChanges();
    flushCampaigns(httpTesting, [buildCampaign({ id: 42 })]);
    fixture.detectChanges();

    (el.querySelector('.campaigns-entry') as HTMLElement).click();

    expect(navigateSpy).toHaveBeenCalledWith(['/campaign', 42]);
  });

  it('should navigate to create on create button click', () => {
    const navigateSpy = vitest.spyOn(router, 'navigate');
    fixture.detectChanges();
    flushCampaigns(httpTesting, []);
    fixture.detectChanges();

    (el.querySelector('.campaigns-empty-btn') as HTMLElement).click();

    expect(navigateSpy).toHaveBeenCalledWith(['/campaigns/create']);
  });
});
