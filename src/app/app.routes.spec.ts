import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { authSessionGuard } from './core/guards/auth-session.guard';

describe('App Routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
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
    const guardedRoute = routes.find(r => r.path === '' && r.canActivateChild);
    const createCharRoute = guardedRoute?.children?.find(
      r => r.path === 'create-character'
    );
    expect(createCharRoute).toBeDefined();
  });

  it('should have gm-screen route as child', () => {
    const guardedRoute = routes.find(r => r.path === '' && r.canActivateChild);
    const gmScreenRoute = guardedRoute?.children?.find(r => r.path === 'gm-screen');
    expect(gmScreenRoute).toBeDefined();
  });

  it('should have encounters/new route declared before encounters/:id/edit', () => {
    const guardedRoute = routes.find(r => r.path === '' && r.canActivateChild);
    const children = guardedRoute?.children ?? [];
    const newIdx = children.findIndex(r => r.path === 'encounters/new');
    const editIdx = children.findIndex(r => r.path === 'encounters/:id/edit');
    expect(newIdx).toBeGreaterThanOrEqual(0);
    expect(editIdx).toBeGreaterThanOrEqual(0);
    expect(newIdx).toBeLessThan(editIdx);
  });

  it('should have preferences route as child', () => {
    const guardedRoute = routes.find(r => r.path === '' && r.canActivateChild);
    const preferencesRoute = guardedRoute?.children?.find(r => r.path === 'preferences');
    expect(preferencesRoute).toBeDefined();
  });

  it('should have campaign/:id/gm-screen route declared before campaign/:id', () => {
    const guardedRoute = routes.find(r => r.path === '' && r.canActivateChild);
    const children = guardedRoute?.children ?? [];
    const campaignGmScreenIdx = children.findIndex(r => r.path === 'campaign/:id/gm-screen');
    const campaignIdx = children.findIndex(r => r.path === 'campaign/:id');
    expect(campaignGmScreenIdx).toBeGreaterThanOrEqual(0);
    expect(campaignIdx).toBeGreaterThanOrEqual(0);
    expect(campaignGmScreenIdx).toBeLessThan(campaignIdx);
  });

  // authSessionGuard calls AuthService.checkSession() (a real HTTP GET) on every navigation --
  // the request must be flushed or navigateByUrl() never settles and the test times out.
  async function navigateAndFlushSession(router: Router, url: string): Promise<boolean> {
    const httpMock = TestBed.inject(HttpTestingController);
    const navPromise = router.navigateByUrl(url);
    // The guard's HTTP call is issued asynchronously once the router starts processing the
    // navigation, so a tick must pass before the request exists to flush.
    await new Promise(resolve => setTimeout(resolve, 0));
    httpMock.expectOne(r => r.url.includes('/auth/me')).flush(null);
    return navPromise;
  }

  it('should resolve /campaign/5/gm-screen to the campaign gm-screen route, not campaign/:id', async () => {
    const router = TestBed.inject(Router);
    await navigateAndFlushSession(router, '/campaign/5/gm-screen');
    const activated = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(activated?.routeConfig?.path).toBe('campaign/:id/gm-screen');
  });

  it('should still resolve /campaign/5 to the plain campaign route', async () => {
    const router = TestBed.inject(Router);
    await navigateAndFlushSession(router, '/campaign/5');
    const activated = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(activated?.routeConfig?.path).toBe('campaign/:id');
  });

  it('should resolve /encounters/new to the new route, not encounters/:id/edit', async () => {
    const router = TestBed.inject(Router);
    await navigateAndFlushSession(router, '/encounters/new');
    const activated = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(activated?.routeConfig?.path).toBe('encounters/new');
  });

  it('should still resolve /encounters/5/edit to the edit route', async () => {
    const router = TestBed.inject(Router);
    await navigateAndFlushSession(router, '/encounters/5/edit');
    const activated = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(activated?.routeConfig?.path).toBe('encounters/:id/edit');
  });

  it('should resolve /encounters/5/run to the run route, not encounters/:id/edit', async () => {
    const router = TestBed.inject(Router);
    await navigateAndFlushSession(router, '/encounters/5/run');
    const activated = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(activated?.routeConfig?.path).toBe('encounters/:id/run');
  });

  it('should set a title on every child route except the home route and redirects', () => {
    const guardedRoute = routes.find(r => r.path === '' && r.canActivateChild);
    const children = guardedRoute?.children ?? [];
    const missingTitle = children.filter(
      r => r.path !== '' && !r.redirectTo && !r.title
    );
    expect(missingTitle.map(r => r.path)).toEqual([]);
  });
});
