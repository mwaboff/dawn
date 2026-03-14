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

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    expect(component).toBeTruthy();
  });

  it('should display the username', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.profile-name')?.textContent?.trim()).toBe('testadventurer');
  });

  it('should format the join date', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();
    expect(component.joinDate()).toContain('2025');
  });

  it('should request character sheets with ownerId and expand subclassCards', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    expect(req.request.params.get('ownerId')).toBe('42');
    expect(req.request.params.get('expand')).toBe('subclassCards');
    req.flush(wrapPaged([]));
  });

  it('should display characters when loaded', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([
      makeSheet({ id: 1, name: 'Aragorn', pronouns: 'he/him', level: 5 }),
      makeSheet({ id: 2, name: 'Lyra', level: 3 }),
    ]));
    fixture.detectChanges();

    const entries = fixture.nativeElement.querySelectorAll('.roster-entry');
    expect(entries.length).toBe(2);
    expect(entries[0].querySelector('.roster-character-name')?.textContent?.trim()).toBe('Aragorn');
    expect(entries[0].querySelector('.roster-level')?.textContent?.trim()).toBe('5');
  });

  it('should show empty state when no characters', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.roster-empty')).toBeTruthy();
  });

  it('should handle 403 gracefully as empty state', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets'))
      .flush(null, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(component.charactersError()).toBe(false);
    expect(component.characters().length).toBe(0);
  });

  it('should show error state on non-403 errors', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.charactersError()).toBe(true);
  });

  it('should navigate to character sheet on entry click', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets'))
      .flush(wrapPaged([makeSheet({ id: 7, name: 'Kael', level: 2 })]));
    fixture.detectChanges();

    component.onViewCharacter(7);
    expect(navigateSpy).toHaveBeenCalledWith(['/character', 7]);
  });

  it('should navigate to create-character from empty state', () => {
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

  it('should show loading skeletons initially', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.roster-skeleton').length).toBe(3);
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([]));
  });

  it('should display pronouns when present', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets'))
      .flush(wrapPaged([makeSheet({ id: 1, name: 'Zara', pronouns: 'she/her', level: 4 })]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.roster-pronouns')?.textContent?.trim()).toBe('she/her');
  });

  it('should display class and subclass from expanded subclassCards', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([
      makeSheet({
        id: 1, name: 'Theron', level: 4,
        subclassCards: [
          { id: 10, name: 'Foundation', associatedClassName: 'Guardian', subclassPathName: 'Stalwart' },
        ],
      }),
    ]));
    fixture.detectChanges();

    const classEl = fixture.nativeElement.querySelector('.roster-class');
    expect(classEl).toBeTruthy();
    expect(classEl.querySelector('.roster-class-name')?.textContent?.trim()).toBe('Guardian');
    expect(classEl.querySelector('.roster-class-subclass')?.textContent?.trim()).toBe('Stalwart');
  });

  it('should display multiple class entries separated by divider', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([
      makeSheet({
        id: 1, name: 'Duo', level: 6,
        subclassCards: [
          { id: 10, name: 'F1', associatedClassName: 'Guardian', subclassPathName: 'Stalwart' },
          { id: 11, name: 'F2', associatedClassName: 'Sorcerer', subclassPathName: 'Elementalist' },
        ],
      }),
    ]));
    fixture.detectChanges();

    const classEntries = fixture.nativeElement.querySelectorAll('.roster-class-entry');
    expect(classEntries.length).toBe(2);
    expect(classEntries[0].querySelector('.roster-class-name')?.textContent?.trim()).toBe('Guardian');
    expect(classEntries[1].querySelector('.roster-class-name')?.textContent?.trim()).toBe('Sorcerer');
  });

  it('should not display class row when no subclass cards', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets'))
      .flush(wrapPaged([makeSheet({ id: 1, name: 'Blank', level: 1 })]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.roster-class')).toBeFalsy();
  });

  it('should display class without subclass when subclassPathName is absent', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('/dh/character-sheets')).flush(wrapPaged([
      makeSheet({
        id: 1, name: 'Solo', level: 2,
        subclassCards: [{ id: 10, name: 'F1', associatedClassName: 'Ranger' }],
      }),
    ]));
    fixture.detectChanges();

    const classEl = fixture.nativeElement.querySelector('.roster-class');
    expect(classEl.querySelector('.roster-class-name')?.textContent?.trim()).toBe('Ranger');
    expect(classEl.querySelector('.roster-class-subclass')).toBeFalsy();
  });
});
