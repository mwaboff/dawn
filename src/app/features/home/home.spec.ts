import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { Home } from './home';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { LANDING_STEPS } from './landing.model';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;

  function setup(isLoggedIn = false): HTMLElement {
    const mockAuthService = {
      isLoggedIn: signal(isLoggedIn),
      user: signal(isLoggedIn ? { id: 1, username: 'Aragorn', usernameChosen: true, role: 'USER' } : null),
    };
    const emptyPage = { content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20 };
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: { getUserCharacterSheets: vi.fn().mockReturnValue(of(emptyPage)) } },
        { provide: CampaignService, useValue: { getMyCampaigns: vi.fn().mockReturnValue(of(emptyPage)) } },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  describe('when logged out', () => {
    it('renders the landing hero', () => {
      const el = setup();
      expect(el.querySelector('app-landing-hero')).toBeTruthy();
    });

    it('renders one showcase row per landing step', () => {
      const el = setup();
      expect(el.querySelectorAll('app-landing-showcase').length).toBe(LANDING_STEPS.length);
    });

    it('alternates showcase rows so every second one is reversed', () => {
      const el = setup();
      const reversed = Array.from(el.querySelectorAll('app-landing-showcase')).map(row => row.classList.contains('reversed'));
      expect(reversed).toEqual(LANDING_STEPS.map((_, i) => i % 2 === 1));
    });

    it('renders the steps section heading', () => {
      const el = setup();
      expect(el.querySelector('#landing-steps-title')?.textContent).toContain('From first roll to final encounter');
    });

    it('renders the feature grid and closing call to action', () => {
      const el = setup();
      expect(el.querySelector('app-landing-features') && el.querySelector('app-landing-closing')).toBeTruthy();
    });

    it('does not render the dashboard', () => {
      const el = setup();
      expect(el.querySelector('app-dashboard')).toBeNull();
    });
  });

  describe('when logged in', () => {
    it('renders the dashboard', () => {
      const el = setup(true);
      expect(el.querySelector('app-dashboard')).toBeTruthy();
    });

    it('does not render the landing page', () => {
      const el = setup(true);
      expect(el.querySelector('app-landing-hero')).toBeNull();
    });
  });
});
