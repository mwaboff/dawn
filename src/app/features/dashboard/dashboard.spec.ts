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
import { DASHBOARD_PREVIEW_LIMIT } from './models/dashboard.model';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
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
} = {}): CampaignResponse {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Campaign',
    creatorId: 1,
    gameMasterIds: [],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
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

function setup(opts: {
  user?: { id: number; username: string; usernameChosen: boolean; role: string } | null;
  charactersResult?: Observable<PaginatedResponse<CharacterSheetResponse>>;
  campaignsResult?: Observable<PaginatedResponse<CampaignResponse>>;
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

  TestBed.configureTestingModule({
    imports: [Dashboard],
    providers: [
      { provide: AuthService, useValue: mockAuth },
      { provide: UserService, useValue: mockUserSvc },
      { provide: CampaignService, useValue: mockCampaignSvc },
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });

  const fixture = TestBed.createComponent(Dashboard);
  return { fixture, mockUserSvc, mockCampaignSvc };
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

  it('should not call services and set both loadings to false when user is null', () => {
    const { fixture, mockUserSvc, mockCampaignSvc } = setup({ user: null });
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(mockUserSvc.getUserCharacterSheets).not.toHaveBeenCalled();
    expect(mockCampaignSvc.getMyCampaigns).not.toHaveBeenCalled();
    expect(comp.charactersLoading()).toBe(false);
    expect(comp.campaignsLoading()).toBe(false);
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

  it('should limit characters and campaigns to DASHBOARD_PREVIEW_LIMIT', () => {
    const sheets = Array.from({ length: 7 }, (_, i) =>
      makeSheet({ id: i + 1, lastModifiedAt: `2025-01-0${i + 1}T00:00:00` })
    );
    const campaigns = Array.from({ length: 7 }, (_, i) =>
      makeCampaign({ id: i + 1, lastModifiedAt: `2025-01-0${i + 1}T00:00:00` })
    );
    const { fixture } = setup({
      charactersResult: of(sheetsPage(sheets)),
      campaignsResult: of(campaignsPage(campaigns)),
    });
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.characters().length).toBe(DASHBOARD_PREVIEW_LIMIT);
    expect(comp.campaigns().length).toBe(DASHBOARD_PREVIEW_LIMIT);
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

  it('should set bothEmpty() true when both lists are loaded, error-free, and empty', () => {
    const { fixture } = setup({
      charactersResult: of(sheetsPage([])),
      campaignsResult: of(campaignsPage([])),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.bothEmpty()).toBe(true);
  });

  it('should keep bothEmpty() false when characters list has items', () => {
    const { fixture } = setup({
      charactersResult: of(sheetsPage([makeSheet()])),
      campaignsResult: of(campaignsPage([])),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.bothEmpty()).toBe(false);
  });

  it('should keep bothEmpty() false while loading is still in progress', () => {
    const { fixture } = setup({
      charactersResult: new Observable(),
      campaignsResult: of(campaignsPage([])),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.bothEmpty()).toBe(false);
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

  it('should render zero counts when both lists are empty', () => {
    const { fixture } = setup({
      charactersResult: of(sheetsPage([])),
      campaignsResult: of(campaignsPage([])),
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const titles = Array.from(el.querySelectorAll('.panel__title')).map(t => t.textContent?.trim());
    expect(titles).toContain('Characters (0)');
    expect(titles).toContain('Campaigns (0)');
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
});
