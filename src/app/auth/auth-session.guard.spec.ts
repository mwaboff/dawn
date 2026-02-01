import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authSessionGuard } from './auth-session.guard';
import { AuthService } from './auth.service';

describe('authSessionGuard', () => {
  let authService: AuthService;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    authService = TestBed.inject(AuthService);
  });

  it('should call checkSession on AuthService', () => {
    const checkSessionSpy = vi.spyOn(authService, 'checkSession');

    TestBed.runInInjectionContext(() => {
      authSessionGuard(mockRoute, mockState);
    });

    expect(checkSessionSpy).toHaveBeenCalled();
  });

  it('should always return true to allow navigation', () => {
    const result = TestBed.runInInjectionContext(() => {
      return authSessionGuard(mockRoute, mockState);
    });

    expect(result).toBe(true);
  });
});
