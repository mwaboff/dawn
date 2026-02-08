import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { authSessionGuard } from './core/guards/auth-session.guard';

describe('App Routes', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    router = TestBed.inject(Router);
  });

  it('should have authSessionGuard on root route', () => {
    const rootRoute = routes.find(r => r.path === '');
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.canActivateChild).toContain(authSessionGuard);
  });

  it('should have child routes under root', () => {
    const rootRoute = routes.find(r => r.path === '');
    expect(rootRoute?.children).toBeDefined();
    expect(rootRoute?.children?.length).toBeGreaterThan(0);
  });

  it('should have home route as child', () => {
    const rootRoute = routes.find(r => r.path === '');
    const homeRoute = rootRoute?.children?.find(r => r.path === '');
    expect(homeRoute).toBeDefined();
  });

  it('should have auth route as child', () => {
    const rootRoute = routes.find(r => r.path === '');
    const authRoute = rootRoute?.children?.find(r => r.path === 'auth');
    expect(authRoute).toBeDefined();
  });

  it('should have create-character route', () => {
    const createCharRoute = router.config[0]?.children?.find(
      r => r.path === 'create-character'
    );
    expect(createCharRoute).toBeDefined();
  });
});
