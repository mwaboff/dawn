import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { authSessionGuard } from './auth-session.guard';
import { AuthService } from '../services/auth.service';

describe('authSessionGuard', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;
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
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call checkSession on AuthService', async () => {
    const checkSessionSpy = vi.spyOn(authService, 'checkSession').mockReturnValue(of(undefined));

    await TestBed.runInInjectionContext(async () => {
      const result = authSessionGuard(mockRoute, mockState);
      await firstValueFrom(result as Observable<boolean>);
    });

    expect(checkSessionSpy).toHaveBeenCalled();
  });

  it('should return true after session check completes', async () => {
    const resultPromise = TestBed.runInInjectionContext(() => {
      const result = authSessionGuard(mockRoute, mockState);
      return firstValueFrom(result as Observable<boolean>);
    });

    httpMock.expectOne('http://localhost:8080/api/users/me').flush({});

    const result = await resultPromise;
    expect(result).toBe(true);
  });

  it('should return true even when session check fails', async () => {
    const resultPromise = TestBed.runInInjectionContext(() => {
      const result = authSessionGuard(mockRoute, mockState);
      return firstValueFrom(result as Observable<boolean>);
    });

    httpMock.expectOne('http://localhost:8080/api/users/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    const result = await resultPromise;
    expect(result).toBe(true);
  });
});
