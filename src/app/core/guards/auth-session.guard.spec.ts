import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authSessionGuard } from './auth-session.guard';
import { Observable, firstValueFrom } from 'rxjs';

describe('authSessionGuard', () => {
  let httpMock: HttpTestingController;

  const mockUser = {
    id: 1, username: 'testuser', role: 'USER', email: 'test@example.com',
    createdAt: '2026-01-01T00:00:00', lastModifiedAt: '2026-01-01T00:00:00',
    usernameChosen: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function runGuard(path?: string) {
    const route = { routeConfig: { path } } as unknown as ActivatedRouteSnapshot;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return TestBed.runInInjectionContext(() => authSessionGuard(route, {} as any));
  }

  it('should allow navigation when not logged in', async () => {
    const resultPromise = firstValueFrom(runGuard('') as Observable<boolean | import('@angular/router').UrlTree>);

    httpMock.expectOne('http://localhost:8080/api/auth/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    const result = await resultPromise;
    expect(result).toBe(true);
  });

  it('should allow navigation when user has chosen username', async () => {
    const resultPromise = firstValueFrom(runGuard('') as Observable<boolean | import('@angular/router').UrlTree>);

    httpMock.expectOne('http://localhost:8080/api/auth/me').flush(mockUser);

    const result = await resultPromise;
    expect(result).toBe(true);
  });

  it('should redirect to choose-username when usernameChosen is false', async () => {
    const resultPromise = firstValueFrom(runGuard('') as Observable<boolean | import('@angular/router').UrlTree>);

    httpMock.expectOne('http://localhost:8080/api/auth/me')
      .flush({ ...mockUser, usernameChosen: false });

    const result = await resultPromise;
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('choose-username');
  });

  it('should not redirect when already on choose-username page', async () => {
    const resultPromise = firstValueFrom(runGuard('choose-username') as Observable<boolean | import('@angular/router').UrlTree>);

    httpMock.expectOne('http://localhost:8080/api/auth/me')
      .flush({ ...mockUser, usernameChosen: false });

    const result = await resultPromise;
    expect(result).toBe(true);
  });

  it('should not redirect when on auth/callback page', async () => {
    const resultPromise = firstValueFrom(runGuard('auth/callback') as Observable<boolean | import('@angular/router').UrlTree>);

    httpMock.expectOne('http://localhost:8080/api/auth/me')
      .flush({ ...mockUser, usernameChosen: false });

    const result = await resultPromise;
    expect(result).toBe(true);
  });
});
