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

function dividerLabels(fixture: ComponentFixture<Profile>): (string | undefined)[] {
  const el: HTMLElement = fixture.nativeElement;
  return Array.from(el.querySelectorAll('.profile-divider-label'))
    .map(label => label.textContent?.trim());
}

function viewAllLinks(fixture: ComponentFixture<Profile>): (string | undefined)[] {
  const el: HTMLElement = fixture.nativeElement;
  return Array.from(el.querySelectorAll('.roster-add-link'))
    .map(link => link.textContent?.trim());
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

  function flushOwnProfileRequests(sheetData: unknown[] = [], campaignData: unknown[] = [], encounterData: unknown[] = []) {
    flushNonItemOwnProfileRequests(sheetData, campaignData, encounterData);
    flushItemRequests();
  }

  /** For tests that need to flush the item fan-out themselves, with data. */
  function flushNonItemOwnProfileRequests(sheetData: unknown[] = [], campaignData: unknown[] = [], encounterData: unknown[] = []) {
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged(sheetData));
    httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged(campaignData));
    httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged(encounterData));
  }

  /**
   * The items panel fans out to three endpoints, so any test that lets an own-profile (or
   * admin-viewing-other) load complete has three extra requests to satisfy before `verify()`.
   */
  function flushItemRequests(weapons: unknown[] = [], armors: unknown[] = [], loot: unknown[] = []) {
    httpMock.expectOne(r => r.url.includes('/dh/weapons')).flush(wrapPaged(weapons));
    httpMock.expectOne(r => r.url.includes('/dh/armors')).flush(wrapPaged(armors));
    httpMock.expectOne(r => r.url.includes('/dh/loot')).flush(wrapPaged(loot));
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
      httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged([]));
      flushItemRequests();
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
      httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged([]));
      flushItemRequests();
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
      httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged([]));
      flushItemRequests();
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
      httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged([]));
      flushItemRequests();
    });

    it('should render a roster panel for campaigns', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();
      expect(dividerLabels(fixture)).toContain('Campaigns');
      expect(viewAllLinks(fixture)).toContain('View All Campaigns');
    });

    it('should handle campaign fetch error', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns'))
        .flush(null, { status: 500, statusText: 'Server Error' });
      httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged([]));
      flushItemRequests();
      fixture.detectChanges();
      expect(component.campaignsError()).toBe(true);
    });

    it('should navigate to campaign on viewCampaign', () => {
      setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onViewCampaign({ id: 5, name: 'C', metaPrimary: '', metaSecondary: '' });
      expect(navigateSpy).toHaveBeenCalledWith(['/campaign', 5]);
    });

    it('should navigate to campaigns/create on createCampaign', () => {
      setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onCreateCampaign();
      expect(navigateSpy).toHaveBeenCalledWith(['/campaigns/create']);
    });

    it('should fetch encounters on init, sending creatorId scoped to the current user', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged([]));
      // The server now does the creatorId scoping (composes as an AND on the usual
      // official/public/own visibility rule), so the response here is already narrowed --
      // this just confirms the request asks for the right user.
      const req = httpMock.expectOne(r => r.url.includes('/dh/encounters'));
      expect(req.request.params.get('creatorId')).toBe('42');
      req.flush(wrapPaged([
        { id: 1, name: 'Mine', isOfficial: false, isPublic: false, creatorId: 42, adversaries: [], adjustmentEasier: false, adjustmentTwoPlusSolos: false, adjustmentBonusDamage: false, adjustmentLowerTier: false, adjustmentNoElites: false, adjustmentHarder: false, suggestedBattlePoints: 10, spentBattlePoints: 5, createdAt: '2025-01-01T00:00:00', lastModifiedAt: '2025-01-01T00:00:00' },
      ]));
      flushItemRequests();
      fixture.detectChanges();

      expect(component.encounters().length).toBe(1);
      expect(component.encounters()[0].name).toBe('Mine');
    });

    it('should render a roster panel for encounters', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();
      expect(dividerLabels(fixture)).toContain('Encounters');
      expect(viewAllLinks(fixture)).toContain('View All Encounters');
    });

    it('should handle encounter fetch error', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/dh/encounters'))
        .flush(null, { status: 500, statusText: 'Server Error' });
      flushItemRequests();
      fixture.detectChanges();
      expect(component.encountersError()).toBe(true);
    });

    it('should navigate to the encounter builder on createEncounter', () => {
      setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onCreateEncounter();
      expect(navigateSpy).toHaveBeenCalledWith(['/encounters/new']);
    });

    it('should navigate to the encounter edit page on viewEncounter', () => {
      setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onViewEncounter({ id: 7, name: 'E', metaPrimary: '', metaSecondary: '' });
      expect(navigateSpy).toHaveBeenCalledWith(['/encounters/7/edit']);
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
      httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged([]));
      flushItemRequests();

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
      httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged([]));
      flushItemRequests();
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
      expect(dividerLabels(fixture)).not.toContain('Campaigns');
    });

    it('should not fetch encounters when non-admin views other profile', () => {
      setup('99');
      fixture.detectChanges();
      flushOtherProfileRequests();
      fixture.detectChanges();

      httpMock.expectNone(r => r.url.includes('/dh/encounters'));
      expect(component.canViewEncounters()).toBe(false);
      expect(dividerLabels(fixture)).not.toContain('Encounters');
    });

    it('should fetch campaigns when admin views other profile', () => {
      setup('99', mockAdminUser);
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/users/99') && !r.url.includes('/campaigns')).flush(mockOtherUser);
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      const req = httpMock.expectOne(r => r.url.includes('/users/99/campaigns'));
      expect(req.request.params.get('expand')).toBe('creator');
      req.flush(wrapPaged([]));
      flushItemRequests();
    });

    /**
     * Unlike campaigns, there's no per-user encounters endpoint, so even an admin's request to
     * `/dh/encounters` only ever answers "what the admin themselves can see" -- it can't answer
     * "what user 99 owns". Fetching and filtering it client-side would silently under-report user
     * 99's private encounters, so this stays gated to the profile's own user regardless of role.
     */
    it('should NOT fetch encounters and should NOT render an encounters roster when admin views another profile, showing an explanatory note instead', () => {
      setup('99', mockAdminUser);
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/users/99') && !r.url.includes('/campaigns')).flush(mockOtherUser);
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/99/campaigns')).flush(wrapPaged([]));
      flushItemRequests();
      fixture.detectChanges();

      httpMock.expectNone(r => r.url.includes('/dh/encounters'));
      expect(component.canViewEncounters()).toBe(false);
      // The divider still shows (this admin CAN see the Campaigns section, so a missing
      // Encounters divider would read as "this user has none" rather than "hidden from you").
      expect(dividerLabels(fixture)).toContain('Encounters');
      // Campaigns and Items render; Encounters falls to the explanatory note instead.
      expect(fixture.nativeElement.querySelectorAll('app-roster-panel').length).toBe(2);
      expect(fixture.nativeElement.querySelector('.profile-encounters-note')?.textContent?.trim())
        .toBe("Encounters aren't shown on another adventurer's profile.");
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
      flushItemRequests();
      expect(component.canDeleteItems()).toBe(true);
    });

    it('should be false for non-admin viewing other profile', () => {
      setup('99');
      fixture.detectChanges();
      flushOtherProfileRequests();
      expect(component.canDeleteItems()).toBe(false);
    });
  });

  describe('custom items panel', () => {
    const weapon = { id: 7, name: 'Ashfang', tier: 2, trait: 'AGILITY', damage: { diceType: 'D8', modifier: null, damageType: 'PHYSICAL' }, isOfficial: false, isPublic: false, createdByUserId: 42, expansionId: null, isPrimary: true, range: 'MELEE', burden: 'ONE_HANDED', createdAt: '2026-01-01T00:00:00', lastModifiedAt: '2026-01-01T00:00:00' };
    const armor = { id: 7, name: 'Emberplate', tier: 3, baseScore: 5, baseMajorThreshold: 8, baseSevereThreshold: 16, isOfficial: false, isPublic: false, createdByUserId: 42, expansionId: null, createdAt: '2026-01-01T00:00:00', lastModifiedAt: '2026-01-01T00:00:00' };

    it('should scope each of the three fetches to the profile owner', () => {
      setup();
      fixture.detectChanges();
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged([]));

      for (const path of ['/dh/weapons', '/dh/armors', '/dh/loot']) {
        const req = httpMock.expectOne(r => r.url.includes(path));
        expect(req.request.params.get('createdByUserId')).toBe('42');
        expect(req.request.params.get('sort')).toBe('NEWEST');
        req.flush(wrapPaged([]));
      }
    });

    it('should merge all three kinds into one list', () => {
      setup();
      fixture.detectChanges();
      flushNonItemOwnProfileRequests();
      flushItemRequests([weapon], [armor], [{ id: 1, name: 'Vial', tier: 1, isConsumable: true }]);
      fixture.detectChanges();

      expect(component.customItems().map(i => i.name)).toEqual(['Ashfang', 'Emberplate', 'Vial']);
    });

    it('should key entries by kind and id, so a weapon and an armor sharing id 7 stay distinct', () => {
      setup();
      fixture.detectChanges();
      flushNonItemOwnProfileRequests();
      flushItemRequests([weapon], [armor]);
      fixture.detectChanges();

      expect(component.itemRosterItems().map(i => i.key)).toEqual(['weapon:7', 'armor:7']);
    });

    it('should fail the panel rather than show a partial list when one endpoint errors', () => {
      setup();
      fixture.detectChanges();
      flushNonItemOwnProfileRequests();
      // The failing leg goes last: forkJoin cancels whatever is still open the moment one errors,
      // and a cancelled request can neither be flushed nor satisfy verify().
      httpMock.expectOne(r => r.url.includes('/dh/weapons')).flush(wrapPaged([weapon]));
      httpMock.expectOne(r => r.url.includes('/dh/loot')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/dh/armors')).flush(null, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(component.itemsError()).toBe(true);
      expect(component.customItems()).toEqual([]);
    });

    it('should not fetch items when a non-admin views another profile', () => {
      setup('99');
      fixture.detectChanges();
      flushOtherProfileRequests();
      fixture.detectChanges();

      httpMock.expectNone(r => r.url.includes('/dh/weapons'));
      expect(component.canViewItems()).toBe(false);
    });

    it('should render an Items section on an own profile', () => {
      setup();
      fixture.detectChanges();
      flushOwnProfileRequests();
      fixture.detectChanges();

      expect(dividerLabels(fixture)).toContain('Items');
    });

    it('should route the arrow to the edit page for the right kind', () => {
      setup();
      fixture.detectChanges();
      flushNonItemOwnProfileRequests();
      flushItemRequests([weapon], [armor]);
      fixture.detectChanges();

      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onViewItem(component.itemRosterItems()[1]);

      expect(navigateSpy).toHaveBeenCalledWith(['/items/armor/7/edit']);
    });

    it('should delete through the endpoint matching the entry\'s kind, not its id-twin\'s', () => {
      setup();
      fixture.detectChanges();
      flushNonItemOwnProfileRequests();
      flushItemRequests([weapon], [armor]);
      fixture.detectChanges();

      component.onDeleteItem(component.itemRosterItems()[1]);
      httpMock.expectOne(r => r.url.includes('/dh/armors/7') && r.method === 'DELETE')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(component.customItems().map(i => i.name)).toEqual(['Ashfang']);
    });

    it('should keep the item in the list when the delete fails', () => {
      setup();
      fixture.detectChanges();
      flushNonItemOwnProfileRequests();
      flushItemRequests([weapon]);
      fixture.detectChanges();

      component.onDeleteItem(component.itemRosterItems()[0]);
      httpMock.expectOne(r => r.url.includes('/dh/weapons/7') && r.method === 'DELETE')
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(component.customItems().length).toBe(1);
    });

    it('should navigate to the item builder on createItem', () => {
      setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onCreateItem();
      expect(navigateSpy).toHaveBeenCalledWith(['/items/new']);
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

      component.onDeleteCampaign({ id: 1, name: 'C', metaPrimary: '', metaSecondary: '' });
      httpMock.expectOne(r => r.url.includes('/dh/campaigns/1') && r.method === 'DELETE')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(component.campaigns().length).toBe(1);
      expect(component.campaigns()[0].name).toBe('Goblin Hunters');
    });

    it('should remove encounter from list on successful delete', () => {
      setup();
      fixture.detectChanges();
      const encounters = [
        { id: 1, name: 'Goblin Ambush', isOfficial: false, isPublic: false, creatorId: 42, adversaries: [], adjustmentEasier: false, adjustmentTwoPlusSolos: false, adjustmentBonusDamage: false, adjustmentLowerTier: false, adjustmentNoElites: false, adjustmentHarder: false, suggestedBattlePoints: 10, spentBattlePoints: 5, createdAt: '2025-01-01T00:00:00', lastModifiedAt: '2025-01-01T00:00:00' },
        { id: 2, name: 'Dragon Roost', isOfficial: false, isPublic: false, creatorId: 42, adversaries: [], adjustmentEasier: false, adjustmentTwoPlusSolos: false, adjustmentBonusDamage: false, adjustmentLowerTier: false, adjustmentNoElites: false, adjustmentHarder: false, suggestedBattlePoints: 10, spentBattlePoints: 5, createdAt: '2025-01-01T00:00:00', lastModifiedAt: '2025-01-01T00:00:00' },
      ];
      httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/users/42/campaigns')).flush(wrapPaged([]));
      httpMock.expectOne(r => r.url.includes('/dh/encounters')).flush(wrapPaged(encounters));
      flushItemRequests();
      fixture.detectChanges();
      expect(component.encounters().length).toBe(2);

      component.onDeleteEncounter({ id: 1, name: 'E', metaPrimary: '', metaSecondary: '' });
      httpMock.expectOne(r => r.url.includes('/dh/encounters/1') && r.method === 'DELETE')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(component.encounters().length).toBe(1);
      expect(component.encounters()[0].name).toBe('Dragon Roost');
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
