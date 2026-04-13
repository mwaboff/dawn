import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let httpMock: HttpTestingController;
  let router: Router;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should allow access when user is ADMIN', async () => {
    const resultPromise = TestBed.runInInjectionContext(() => {
      const result = adminGuard(mockRoute, mockState);
      return firstValueFrom(result as Observable<boolean>);
    });

    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      id: 1, username: 'admin', email: 'a@b.com', role: 'ADMIN',
      createdAt: '', lastModifiedAt: '', usernameChosen: true,
    });

    const result = await resultPromise;
    expect(result).toBe(true);
  });

  it('should allow access when user is OWNER', async () => {
    const resultPromise = TestBed.runInInjectionContext(() => {
      const result = adminGuard(mockRoute, mockState);
      return firstValueFrom(result as Observable<boolean>);
    });

    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      id: 1, username: 'owner', email: 'a@b.com', role: 'OWNER',
      createdAt: '', lastModifiedAt: '', usernameChosen: true,
    });

    const result = await resultPromise;
    expect(result).toBe(true);
  });

  it('should redirect non-admin users to home', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    const resultPromise = TestBed.runInInjectionContext(() => {
      const result = adminGuard(mockRoute, mockState);
      return firstValueFrom(result as Observable<boolean>);
    });

    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      id: 1, username: 'user', email: 'a@b.com', role: 'USER',
      createdAt: '', lastModifiedAt: '', usernameChosen: true,
    });

    const result = await resultPromise;
    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should redirect unauthenticated users to home', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    const resultPromise = TestBed.runInInjectionContext(() => {
      const result = adminGuard(mockRoute, mockState);
      return firstValueFrom(result as Observable<boolean>);
    });

    httpMock.expectOne('http://localhost:8080/api/auth/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    const result = await resultPromise;
    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});
