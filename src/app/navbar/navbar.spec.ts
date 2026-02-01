import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { Navbar } from './navbar';
import { AuthService } from '../auth/auth.service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let authService: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onLogout', () => {
    it('should navigate to home on successful logout', () => {
      vi.spyOn(authService, 'logout').mockReturnValue(of(void 0));
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.onLogout();

      expect(authService.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to home on logout error', () => {
      vi.spyOn(authService, 'logout').mockReturnValue(throwError(() => new Error('Logout failed')));
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.onLogout();

      expect(authService.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
  });

  describe('onProfile', () => {
    it('should not throw when called', () => {
      expect(() => component.onProfile()).not.toThrow();
    });
  });

  describe('dropdown', () => {
    it('should start with dropdown closed', () => {
      fixture.detectChanges();
      expect(component.isDropdownOpen()).toBe(false);
    });

    it('should toggle dropdown when plus button is clicked', () => {
      fixture.detectChanges();
      component.toggleDropdown();
      expect(component.isDropdownOpen()).toBe(true);
      component.toggleDropdown();
      expect(component.isDropdownOpen()).toBe(false);
    });

    it('should close dropdown when closeDropdown is called', () => {
      fixture.detectChanges();
      component.isDropdownOpen.set(true);
      component.closeDropdown();
      expect(component.isDropdownOpen()).toBe(false);
    });

    it('should navigate to create-character and close dropdown when onCreateCharacter is called', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.isDropdownOpen.set(true);

      component.onCreateCharacter();

      expect(navigateSpy).toHaveBeenCalledWith(['/create-character']);
      expect(component.isDropdownOpen()).toBe(false);
    });

    it('should render plus button when logged in', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const plusButton = compiled.querySelector('.nav-create-btn');
      expect(plusButton).toBeTruthy();
    });

    it('should not render plus button when logged out', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(false);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const plusButton = compiled.querySelector('.nav-create-btn');
      expect(plusButton).toBeFalsy();
    });

    it('should show dropdown menu when open', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      fixture.detectChanges();
      component.isDropdownOpen.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const dropdown = compiled.querySelector('.nav-dropdown');
      expect(dropdown).toBeTruthy();
    });

    it('should close dropdown when clicking outside', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      fixture.detectChanges();
      component.isDropdownOpen.set(true);
      fixture.detectChanges();

      // Click outside the dropdown
      const outsideElement = fixture.nativeElement.querySelector('.nav-logo');
      outsideElement.click();
      fixture.detectChanges();

      expect(component.isDropdownOpen()).toBe(false);
    });

    it('should close dropdown when Escape key is pressed', () => {
      component.isDropdownOpen.set(true);
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onKeydown(event);
      expect(component.isDropdownOpen()).toBe(false);
    });
  });
});
