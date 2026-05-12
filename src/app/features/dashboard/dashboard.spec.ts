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
import { DASHBOARD_VARIANT_STORAGE_KEY, DASHBOARD_PREVIEW_LIMIT } from './models/dashboard.model';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { PaginatedResponse } from '../../shared/models/api.model';

function makeSheet(overrides: {
  id?: number;
  name?: string;
  level?: number;
  lastModifiedAt?: string;
  createdAt?: string;
} = {}): CharacterSheetResponse {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Aragorn',
    level: overrides.level ?? 1,
    subclassCards: [],
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
  storedVariant?: string;
} = {}) {
  if (opts.storedVariant !== undefined) {
    localStorage.setItem(DASHBOARD_VARIANT_STORAGE_KEY, opts.storedVariant);
  } else {
    localStorage.removeItem(DASHBOARD_VARIANT_STORAGE_KEY);
  }

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
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-dashboard-ledger')).toBeTruthy();
  });

  it('should read "sheet" from localStorage and seed variant to "sheet"', () => {
    const { fixture } = setup({ storedVariant: 'sheet' });
    fixture.detectChanges();
    expect(fixture.componentInstance.variant()).toBe('sheet');
  });

  it('should read "war-table" from localStorage and seed variant to "war-table"', () => {
    const { fixture } = setup({ storedVariant: 'war-table' });
    fixture.detectChanges();
    expect(fixture.componentInstance.variant()).toBe('war-table');
  });

  it('should default variant to "ledger" when storage is empty', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.variant()).toBe('ledger');
  });

  it('should default variant to "ledger" when storage holds garbage', () => {
    const { fixture } = setup({ storedVariant: 'foo' });
    fixture.detectChanges();
    expect(fixture.componentInstance.variant()).toBe('ledger');
  });

  it('should update variant() to "sheet" when setVariant is called', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    fixture.componentInstance.setVariant('sheet');
    fixture.detectChanges();
    expect(fixture.componentInstance.variant()).toBe('sheet');
  });

  it('should write "sheet" to localStorage when setVariant("sheet") is called', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    fixture.componentInstance.setVariant('sheet');
    expect(localStorage.getItem(DASHBOARD_VARIANT_STORAGE_KEY)).toBe('sheet');
  });

  it('should render app-dashboard-ledger only when variant is "ledger"', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-dashboard-ledger')).toBeTruthy();
    expect(el.querySelector('app-dashboard-sheet')).toBeFalsy();
    expect(el.querySelector('app-dashboard-war-table')).toBeFalsy();
  });

  it('should render app-dashboard-sheet only when variant is "sheet"', () => {
    const { fixture } = setup({ storedVariant: 'sheet' });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-dashboard-sheet')).toBeTruthy();
    expect(el.querySelector('app-dashboard-ledger')).toBeFalsy();
    expect(el.querySelector('app-dashboard-war-table')).toBeFalsy();
  });

  it('should render app-dashboard-war-table only when variant is "war-table"', () => {
    const { fixture } = setup({ storedVariant: 'war-table' });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-dashboard-war-table')).toBeTruthy();
    expect(el.querySelector('app-dashboard-ledger')).toBeFalsy();
    expect(el.querySelector('app-dashboard-sheet')).toBeFalsy();
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
});
