import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { Player } from './player';
import { AuthService, UserResponse } from '../../core/services/auth.service';

const mockUser: UserResponse = {
  id: 42,
  username: 'testadventurer',
  email: 'test@example.com',
  role: 'USER',
  createdAt: '2025-06-15T10:30:00',
  lastModifiedAt: '2025-06-15T10:30:00',
};

const mockPlayerUser: UserResponse = {
  id: 99,
  username: 'otherplayer',
  email: 'other@example.com',
  role: 'USER',
  createdAt: '2025-03-10T08:00:00',
  lastModifiedAt: '2025-03-10T08:00:00',
};

function makeSheet(overrides: Record<string, unknown> = {}) {
  return {
    id: 1, name: 'Kael', level: 3, evasion: 10,
    armorMax: 5, armorMarked: 0, majorDamageThreshold: 3, severeDamageThreshold: 6,
    agilityModifier: 0, agilityMarked: false, strengthModifier: 0, strengthMarked: false,
    finesseModifier: 0, finesseMarked: false, instinctModifier: 0, instinctMarked: false,
    presenceModifier: 0, presenceMarked: false, knowledgeModifier: 0, knowledgeMarked: false,
    hitPointMax: 10, hitPointMarked: 0, stressMax: 6, stressMarked: 0,
    hopeMax: 3, hopeMarked: 0, gold: 50, ownerId: 99,
    communityCardIds: [], ancestryCardIds: [], subclassCardIds: [], domainCardIds: [],
    inventoryWeaponIds: [], inventoryArmorIds: [], inventoryItemIds: [], experienceIds: [],
    createdAt: '2025-06-15T10:30:00', lastModifiedAt: '2025-06-15T10:30:00',
    ...overrides,
  };
}

function wrapPaged(content: unknown[]) {
  return { content, totalElements: content.length, totalPages: 1, currentPage: 0, pageSize: 100 };
}

describe('Player', () => {
  let component: Player;
  let fixture: ComponentFixture<Player>;
  let httpMock: HttpTestingController;
  let router: Router;

  function setup(paramId: string) {
    TestBed.configureTestingModule({
      imports: [Player],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => paramId } } },
        },
      ],
    });

    const authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'user').mockReturnValue(mockUser);

    fixture = TestBed.createComponent(Player);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    setup('99');
    fixture.detectChanges();

    httpMock.expectOne(r => r.url.includes('/users/99')).flush(mockPlayerUser);
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));

    expect(component).toBeTruthy();
  });

  it('should fetch user profile on init', () => {
    setup('99');
    fixture.detectChanges();

    const req = httpMock.expectOne(r => r.url.includes('/users/99'));
    expect(req.request.method).toBe('GET');
    req.flush(mockPlayerUser);
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
  });

  it('should fetch character sheets for the player', () => {
    setup('99');
    fixture.detectChanges();

    httpMock.expectOne(r => r.url.includes('/users/99')).flush(mockPlayerUser);
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    expect(req.request.params.get('ownerId')).toBe('99');
    expect(req.request.params.get('expand')).toBe('subclassCards');
    req.flush(wrapPaged([]));
  });

  it('should display the player username', () => {
    setup('99');
    fixture.detectChanges();

    httpMock.expectOne(r => r.url.includes('/users/99')).flush(mockPlayerUser);
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.profile-name')?.textContent?.trim()).toBe('otherplayer');
  });

  it('should display the join date', () => {
    setup('99');
    fixture.detectChanges();

    httpMock.expectOne(r => r.url.includes('/users/99')).flush(mockPlayerUser);
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    expect(component.joinDate()).toContain('2025');
  });

  it('should render RosterList with showCreateButton false', () => {
    setup('99');
    fixture.detectChanges();

    httpMock.expectOne(r => r.url.includes('/users/99')).flush(mockPlayerUser);
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-roster-list')).toBeTruthy();
  });

  it('should redirect to /profile when viewing own profile', () => {
    setup('42');
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/profile']);
  });

  it('should show "Player Not Found" on 404', () => {
    setup('99');
    fixture.detectChanges();

    httpMock.expectOne(r => r.url.includes('/users/99'))
      .flush(null, { status: 404, statusText: 'Not Found' });
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.player-error-title')?.textContent?.trim()).toBe('Player Not Found');
  });

  it('should show error on non-404 errors', () => {
    setup('99');
    fixture.detectChanges();

    httpMock.expectOne(r => r.url.includes('/users/99'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.player-error-title')?.textContent?.trim()).toBe('Something Went Wrong');
  });

  it('should handle invalid id', () => {
    setup('abc');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.player-error-title')?.textContent?.trim()).toBe('Player Not Found');
  });

  it('should map character sheets to summaries', () => {
    setup('99');
    fixture.detectChanges();

    httpMock.expectOne(r => r.url.includes('/users/99')).flush(mockPlayerUser);
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([
      makeSheet({
        id: 1, name: 'Theron', level: 4,
        subclassCards: [
          { id: 10, name: 'Foundation', associatedClassName: 'Guardian', subclassPathName: 'Stalwart' },
        ],
      }),
    ]));
    fixture.detectChanges();

    expect(component.characters().length).toBe(1);
    expect(component.characters()[0].classEntries[0].className).toBe('Guardian');
  });
});
