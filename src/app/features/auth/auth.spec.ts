import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth, ReactiveFormsModule],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to login tab', () => {
    expect(component.activeTab()).toBe('login');
  });

  it('should switch to signup tab', () => {
    component.setTab('signup');
    expect(component.activeTab()).toBe('signup');
  });

  it('should switch back to login tab', () => {
    component.setTab('signup');
    component.setTab('login');
    expect(component.activeTab()).toBe('login');
  });

  it('should clear errors when switching tabs', () => {
    component.loginError.set('Some error');
    component.setTab('signup');
    expect(component.loginError()).toBeNull();
  });

  it('should have invalid login form when empty', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('should have valid login form with username/email and password', () => {
    component.loginForm.patchValue({
      usernameOrEmail: 'test@example.com',
      password: 'password123'
    });
    expect(component.loginForm.valid).toBe(true);
  });

  it('should accept username in login form', () => {
    component.loginForm.patchValue({
      usernameOrEmail: 'myusername',
      password: 'password123'
    });
    expect(component.loginForm.valid).toBe(true);
  });

  it('should have invalid signup form when empty', () => {
    expect(component.signupForm.valid).toBe(false);
  });

  it('should have valid signup form with all fields', () => {
    component.signupForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    expect(component.signupForm.valid).toBe(true);
  });

  it('should have invalid signup form with short password', () => {
    component.signupForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'short',
      confirmPassword: 'short'
    });
    expect(component.signupForm.valid).toBe(false);
  });

  it('should have invalid signup form with mismatched passwords', () => {
    component.signupForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password456'
    });
    expect(component.signupForm.valid).toBe(false);
    expect(component.signupForm.hasError('passwordMismatch')).toBe(true);
  });

  it('should not show password mismatch until confirm field is blurred', () => {
    component.signupForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password456'
    });
    expect(component.showPasswordMismatch).toBe(false);

    component.onConfirmPasswordBlur();
    expect(component.showPasswordMismatch).toBe(true);
  });

  it('should have invalid signup form with invalid username', () => {
    component.signupForm.patchValue({
      username: 'ab',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    expect(component.signupForm.valid).toBe(false);
  });

  it('should render login tab as active by default', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const loginTab = compiled.querySelector('.auth-tab.active');
    expect(loginTab?.textContent?.trim()).toBe('Login');
  });

  it('should render login form by default', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const usernameEmailInput = compiled.querySelector('#login-username-email');
    expect(usernameEmailInput).toBeTruthy();
  });

  it('should render signup form when signup tab is active', () => {
    component.setTab('signup');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const confirmInput = compiled.querySelector('#signup-confirm');
    expect(confirmInput).toBeTruthy();
  });

  it('should have proper aria attributes on tabs', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = compiled.querySelectorAll('.auth-tab');
    expect(tabs[0].getAttribute('role')).toBe('tab');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('should show login label as Email or Username', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('label[for="login-username-email"]');
    expect(label?.textContent?.trim()).toBe('Email or Username');
  });

  it('should show error message on failed login', () => {
    component.loginForm.patchValue({
      usernameOrEmail: 'test@example.com',
      password: 'wrongpassword'
    });
    component.onLogin();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    fixture.detectChanges();
    expect(component.loginError()).toBe('Login failed. Please check your credentials and try again.');
  });

  it('should set loading state during login', () => {
    component.loginForm.patchValue({
      usernameOrEmail: 'test@example.com',
      password: 'password123'
    });
    component.onLogin();
    expect(component.isLoading()).toBe(true);

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush({ id: 1, username: 'test', email: 'test@example.com' });

    expect(component.isLoading()).toBe(false);
  });

  it('should display error alert with role attribute', () => {
    component.loginError.set('Test error');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorDiv = compiled.querySelector('.form-error');
    expect(errorDiv?.getAttribute('role')).toBe('alert');
  });
});
