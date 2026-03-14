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
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });

    expect(component).toBeTruthy();
  });

  it('should display the username', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.profile-name')?.textContent?.trim()).toBe('testadventurer');
  });

  it('should format the join date', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });
    fixture.detectChanges();

    expect(component.joinDate()).toContain('2025');
  });

  it('should request character sheets with ownerId', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    expect(req.request.params.get('ownerId')).toBe('42');
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });
  });

  it('should display characters when loaded', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush({
      content: [
        { id: 1, name: 'Aragorn', pronouns: 'he/him', level: 5, createdAt: '2025-06-15T10:30:00' },
        { id: 2, name: 'Lyra', level: 3, createdAt: '2025-07-01T08:00:00' },
      ],
      totalElements: 2,
      totalPages: 1,
      currentPage: 0,
      pageSize: 100,
    });
    fixture.detectChanges();

    const entries = fixture.nativeElement.querySelectorAll('.roster-entry');
    expect(entries.length).toBe(2);
    expect(entries[0].querySelector('.roster-character-name')?.textContent?.trim()).toBe('Aragorn');
    expect(entries[0].querySelector('.roster-level')?.textContent?.trim()).toBe('5');
  });

  it('should show empty state when no characters', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });
    fixture.detectChanges();

    const emptyEl = fixture.nativeElement.querySelector('.roster-empty');
    expect(emptyEl).toBeTruthy();
  });

  it('should handle 403 gracefully as empty state', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush(null, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(component.charactersError()).toBe(false);
    expect(component.characters().length).toBe(0);
  });

  it('should show error state on non-403 errors', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.charactersError()).toBe(true);
  });

  it('should navigate to character sheet on entry click', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush({
      content: [{ id: 7, name: 'Kael', level: 2, createdAt: '2025-08-01T00:00:00' }],
      totalElements: 1, totalPages: 1, currentPage: 0, pageSize: 100,
    });
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

    const skeletons = fixture.nativeElement.querySelectorAll('.roster-skeleton');
    expect(skeletons.length).toBe(3);

    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });
  });

  it('should display pronouns when present', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/dh/character-sheets'));
    req.flush({
      content: [{ id: 1, name: 'Zara', pronouns: 'she/her', level: 4, createdAt: '2025-06-15T10:30:00' }],
      totalElements: 1, totalPages: 1, currentPage: 0, pageSize: 100,
    });
    fixture.detectChanges();

    const pronouns = fixture.nativeElement.querySelector('.roster-pronouns');
    expect(pronouns?.textContent?.trim()).toBe('she/her');
  });
});
