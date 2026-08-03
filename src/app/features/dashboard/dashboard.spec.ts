import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import { Dashboard } from './dashboard';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { EncounterService } from '../../shared/services/encounter.service';
import { DASHBOARD_PREVIEW_LIMIT } from './models/dashboard.model';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { EncounterResponse } from '../../shared/models/encounter-api.model';
import { PaginatedResponse } from '../../shared/models/api.model';

function makeSheet(overrides: {
  id?: number;
  name?: string;
  level?: number;
  lastModifiedAt?: string;
  createdAt?: string;
  associatedClassName?: string;
  subclassPathName?: string;
} = {}): CharacterSheetResponse {
  const subclassCards = overrides.associatedClassName
    ? [{ associatedClassName: overrides.associatedClassName, subclassPathName: overrides.subclassPathName }]
    : [];
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Aragorn',
    level: overrides.level ?? 1,
    subclassCards,
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00',
    lastModifiedAt: overrides.lastModifiedAt ?? '2025-01-01T00:00:00',
  } as unknown as CharacterSheetResponse;
}

function makeCampaign(overrides: {
  id?: number;
  name?: string;
  lastModifiedAt?: string;
  createdAt?: string;
  gameMasterIds?: number[];
} = {}): CampaignResponse {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Campaign',
    creatorId: 1,
    gameMasterIds: overrides.gameMasterIds ?? [],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    fear: 0,
    isEnded: false,
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00',
    lastModifiedAt: overrides.lastModifiedAt ?? '2025-01-01T00:00:00',
  };
}

function sheetsPage(sheets: CharacterSheetResponse[]): PaginatedResponse<CharacterSheetResponse> {
  return { content: sheets, totalElements: sheets.length, totalPages: 1, currentPage: 0, pageSize: 100 };
}

function campaignsPage(campaigns: CampaignResponse[]): PaginatedResponse<CampaignResponse> {
  return { content: campaigns, totalElements: campaigns.length, totalPages: 1, currentPage: 0, pageSize: 20 };
}

function makeEncounter(overrides: {
  id?: number;
  name?: string;
  tier?: number;
  creatorId?: number;
  lastModifiedAt?: string;
  suggestedBattlePoints?: number;
  spentBattlePoints?: number;
} = {}): EncounterResponse {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Goblin Ambush',
    tier: overrides.tier,
    isOfficial: false,
    isPublic: false,
    creatorId: overrides.creatorId ?? 1,
    adversaries: [],
    adjustmentEasier: false,
    adjustmentTwoPlusSolos: false,
    adjustmentBonusDamage: false,
    adjustmentLowerTier: false,
    adjustmentNoElites: false,
    adjustmentHarder: false,
    suggestedBattlePoints: overrides.suggestedBattlePoints ?? 10,
    spentBattlePoints: overrides.spentBattlePoints ?? 5,
    createdAt: overrides.lastModifiedAt ?? '2025-01-01T00:00:00',
    lastModifiedAt: overrides.lastModifiedAt ?? '2025-01-01T00:00:00',
  };
}

function setup(opts: {
  user?: { id: number; username: string; usernameChosen: boolean; role: string } | null;
  charactersResult?: Observable<PaginatedResponse<CharacterSheetResponse>>;
  campaignsResult?: Observable<PaginatedResponse<CampaignResponse>>;
  encountersResult?: Observable<EncounterResponse[]>;
} = {}) {
  const defaultUser = { id: 1, username: 'Aragorn', usernameChosen: true, role: 'USER' };
  const resolvedUser = 'user' in opts ? opts.user : defaultUser;
  const userSignal = signal(resolvedUser);
  const mockAuth = { user: userSignal };

  const mockUserSvc = {
    getUserCharacterSheets: vi.fn().mockReturnValue(
      opts.charactersResult ?? of(sheetsPage([]))
    ),
  };
  const mockCampaignSvc = {
    getMyCampaigns: vi.fn().mockReturnValue(
      opts.campaignsResult ?? of(campaignsPage([]))
    ),
  };
  const mockEncounterSvc = {
    getOwnEncounters: vi.fn().mockReturnValue(
      opts.encountersResult ?? of([])
    ),
  };

  TestBed.configureTestingModule({
    imports: [Dashboard],
    providers: [
      { provide: AuthService, useValue: mockAuth },
      { provide: UserService, useValue: mockUserSvc },
      { provide: CampaignService, useValue: mockCampaignSvc },
      { provide: EncounterService, useValue: mockEncounterSvc },
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });

  const fixture = TestBed.createComponent(Dashboard);
  return { fixture, mockUserSvc, mockCampaignSvc, mockEncounterSvc };
}

describe('Dashboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.dashboard__header')).toBeTruthy();
  });

  it('should call getUserCharacterSheets with the current user id', () => {
    const { fixture, mockUserSvc } = setup({
      user: { id: 42, username: 'Frodo', usernameChosen: true, role: 'USER' },
    });
    fixture.detectChanges();
    expect(mockUserSvc.getUserCharacterSheets).toHaveBeenCalledWith(42, 0, 100, 'subclassCards');
  });

  it('should call getMyCampaigns with correct arguments', () => {
    const { fixture, mockCampaignSvc } = setup();
    fixture.detectChanges();
    expect(mockCampaignSvc.getMyCampaigns).toHaveBeenCalledWith(0, 20, 'creator');
  });

  it('should call getOwnEncounters with the current user id', () => {
    const { fixture, mockEncounterSvc } = setup({
      user: { id: 42, username: 'Frodo', usernameChosen: true, role: 'USER' },
      encountersResult: of([makeEncounter({ id: 1, creatorId: 42 })]),
    });
    fixture.detectChanges();
    expect(mockEncounterSvc.getOwnEncounters).toHaveBeenCalledWith(42);
    expect(fixture.componentInstance.encounters().length).toBe(1);
  });

  it('should not call services and set all loadings to false when user is null', () => {
    const { fixture, mockUserSvc, mockCampaignSvc, mockEncounterSvc } = setup({ user: null });
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(mockUserSvc.getUserCharacterSheets).not.toHaveBeenCalled();
    expect(mockCampaignSvc.getMyCampaigns).not.toHaveBeenCalled();
    expect(mockEncounterSvc.getOwnEncounters).not.toHaveBeenCalled();
    expect(comp.charactersLoading()).toBe(false);
    expect(comp.campaignsLoading()).toBe(false);
    expect(comp.encountersLoading()).toBe(false);
  });

  it('should set charactersError to true on non-403 character fetch failure', () => {
    const { fixture } = setup({
      charactersResult: throwError(() => new HttpErrorResponse({ status: 500 })),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.charactersError()).toBe(true);
  });

  it('should NOT set charactersError on 403 character fetch failure', () => {
    const { fixture } = setup({
      charactersResult: throwError(() => new HttpErrorResponse({ status: 403 })),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.charactersError()).toBe(false);
  });

  it('should set campaignsError to true on non-403 campaign fetch failure', () => {
    const { fixture } = setup({
      campaignsResult: throwError(() => new HttpErrorResponse({ status: 500 })),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.campaignsError()).toBe(true);
  });

  it('should set encountersError to true on non-403 encounter fetch failure', () => {
    const { fixture } = setup({
      encountersResult: throwError(() => new HttpErrorResponse({ status: 500 })),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.encountersError()).toBe(true);
  });

  it('should NOT set encountersError on 403 encounter fetch failure', () => {
    const { fixture } = setup({
      encountersResult: throwError(() => new HttpErrorResponse({ status: 403 })),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.encountersError()).toBe(false);
  });

  it('should allow one section to error while the other succeeds', () => {
    const { fixture } = setup({
      charactersResult: throwError(() => new HttpErrorResponse({ status: 500 })),
      campaignsResult: of(campaignsPage([makeCampaign()])),
    });
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.charactersError()).toBe(true);
    expect(comp.campaignsError()).toBe(false);
    expect(comp.campaigns().length).toBe(1);
  });

  it('should limit characters, campaigns, and encounters to DASHBOARD_PREVIEW_LIMIT', () => {
    const sheets = Array.from({ length: 7 }, (_, i) =>
      makeSheet({ id: i + 1, lastModifiedAt: `2025-01-0${i + 1}T00:00:00` })
    );
    const campaigns = Array.from({ length: 7 }, (_, i) =>
      makeCampaign({ id: i + 1, lastModifiedAt: `2025-01-0${i + 1}T00:00:00` })
    );
    const encounters = Array.from({ length: 7 }, (_, i) =>
      makeEncounter({ id: i + 1, lastModifiedAt: `2025-01-0${i + 1}T00:00:00` })
    );
    const { fixture } = setup({
      charactersResult: of(sheetsPage(sheets)),
      campaignsResult: of(campaignsPage(campaigns)),
      encountersResult: of(encounters),
    });
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.characters().length).toBe(DASHBOARD_PREVIEW_LIMIT);
    expect(comp.campaigns().length).toBe(DASHBOARD_PREVIEW_LIMIT);
    expect(comp.encounters().length).toBe(DASHBOARD_PREVIEW_LIMIT);
  });

  it('should sort characters by lastModifiedAt descending before slicing', () => {
    const sheets = [
      makeSheet({ id: 1, lastModifiedAt: '2025-01-01T00:00:00' }),
      makeSheet({ id: 2, lastModifiedAt: '2025-03-15T00:00:00' }),
      makeSheet({ id: 3, lastModifiedAt: '2025-02-10T00:00:00' }),
    ];
    const { fixture } = setup({ charactersResult: of(sheetsPage(sheets)) });
    fixture.detectChanges();
    expect(fixture.componentInstance.characters()[0].id).toBe(2);
  });

  it('should sort campaigns by lastModifiedAt descending before slicing', () => {
    const campaigns = [
      makeCampaign({ id: 1, lastModifiedAt: '2025-01-01T00:00:00' }),
      makeCampaign({ id: 2, lastModifiedAt: '2025-03-15T00:00:00' }),
      makeCampaign({ id: 3, lastModifiedAt: '2025-02-10T00:00:00' }),
    ];
    const { fixture } = setup({ campaignsResult: of(campaignsPage(campaigns)) });
    fixture.detectChanges();
    expect(fixture.componentInstance.campaigns()[0].id).toBe(2);
  });

  it('should sort encounters by lastModifiedAt descending before slicing', () => {
    const encounters = [
      makeEncounter({ id: 1, lastModifiedAt: '2025-01-01T00:00:00' }),
      makeEncounter({ id: 2, lastModifiedAt: '2025-03-15T00:00:00' }),
      makeEncounter({ id: 3, lastModifiedAt: '2025-02-10T00:00:00' }),
    ];
    const { fixture } = setup({ encountersResult: of(encounters) });
    fixture.detectChanges();
    expect(fixture.componentInstance.encounters()[0].id).toBe(2);
  });

  it('should render character count in panel title', () => {
    const sheets = [
      makeSheet({ id: 1 }),
      makeSheet({ id: 2 }),
      makeSheet({ id: 3 }),
    ];
    const { fixture } = setup({ charactersResult: of(sheetsPage(sheets)) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const titles = Array.from(el.querySelectorAll('.panel__title')).map(t => t.textContent?.trim());
    expect(titles).toContain('Characters (3)');
  });

  it('should render campaign count in panel title', () => {
    const campaigns = [makeCampaign({ id: 1 }), makeCampaign({ id: 2 })];
    const { fixture } = setup({ campaignsResult: of(campaignsPage(campaigns)) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const titles = Array.from(el.querySelectorAll('.panel__title')).map(t => t.textContent?.trim());
    expect(titles).toContain('Campaigns (2)');
  });

  it('should render encounter count in panel title', () => {
    const encounters = [makeEncounter({ id: 1 }), makeEncounter({ id: 2 }), makeEncounter({ id: 3 })];
    const { fixture } = setup({ encountersResult: of(encounters) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const titles = Array.from(el.querySelectorAll('.panel__title')).map(t => t.textContent?.trim());
    expect(titles).toContain('Encounters (3)');
  });

  it('should render zero counts when all lists are empty', () => {
    const { fixture } = setup({
      charactersResult: of(sheetsPage([])),
      campaignsResult: of(campaignsPage([])),
      encountersResult: of([]),
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const titles = Array.from(el.querySelectorAll('.panel__title')).map(t => t.textContent?.trim());
    expect(titles).toContain('Characters (0)');
    expect(titles).toContain('Campaigns (0)');
    expect(titles).toContain('Encounters (0)');
  });

  it('should render character entries with border-left color matching the class', () => {
    const sheets = [makeSheet({ associatedClassName: 'Guardian' })];
    const { fixture } = setup({ charactersResult: of(sheetsPage(sheets)) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const row = el.querySelector('.dashboard-row') as HTMLElement | null;
    expect(row).toBeTruthy();
    const borderLeft = row!.style.borderLeft;
    expect(borderLeft).toBeTruthy();
    const hasBorderColor = borderLeft.includes('#5e8ed4') || borderLeft.includes('rgb(94, 142, 212)');
    expect(hasBorderColor).toBe(true);
  });

  it('should link character row to /character/{id}', () => {
    const sheets = [makeSheet({ id: 42 })];
    const { fixture } = setup({ charactersResult: of(sheetsPage(sheets)) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector('.dashboard-row') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href')).toBe('/character/42');
  });

  it('should link campaign row to /campaign/{id}', () => {
    const campaigns = [makeCampaign({ id: 7 })];
    const { fixture } = setup({ campaignsResult: of(campaignsPage(campaigns)) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector('.dashboard-row--saga') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href')).toBe('/campaign/7');
  });

  it('should show a GM Screen link for campaigns the user GMs', () => {
    const campaigns = [makeCampaign({ id: 7, gameMasterIds: [1] })];
    const { fixture } = setup({ campaignsResult: of(campaignsPage(campaigns)) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector('.dashboard-saga-gm-link') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href')).toBe('/campaign/7/gm-screen');
  });

  it('should NOT show a GM Screen link for campaigns the user does not GM', () => {
    const campaigns = [makeCampaign({ id: 7, gameMasterIds: [99] })];
    const { fixture } = setup({ campaignsResult: of(campaignsPage(campaigns)) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.dashboard-saga-gm-link')).toBeFalsy();
  });

  it('should link "+ Forge a hero" dashed row to /create-character', () => {
    const { fixture } = setup({ charactersResult: of(sheetsPage([])) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const adds = Array.from(el.querySelectorAll('.roster-entry--add')) as HTMLAnchorElement[];
    const forgeLink = adds.find(a => a.textContent?.includes('Forge a hero'));
    expect(forgeLink?.getAttribute('href')).toBe('/create-character');
  });

  it('should link "+ Start a new story" dashed row to /campaigns/create', () => {
    const { fixture } = setup({ campaignsResult: of(campaignsPage([])) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const adds = Array.from(el.querySelectorAll('.roster-entry--add')) as HTMLAnchorElement[];
    const beginLink = adds.find(a => a.textContent?.includes('Start a new story'));
    expect(beginLink?.getAttribute('href')).toBe('/campaigns/create');
  });

  it('should link encounter row to the encounter edit page', () => {
    const encounters = [makeEncounter({ id: 9 })];
    const { fixture } = setup({ encountersResult: of(encounters) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector('ol[aria-label="Encounters"] .dashboard-row') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href')).toBe('/encounters/9/edit');
  });

  it('should show tier and points for an encounter row', () => {
    const encounters = [makeEncounter({ tier: 2, spentBattlePoints: 7, suggestedBattlePoints: 15 })];
    const { fixture } = setup({ encountersResult: of(encounters) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const row = el.querySelector('ol[aria-label="Encounters"] .roster-class');
    expect(row?.textContent).toContain('Tier 2');
    expect(row?.textContent).toContain('7/15 pts');
  });

  it('should show "Mixed Tier" for an encounter with no overall tier', () => {
    const encounters = [makeEncounter({ tier: undefined })];
    const { fixture } = setup({ encountersResult: of(encounters) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.roster-class-name')?.textContent?.trim()).toBe('Mixed Tier');
  });

  it('should link "+ Draft an encounter" dashed row to the encounter builder', () => {
    const { fixture } = setup({ encountersResult: of([]) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const adds = Array.from(el.querySelectorAll('.roster-entry--add')) as HTMLAnchorElement[];
    const draftLink = adds.find(a => a.textContent?.includes('Draft an encounter'));
    expect(draftLink?.getAttribute('href')).toBe('/encounters/new');
  });

  it('should link the Encounters "View All" affordance to /encounters', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector('.dashboard__wide .dashboard-viewall-link') as HTMLAnchorElement | null;
    expect(link?.textContent?.trim()).toBe('View All');
    expect(link?.getAttribute('href')).toBe('/encounters');
  });

  it('should give all three panels a "View All" header affordance, each to its own list destination', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const links = Array.from(el.querySelectorAll('.dashboard-viewall-link')) as HTMLAnchorElement[];
    expect(links.length).toBe(3);
    const hrefs = links.map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/profile');
    expect(hrefs).toContain('/campaigns');
    expect(hrefs).toContain('/encounters');
  });

  it('should render username in .dashboard__greeting', () => {
    const { fixture } = setup({
      user: { id: 1, username: 'Elara', usernameChosen: true, role: 'USER' },
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.dashboard__greeting')?.textContent?.trim()).toContain('Elara');
  });

  it('should render loading skeletons when charactersLoading is true', () => {
    const { fixture } = setup({ charactersResult: new Observable() });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.roster-skeleton').length).toBeGreaterThanOrEqual(3);
  });

  it('should render empty-state copy for characters via .dashboard-empty__text', () => {
    const { fixture } = setup({
      charactersResult: of(sheetsPage([])),
      campaignsResult: of(campaignsPage([])),
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const emptyTexts = Array.from(el.querySelectorAll('.dashboard-empty__text')).map(t => t.textContent?.trim());
    expect(emptyTexts).toContain('No heroes inscribed. Forge your first.');
  });

  it('should render empty-state copy for campaigns via .dashboard-empty__text', () => {
    const { fixture } = setup({
      charactersResult: of(sheetsPage([])),
      campaignsResult: of(campaignsPage([])),
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const emptyTexts = Array.from(el.querySelectorAll('.dashboard-empty__text')).map(t => t.textContent?.trim());
    expect(emptyTexts).toContain('No sagas underway. Start your first.');
  });

  it('should render empty-state copy for encounters via .dashboard-empty__text', () => {
    const { fixture } = setup({ encountersResult: of([]) });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const emptyTexts = Array.from(el.querySelectorAll('.dashboard-empty__text')).map(t => t.textContent?.trim());
    expect(emptyTexts).toContain('No encounters drafted. Ready your first fight.');
  });

  describe('scrollable list containers', () => {
    it('should mark each populated list as a capped-height scroll region with an accessible name', () => {
      const { fixture } = setup({
        charactersResult: of(sheetsPage([makeSheet()])),
        campaignsResult: of(campaignsPage([makeCampaign()])),
        encountersResult: of([makeEncounter()]),
      });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const lists = Array.from(el.querySelectorAll('.dashboard-scroll-list'));
      expect(lists.length).toBe(3);
      for (const list of lists) {
        expect(list.getAttribute('aria-label')).toBeTruthy();
      }
    });

    // No tabindex on the list itself: every row is a routerLink `<a>`, already a native tab
    // stop, so making the `<ol>` focusable too would just add an inert stop before the first
    // real link (WCAG 2.1 SC 2.1.1 only requires *something* focusable inside a scroll region,
    // not the region itself).
    it('should not add an extra tab stop on the scroll container', () => {
      const { fixture } = setup({
        encountersResult: of([makeEncounter()]),
      });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const list = el.querySelector('.dashboard-scroll-list');
      expect(list?.hasAttribute('tabindex')).toBe(false);
    });
  });
});
