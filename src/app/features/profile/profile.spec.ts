import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { Profile } from './profile';
import { AuthService, UserResponse } from '../../core/services/auth.service';

const mockUser: UserResponse = {
  id: 42,
  username: 'testadventurer',
  email: 'test@example.com',
  role: 'USER',
  createdAt: '2025-06-15T10:30:00',
  lastModifiedAt: '2025-06-15T10:30:00',
};

function makeSheet(overrides: Record<string, unknown> = {}) {
  return {
    id: 1, name: 'Aragorn', level: 5, evasion: 10,
    armorMax: 5, armorMarked: 0, majorDamageThreshold: 3, severeDamageThreshold: 6,
    agilityModifier: 0, agilityMarked: false, strengthModifier: 0, strengthMarked: false,
    finesseModifier: 0, finesseMarked: false, instinctModifier: 0, instinctMarked: false,
    presenceModifier: 0, presenceMarked: false, knowledgeModifier: 0, knowledgeMarked: false,
    hitPointMax: 10, hitPointMarked: 0, stressMax: 6, stressMarked: 0,
    hopeMax: 3, hopeMarked: 0, gold: 50, ownerId: 42,
    communityCardIds: [], ancestryCardIds: [], subclassCardIds: [], domainCardIds: [],
    inventoryWeaponIds: [], inventoryArmorIds: [], inventoryItemIds: [], experienceIds: [],
    createdAt: '2025-06-15T10:30:00', lastModifiedAt: '2025-06-15T10:30:00',
    ...overrides,
  };
}

function wrapPaged(content: unknown[]) {
  return { content, totalElements: content.length, totalPages: 1, currentPage: 0, pageSize: 100 };
}

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'user').mockReturnValue(mockUser);

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitRequests(sheetData: unknown[] = [], campaignData: unknown[] = []) {
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged(sheetData));
    httpMock.expectOne(r => r.url.includes('/campaigns/mine')).flush(wrapPaged(campaignData));
  }

  it('should create', () => {
    fixture.detectChanges();
    flushInitRequests();
    expect(component).toBeTruthy();
  });

  it('should display the username', () => {
    fixture.detectChanges();
    flushInitRequests();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.profile-name')?.textContent?.trim()).toBe('testadventurer');
  });

  it('should format the join date', () => {
    fixture.detectChanges();
    flushInitRequests();
    fixture.detectChanges();
    expect(component.joinDate()).toContain('2025');
  });

  it('should request character sheets with ownerId and expand subclassCards', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    expect(req.request.params.get('ownerId')).toBe('42');
    expect(req.request.params.get('expand')).toBe('subclassCards');
    req.flush(wrapPaged([]));
    httpMock.expectOne(r => r.url.includes('/campaigns/mine')).flush(wrapPaged([]));
  });

  it('should render the roster-list child component', () => {
    fixture.detectChanges();
    flushInitRequests();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-roster-list')).toBeTruthy();
  });

  it('should pass characters to roster-list', () => {
    fixture.detectChanges();
    flushInitRequests([makeSheet({ id: 1, name: 'Aragorn', level: 5 })]);
    fixture.detectChanges();

    expect(component.characters().length).toBe(1);
    expect(component.characters()[0].name).toBe('Aragorn');
  });

  it('should handle 403 gracefully as empty state', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets'))
      .flush(null, { status: 403, statusText: 'Forbidden' });
    httpMock.expectOne(r => r.url.includes('/campaigns/mine')).flush(wrapPaged([]));
    fixture.detectChanges();

    expect(component.charactersError()).toBe(false);
    expect(component.characters().length).toBe(0);
  });

  it('should show error state on non-403 errors', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(r => r.url.includes('/campaigns/mine')).flush(wrapPaged([]));
    fixture.detectChanges();

    expect(component.charactersError()).toBe(true);
  });

  it('should navigate to character sheet on viewCharacter', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onViewCharacter(7);
    expect(navigateSpy).toHaveBeenCalledWith(['/character', 7]);
  });

  it('should navigate to create-character on createCharacter', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onCreateCharacter();
    expect(navigateSpy).toHaveBeenCalledWith(['/create-character']);
  });

  it('should redirect to auth if no user', () => {
    const authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'user').mockReturnValue(null);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith(['/auth']);
  });

  it('should extract class entries from expanded subclassCards', () => {
    fixture.detectChanges();
    flushInitRequests([
      makeSheet({
        id: 1, name: 'Theron', level: 4,
        subclassCards: [
          { id: 10, name: 'Foundation', associatedClassName: 'Guardian', subclassPathName: 'Stalwart' },
        ],
      }),
    ]);
    fixture.detectChanges();

    const classEntries = component.characters()[0].classEntries;
    expect(classEntries.length).toBe(1);
    expect(classEntries[0].className).toBe('Guardian');
    expect(classEntries[0].subclassName).toBe('Stalwart');
  });

  it('should fetch campaigns on init', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    const req = httpMock.expectOne(r => r.url.includes('/campaigns/mine'));
    expect(req.request.params.get('expand')).toBe('creator');
    req.flush(wrapPaged([]));
  });

  it('should render CampaignRoster component', () => {
    fixture.detectChanges();
    flushInitRequests();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-campaign-roster')).toBeTruthy();
  });

  it('should handle campaign fetch error', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    httpMock.expectOne(r => r.url.includes('/campaigns/mine'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.campaignsError()).toBe(true);
  });

  it('should navigate to campaign on viewCampaign', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onViewCampaign(5);
    expect(navigateSpy).toHaveBeenCalledWith(['/campaign', 5]);
  });

  it('should navigate to campaigns/create on createCampaign', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onCreateCampaign();
    expect(navigateSpy).toHaveBeenCalledWith(['/campaigns/create']);
  });
});
