import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Auth } from './auth';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;
  let httpMock: HttpTestingController;

  function setup(queryParams: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [Auth],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] || null
              }
            }
          }
        }
      ]
    });

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('should display error from query param', () => {
    setup({ error: 'auth_failed' });
    expect(component.authError()).toBe('Sign-in failed. Please try again.');

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Sign-in failed');
  });

  it('should not display error without query param', () => {
    setup();
    expect(component.authError()).toBeNull();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).toBeFalsy();
  });

  it('should render Google sign-in button', () => {
    setup();
    const btn = fixture.nativeElement.querySelector('.google-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Google');
  });

  it('should not render login or signup forms', () => {
    setup();
    const forms = fixture.nativeElement.querySelectorAll('form');
    expect(forms.length).toBe(0);

    const tabs = fixture.nativeElement.querySelectorAll('.auth-tab');
    expect(tabs.length).toBe(0);
  });

  it('should render dev login section in dev mode', () => {
    setup();
    expect(component.isDev).toBe(true);

    const devSection = fixture.nativeElement.querySelector('.dev-login-section');
    expect(devSection).toBeTruthy();
  });

  it('should handle dev login success', () => {
    setup();
    const navigateSpy = // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn((component as any).router, 'navigate');

    component.onDevLogin();
    expect(component.isLoading()).toBe(true);

    const req = httpMock.expectOne('http://localhost:8080/api/auth/dev-login');
    req.flush({
      id: 1,
      username: 'testuser',
      role: 'USER',
      email: 'test@example.com',
      createdAt: '2026-01-01T00:00:00',
      lastModifiedAt: '2026-01-01T00:00:00',
      usernameChosen: true
    });

    expect(component.isLoading()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should navigate to choose-username when dev login returns usernameChosen false', () => {
    setup();
    const navigateSpy = // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn((component as any).router, 'navigate');

    component.onDevLogin();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/dev-login');
    req.flush({
      id: 1,
      username: 'tmp_user',
      role: 'USER',
      email: 'test@example.com',
      createdAt: '2026-01-01T00:00:00',
      lastModifiedAt: '2026-01-01T00:00:00',
      usernameChosen: false
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/choose-username']);
  });

  it('should display error on dev login failure', () => {
    setup();

    component.onDevLogin();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/dev-login');
    req.flush(null, { status: 500, statusText: 'Server Error' });

    expect(component.isLoading()).toBe(false);
    expect(component.authError()).toBe('Dev login failed.');
  });

  it('should disable Google button while loading', () => {
    setup();
    component.isLoading.set(true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.google-btn');
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Signing in');
  });
});
