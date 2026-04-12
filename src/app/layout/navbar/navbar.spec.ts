import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { Navbar } from './navbar';
import { AuthService } from '../../core/services/auth.service';

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
    it('should navigate to home and close user menu on successful logout', () => {
      vi.spyOn(authService, 'logout').mockReturnValue(of(void 0));
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.isUserMenuOpen.set(true);

      component.onLogout();

      expect(authService.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
      expect(component.isUserMenuOpen()).toBe(false);
    });

    it('should log error and navigate to home on logout error', () => {
      const error = new Error('Logout failed');
      vi.spyOn(authService, 'logout').mockReturnValue(throwError(() => error));
      const navigateSpy = vi.spyOn(router, 'navigate');
      const consoleSpy = vi.spyOn(console, 'error').mockReturnValue(undefined);
      component.isUserMenuOpen.set(true);

      component.onLogout();

      expect(authService.logout).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', error);
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
      expect(component.isUserMenuOpen()).toBe(false);
    });
  });

  describe('admin link', () => {
    it('should show admin link when user is admin', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      vi.spyOn(authService, 'isAdmin').mockReturnValue(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const adminLink = compiled.querySelector('a[routerLink="/admin"]');
      expect(adminLink).toBeTruthy();
    });

    it('should not show admin link when user is not admin', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      vi.spyOn(authService, 'isAdmin').mockReturnValue(false);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const adminLink = compiled.querySelector('a[routerLink="/admin"]');
      expect(adminLink).toBeFalsy();
    });
  });

  describe('profile link', () => {
    it('should render profile as routerLink inside user menu', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      fixture.detectChanges();
      component.isUserMenuOpen.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const profileLink = compiled.querySelector('a[routerLink="/profile"]');
      expect(profileLink).toBeTruthy();
    });
  });

  describe('user menu', () => {
    it('should start with user menu closed', () => {
      fixture.detectChanges();
      expect(component.isUserMenuOpen()).toBe(false);
    });

    it('should toggle user menu when avatar button is clicked', () => {
      fixture.detectChanges();
      component.toggleUserMenu();
      expect(component.isUserMenuOpen()).toBe(true);
      component.toggleUserMenu();
      expect(component.isUserMenuOpen()).toBe(false);
    });

    it('should close user menu when closeUserMenu is called', () => {
      fixture.detectChanges();
      component.isUserMenuOpen.set(true);
      component.closeUserMenu();
      expect(component.isUserMenuOpen()).toBe(false);
    });

    it('should render user menu button when logged in', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.nav-user-btn');
      expect(btn).toBeTruthy();
    });

    it('should not render user menu button when logged out', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(false);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.nav-user-btn');
      expect(btn).toBeFalsy();
    });

    it('should show Profile and Logout when user menu is open', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      fixture.detectChanges();
      component.isUserMenuOpen.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('.nav-user-menu-item');
      const texts = Array.from(items).map(el => el.textContent?.trim());
      expect(texts).toContain('Profile');
      expect(texts).toContain('Logout');
    });

    it('should close user menu when clicking outside', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      fixture.detectChanges();
      component.isUserMenuOpen.set(true);
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.nav-logo').click();
      fixture.detectChanges();
      expect(component.isUserMenuOpen()).toBe(false);
    });

    it('should close user menu on Escape key', () => {
      component.isUserMenuOpen.set(true);
      component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.isUserMenuOpen()).toBe(false);
    });
  });

  describe('Reference link', () => {
    it('should render Reference link when logged in', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const links = compiled.querySelectorAll('a[routerLink="/reference"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should render Reference link when logged out', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(false);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const links = compiled.querySelectorAll('a[routerLink="/reference"]');
      expect(links.length).toBeGreaterThan(0);
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

    it('should navigate to campaigns/create and close dropdown when onCreateCampaign is called', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.isDropdownOpen.set(true);

      component.onCreateCampaign();

      expect(navigateSpy).toHaveBeenCalledWith(['/campaigns/create']);
      expect(component.isDropdownOpen()).toBe(false);
    });

    it('should show Create Campaign in dropdown when open', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
      fixture.detectChanges();
      component.isDropdownOpen.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('.nav-dropdown-item');
      const texts = Array.from(items).map(el => el.textContent?.trim());
      expect(texts).toContain('Create Campaign');
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
