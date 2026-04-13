import { describe, it, expect, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Campaign } from './campaign';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { AuthService } from '../../core/services/auth.service';

function buildCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test Campaign',
    description: 'A test',
    creatorId: 1,
    creator: { id: 1, username: 'gm_user', email: '', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true },
    gameMasterIds: [1],
    gameMasters: [{ id: 1, username: 'gm_user', email: '', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true }],
    playerIds: [2],
    players: [{ id: 2, username: 'player1', email: '', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true }],
    pendingCharacterSheetIds: [],
    pendingCharacterSheets: [],
    playerCharacterIds: [],
    playerCharacters: [],
    nonPlayerCharacterIds: [],
    isEnded: false,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

describe('Campaign', () => {
  let fixture: ComponentFixture<Campaign>;
  let component: Campaign;
  let el: HTMLElement;
  let httpTesting: HttpTestingController;

  function setup(routeId = '1') {
    TestBed.configureTestingModule({
      imports: [Campaign],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => routeId } } },
        },
      ],
    });

    fixture = TestBed.createComponent(Campaign);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    setup();
    fixture.detectChanges();
    const req = httpTesting.expectOne(r => r.url.includes('/campaigns/1'));
    req.flush(buildCampaign());

    expect(component).toBeTruthy();
  });

  it('should show loading skeletons initially', () => {
    setup();
    fixture.detectChanges();

    expect(el.querySelector('.campaign-skeleton')).toBeTruthy();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
  });

  it('should show campaign summary after loading', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    expect(el.querySelector('app-campaign-summary')).toBeTruthy();
  });

  it('should show 403 error for access denied', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1'))
      .flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(el.querySelector('.campaign-error-title')?.textContent?.trim()).toBe('Access Denied');
  });

  it('should show 404 error for not found', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1'))
      .flush('Not Found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el.querySelector('.campaign-error-title')?.textContent?.trim()).toBe('Campaign Not Found');
  });

  it('should show 404 error for invalid route id', () => {
    setup('invalid');
    fixture.detectChanges();

    expect(el.querySelector('.campaign-error-title')?.textContent?.trim()).toBe('Campaign Not Found');
  });

  it('should show player list section', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    expect(el.querySelector('app-campaign-player-list')).toBeTruthy();
  });

  it('should show character list section', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    expect(el.querySelector('app-campaign-character-list')).toBeTruthy();
  });

  it('should not show invite section for non-managers', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    expect(el.querySelector('app-campaign-invite')).toBeFalsy();
  });

  it('should show invite section for game masters', () => {
    setup();
    const authService = TestBed.inject(AuthService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authService as any)['currentUser'].set({ id: 1, username: 'gm_user', email: '', role: 'USER', createdAt: '', lastModifiedAt: '' });

    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    expect(el.querySelector('app-campaign-invite')).toBeTruthy();
  });
});
