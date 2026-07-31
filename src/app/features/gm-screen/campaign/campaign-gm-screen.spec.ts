import { describe, it, expect, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CampaignGmScreen } from './campaign-gm-screen';
import { CampaignResponse } from '../../../shared/models/campaign-api.model';
import { AuthService } from '../../../core/services/auth.service';
import { GmPanelGrid } from '../components/gm-panel-grid/gm-panel-grid';
import { CAMPAIGN_GM_PANELS } from './campaign-panels';
import { STATIC_GM_PANELS } from '../content/panel-registry';

function buildCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test Campaign',
    description: 'A test',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [2],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    fear: 3,
    isEnded: false,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

describe('CampaignGmScreen', () => {
  let fixture: ComponentFixture<CampaignGmScreen>;
  let component: CampaignGmScreen;
  let el: HTMLElement;
  let httpTesting: HttpTestingController;

  function setup(routeId = '1') {
    TestBed.configureTestingModule({
      imports: [CampaignGmScreen],
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

    fixture = TestBed.createComponent(CampaignGmScreen);
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
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());

    expect(component).toBeTruthy();
  });

  it('should render the campaign panels and static panels together for a game master', () => {
    setup();
    const authService = TestBed.inject(AuthService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authService as any)['currentUser'].set({ id: 1, username: 'gm_user', email: '', role: 'USER', createdAt: '', lastModifiedAt: '' });

    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    const grid = fixture.debugElement.query(node => node.componentInstance instanceof GmPanelGrid);
    expect(grid).toBeTruthy();
    expect(grid.componentInstance.panels().length).toBe(CAMPAIGN_GM_PANELS.length + STATIC_GM_PANELS.length);
  });

  it('should show access-denied for a non-game-master, non-admin user', () => {
    setup();
    const authService = TestBed.inject(AuthService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authService as any)['currentUser'].set({ id: 2, username: 'player1', email: '', role: 'USER', createdAt: '', lastModifiedAt: '' });

    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    expect(el.querySelector('.gm-screen-error-title')?.textContent?.trim()).toBe('Access Denied');
    expect(el.querySelector('app-gm-panel-grid')).toBeFalsy();
  });

  it('should show the screen for an admin even when not in gameMasterIds', () => {
    setup();
    const authService = TestBed.inject(AuthService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authService as any)['currentUser'].set({ id: 2, username: 'admin_user', email: '', role: 'ADMIN', createdAt: '', lastModifiedAt: '' });

    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1')).flush(buildCampaign());
    fixture.detectChanges();

    expect(el.querySelector('app-gm-panel-grid')).toBeTruthy();
  });

  it('should show a load-error state when the campaign fails to load', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/campaigns/1'))
      .flush('Not Found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el.querySelector('.gm-screen-error-title')?.textContent?.trim()).toBe('Campaign Not Found');
  });
});
