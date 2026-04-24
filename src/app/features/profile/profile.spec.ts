import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
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
  usernameChosen: true,
};

const mockOtherUser: UserResponse = {
  id: 99,
  username: 'otherplayer',
  email: 'other@example.com',
  role: 'USER',
  createdAt: '2025-03-10T08:00:00',
  lastModifiedAt: '2025-03-10T08:00:00',
  usernameChosen: true,
};

const mockAdminUser: UserResponse = {
  id: 42,
  username: 'testadventurer',
  email: 'test@example.com',
  role: 'ADMIN',
  createdAt: '2025-06-15T10:30:00',
  lastModifiedAt: '2025-06-15T10:30:00',
  usernameChosen: true,
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

function createActivatedRoute(paramId: string | null) {
  return {
    snapshot: {
      paramMap: {
        get: (key: string) => key === 'id' ? paramId : null,
      },
    },
  };
}

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let httpMock: HttpTestingController;
  let router: Router;

  function setup(paramId: string | null = null, user: UserResponse | null = mockUser) {
    TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: createActivatedRoute(paramId) },
      ],
    });

    const authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'user').mockReturnValue(user);

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  }

  afterEach(() => {
    httpMock.verify();
  });

  function flushOwnProfileRequests(sheetData: unknown[] = [], campaignData: unknown[] = []) {
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged(sheetData));
    httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged(campaignData));
  }

  function flushOtherProfileRequests(userData: UserResponse = mockOtherUser, sheetData: unknown[] = []) {
    httpMock.expectOne(r => r.url.includes('/users/99') && !r.url.includes('/campaigns')).flush(userData);
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged(sheetData));
  }


  describe('own profile (no :id param)', () => {
    it('should create', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      expect(component).toBeTruthy();
    });

    it('should display the username', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.profile-name')?.textContent?.trim()).toBe('testadventurer');
    });

    it('should format the join date', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();
      expect(component.joinDate()).toContain('2025');
    });

    it('should set isOwnProfile to true', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      expect(component.isOwnProfile()).toBe(true);
    });

    it('should request character sheets via UserService', () => {
      setup();
      fixture.detectChanges();
      const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
      expect(req.request.params.get('ownerId')).toBe('42');
      expect(req.request.params.get('expand')).toBe('subclassCards');
      req.flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged([]));
    });

    it('should render the roster-list child component', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-roster-list')).toBeTruthy();
    });

    it('should pass characters to roster-list', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests([makeSheet({ id: 1, name: 'Aragorn', level: 5 })]);
      fixture.detectChanges();
      expect(component.characters().length).toBe(1);
      expect(component.characters()[0].name).toBe('Aragorn');
    });

    it('should handle 403 gracefully as empty state', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets'))
        .flush(null, { status: 403, statusText: 'Forbidden' });
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged([]));
      fixture.detectChanges();
      expect(component.charactersError()).toBe(false);
      expect(component.characters().length).toBe(0);
    });

    it('should show error state on non-403 errors', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets'))
        .flush(null, { status: 500, statusText: 'Server Error' });
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged([]));
      fixture.detectChanges();
      expect(component.charactersError()).toBe(true);
    });

    it('should navigate to character sheet on viewCharacter', () => {
      setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onViewCharacter(7);
      expect(navigateSpy).toHaveBeenCalledWith(['/character', 7]);
    });

    it('should navigate to create-character on createCharacter', () => {
      setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onCreateCharacter();
      expect(navigateSpy).toHaveBeenCalledWith(['/create-character']);
    });

    it('should extract class entries from expanded subclassCards', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests([
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
      setup();
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      const req = httpMock.expectOne(r => r.url.includes('/users/42/campaigns'));
      expect(req.request.params.get('expand')).toBe('creator');
      req.flush(wrapPaged([]));
    });

    it('should render CampaignRoster component', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-campaign-roster')).toBeTruthy();
    });

    it('should handle campaign fetch error', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns'))
        .flush(null, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();
      expect(component.campaignsError()).toBe(true);
    });

    it('should navigate to campaign on viewCampaign', () => {
      setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onViewCampaign(5);
      expect(navigateSpy).toHaveBeenCalledWith(['/campaign', 5]);
    });

    it('should navigate to campaigns/create on createCampaign', () => {
      setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onCreateCampaign();
      expect(navigateSpy).toHaveBeenCalledWith(['/campaigns/create']);
    });
  });

  describe('own profile via /profile/:id', () => {
    it('should use auth data directly without fetching user', () => {
      setup('42');
      fixture.detectChanges();

      // Should NOT make a /users/42 request — uses auth data
      httpMock.expectNone(r => r.url.includes('/users/42') && !r.url.includes('/campaigns') && !r.url.includes('/character-sheets'));
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged([]));

      expect(component.profileUser()).toEqual(mockUser);
      expect(component.isOwnProfile()).toBe(true);
    });

    it('should load campaigns', () => {
      setup('42');
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      const req = httpMock.expectOne(r => r.url.includes('/users/42/campaigns'));
      expect(req.request.params.get('expand')).toBe('creator');
      req.flush(wrapPaged([]));
    });
  });

  describe('other user profile via /profile/:id', () => {
    it('should fetch user from UserService', () => {
      setup('99');
      fixture.detectChanges();

      const req = httpMock.expectOne(r => r.url.includes('/users/99') && !r.url.includes('/campaigns'));
      expect(req.request.method).toBe('GET');
      req.flush(mockOtherUser);
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    });

    it('should display the other user username', () => {
      setup('99');
      fixture.detectChanges();
      flushOtherProfileRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.profile-name')?.textContent?.trim()).toBe('otherplayer');
    });

    it('should set isOwnProfile to false', () => {
      setup('99');
      fixture.detectChanges();
      flushOtherProfileRequests();
      expect(component.isOwnProfile()).toBe(false);
    });

    it('should not fetch campaigns when non-admin views other profile', () => {
      setup('99');
      fixture.detectChanges();
      flushOtherProfileRequests();
      fixture.detectChanges();

      httpMock.expectNone(r => r.url.includes('/users/99/campaigns'));
      expect(component.canViewCampaigns()).toBe(false);
      expect(fixture.nativeElement.querySelector('app-campaign-roster')).toBeFalsy();
    });

    it('should fetch campaigns when admin views other profile', () => {
      setup('99', mockAdminUser);
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/users/99') && !r.url.includes('/campaigns')).flush(mockOtherUser);
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      const req = httpMock.expectOne(r => r.url.includes('/users/99/campaigns'));
      expect(req.request.params.get('expand')).toBe('creator');
      req.flush(wrapPaged([]));
    });

    it('should map character sheets to summaries', () => {
      setup('99');
      fixture.detectChanges();
      flushOtherProfileRequests(mockOtherUser, [
        makeSheet({
          id: 1, name: 'Theron', level: 4, ownerId: 99,
          subclassCards: [
            { id: 10, name: 'Foundation', associatedClassName: 'Guardian', subclassPathName: 'Stalwart' },
          ],
        }),
      ]);
      fixture.detectChanges();

      expect(component.characters().length).toBe(1);
      expect(component.characters()[0].classEntries[0].className).toBe('Guardian');
    });
  });

  describe('error states', () => {
    it('should show "Player Not Found" on 404', () => {
      setup('99');
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/users/99') && !r.url.includes('/campaigns'))
        .flush(null, { status: 404, statusText: 'Not Found' });
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.profile-error-title')?.textContent?.trim()).toBe('Player Not Found');
    });

    it('should show "Something Went Wrong" on 500', () => {
      setup('99');
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/users/99') && !r.url.includes('/campaigns'))
        .flush(null, { status: 500, statusText: 'Server Error' });
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.profile-error-title')?.textContent?.trim()).toBe('Something Went Wrong');
    });

    it('should show not-found for invalid ID', () => {
      setup('abc');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.profile-error-title')?.textContent?.trim()).toBe('Player Not Found');
    });
  });

  describe('canDeleteItems', () => {
    it('should be true for own profile', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      expect(component.canDeleteItems()).toBe(true);
    });

    it('should be true for admin viewing other profile', () => {
      setup('99', mockAdminUser);
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/users/99') && !r.url.includes('/campaigns')).flush(mockOtherUser);
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/99/campaigns')).flush(wrapPaged([]));
      expect(component.canDeleteItems()).toBe(true);
    });

    it('should be false for non-admin viewing other profile', () => {
      setup('99');
      fixture.detectChanges();
      flushOtherProfileRequests();
      expect(component.canDeleteItems()).toBe(false);
    });
  });

  describe('delete handlers', () => {
    it('should remove character from list on successful delete', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests([
        makeSheet({ id: 1, name: 'Aragorn', level: 5 }),
        makeSheet({ id: 2, name: 'Lyra', level: 3 }),
      ]);
      fixture.detectChanges();
      expect(component.characters().length).toBe(2);

      component.onDeleteCharacter(1);
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets/1') && r.method === 'DELETE')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(component.characters().length).toBe(1);
      expect(component.characters()[0].name).toBe('Lyra');
    });

    it('should not remove character on delete error', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests([makeSheet({ id: 1, name: 'Aragorn', level: 5 })]);
      fixture.detectChanges();

      component.onDeleteCharacter(1);
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets/1') && r.method === 'DELETE')
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(component.characters().length).toBe(1);
    });

    it('should remove campaign from list on successful delete', () => {
      setup();
      fixture.detectChanges();
      const campaigns = [
        { id: 1, name: 'Dragon Slayers', isEnded: false, creatorId: 42, gameMasterIds: [42], playerIds: [], pendingCharacterSheetIds: [], playerCharacterIds: [], nonPlayerCharacterIds: [], createdAt: '2025-01-01T00:00:00', lastModifiedAt: '2025-01-01T00:00:00' },
        { id: 2, name: 'Goblin Hunters', isEnded: false, creatorId: 42, gameMasterIds: [42], playerIds: [], pendingCharacterSheetIds: [], playerCharacterIds: [], nonPlayerCharacterIds: [], createdAt: '2025-01-01T00:00:00', lastModifiedAt: '2025-01-01T00:00:00' },
      ];
      flushOwnProfileRequests([], campaigns);
      fixture.detectChanges();
      expect(component.campaigns().length).toBe(2);

      component.onDeleteCampaign(1);
      httpMock.expectOne(r => r.url.includes('/dh/campaigns/1') && r.method === 'DELETE')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(component.campaigns().length).toBe(1);
      expect(component.campaigns()[0].name).toBe('Goblin Hunters');
    });
  });

  describe('avatar display', () => {
    it('should show avatar image when user has avatarUrl', () => {
      const userWithAvatar = { ...mockUser, avatarUrl: 'https://example.com/avatar.jpg' };
      setup(null, userWithAvatar);
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.profile-avatar')).toBeTruthy();
      expect(el.querySelector('.profile-avatar')?.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    });

    it('should show sigil when user has no avatarUrl', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.profile-avatar')).toBeFalsy();
      expect(el.querySelector('.profile-sigil svg')).toBeTruthy();
    });

    it('should fall back to sigil when avatar image fails to load', () => {
      const userWithAvatar = { ...mockUser, avatarUrl: 'https://example.com/broken.jpg' };
      setup(null, userWithAvatar);
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();

      component.onAvatarError();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.profile-avatar')).toBeFalsy();
      expect(el.querySelector('.profile-sigil svg')).toBeTruthy();
    });
  });

  describe('no user + no ID', () => {
    it('should redirect to auth if no user', () => {
      setup(null, null);
      const navigateSpy = vi.spyOn(router, 'navigate');
      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(['/auth']);
    });
  });
});
