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
    fear: 0,
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

  it('should not show the GM Screen button for non-managers', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    expect(el.querySelector('a.campaign-action-btn')).toBeFalsy();
  });

  it('should show the GM Screen button linking to the campaign gm-screen for game masters', () => {
    setup();
    const authService = TestBed.inject(AuthService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authService as any)['currentUser'].set({ id: 1, username: 'gm_user', email: '', role: 'USER', createdAt: '', lastModifiedAt: '' });

    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    const link = el.querySelector('a.campaign-action-btn');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/campaign/1/gm-screen');
  });

  it('should not fetch the transformation catalog before a drawer is opened', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());

    expect(httpTesting.match(r => r.url.includes('/transformation-cards')).length).toBe(0);
  });

  it('should fetch the transformation catalog when the first drawer is opened', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());

    component.onToggleTransformation(10);

    httpTesting.expectOne(r => r.url.includes('/transformation-cards')).flush({ content: [], currentPage: 0, totalPages: 1, totalElements: 0 });
    expect(component.transformationCatalog()).toEqual([]);
  });

  it('should fetch the transformation catalog only once across drawers', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    component.onToggleTransformation(10);
    httpTesting.expectOne(r => r.url.includes('/transformation-cards')).flush({ content: [], currentPage: 0, totalPages: 1, totalElements: 0 });

    component.onToggleTransformation(11);

    expect(httpTesting.match(r => r.url.includes('/transformation-cards')).length).toBe(0);
  });

  it('should flag a catalog error when the fetch fails', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    component.onToggleTransformation(10);

    httpTesting.expectOne(r => r.url.includes('/transformation-cards'))
      .flush('Boom', { status: 500, statusText: 'Server Error' });

    expect(component.transformationCatalogError()).toBe(true);
  });

  it('should close the open drawer when the same character is toggled again', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    component.onToggleTransformation(10);
    httpTesting.expectOne(r => r.url.includes('/transformation-cards')).flush({ content: [], currentPage: 0, totalPages: 1, totalElements: 0 });

    component.onToggleTransformation(10);

    expect(component.openTransformationId()).toBeNull();
  });

  it('should keep only one drawer open at a time', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    component.onToggleTransformation(10);
    httpTesting.expectOne(r => r.url.includes('/transformation-cards')).flush({ content: [], currentPage: 0, totalPages: 1, totalElements: 0 });

    component.onToggleTransformation(11);

    expect(component.openTransformationId()).toBe(11);
  });

  it('should PUT the transformation change for the character', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());

    component.onTransformationChange({ sheetId: 10, request: { enabled: true, transformationCardId: 5 } });

    const req = httpTesting.expectOne(r => r.url.includes('/campaigns/1/character-sheets/10/transformation'));
    expect(req.request.body).toEqual({ enabled: true, transformationCardId: 5 });
    req.flush({ id: 10, transformationEnabled: true, transformationCardId: 5 });
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
  });

  it('should reload the campaign after a successful transformation change', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    component.onTransformationChange({ sheetId: 10, request: { enabled: false } });
    httpTesting.expectOne(r => r.url.includes('/transformation'))
      .flush({ id: 10, transformationEnabled: false });

    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign({ name: 'Reloaded' }));

    expect(component.campaign()?.name).toBe('Reloaded');
  });

  it('should clear the saving flag when the transformation change fails', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    component.onTransformationChange({ sheetId: 10, request: { enabled: true } });

    httpTesting.expectOne(r => r.url.includes('/transformation'))
      .flush('Boom', { status: 500, statusText: 'Server Error' });
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());

    expect(component.savingTransformationId()).toBeNull();
  });

  it('should hide the GM Screen button once the campaign has ended, even for game masters', () => {
    setup();
    const authService = TestBed.inject(AuthService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authService as any)['currentUser'].set({ id: 1, username: 'gm_user', email: '', role: 'USER', createdAt: '', lastModifiedAt: '' });

    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign({ isEnded: true }));
    fixture.detectChanges();

    expect(el.querySelector('a.campaign-action-btn')).toBeFalsy();
  });
});
