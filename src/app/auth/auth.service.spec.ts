import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, UserResponse, LoginRequest, RegisterRequest } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: UserResponse = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'USER',
    createdAt: '2024-01-01T00:00:00Z',
    lastModifiedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially be logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.user()).toBeNull();
  });

  describe('login', () => {
    it('should login successfully and update user state', () => {
      const loginRequest: LoginRequest = {
        usernameOrEmail: 'test@example.com',
        password: 'password123'
      };

      service.login(loginRequest).subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(service.isLoggedIn()).toBe(true);
        expect(service.user()).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockUser);
    });

    it('should handle login failure', () => {
      const loginRequest: LoginRequest = {
        usernameOrEmail: 'test@example.com',
        password: 'wrongpassword'
      };

      service.login(loginRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(service.isLoggedIn()).toBe(false);
        }
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('should register successfully and update user state', () => {
      const registerRequest: RegisterRequest = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };

      service.register(registerRequest).subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(service.isLoggedIn()).toBe(true);
        expect(service.user()).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockUser);
    });

    it('should handle registration failure', () => {
      const registerRequest: RegisterRequest = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      };

      service.register(registerRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
          expect(service.isLoggedIn()).toBe(false);
        }
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/register');
      req.flush({ message: 'Username already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear user state', () => {
      service.login({ usernameOrEmail: 'test', password: 'test' }).subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush(mockUser);

      expect(service.isLoggedIn()).toBe(true);

      service.logout().subscribe(() => {
        expect(service.isLoggedIn()).toBe(false);
        expect(service.user()).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);
    });
  });

  describe('clearUser', () => {
    it('should clear user state without API call', () => {
      service.login({ usernameOrEmail: 'test', password: 'test' }).subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush(mockUser);

      expect(service.isLoggedIn()).toBe(true);

      service.clearUser();

      expect(service.isLoggedIn()).toBe(false);
      expect(service.user()).toBeNull();
    });
  });

  describe('checkSession', () => {
    beforeEach(() => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: ''
      });
    });

    it('should clear user state when AUTH_TOKEN cookie is missing and user is logged in', () => {
      service.login({ usernameOrEmail: 'test', password: 'test' }).subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush(mockUser);

      expect(service.isLoggedIn()).toBe(true);

      document.cookie = '';
      service.checkSession();

      expect(service.isLoggedIn()).toBe(false);
      expect(service.user()).toBeNull();
    });

    it('should not clear user state when AUTH_TOKEN cookie exists', () => {
      service.login({ usernameOrEmail: 'test', password: 'test' }).subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush(mockUser);

      expect(service.isLoggedIn()).toBe(true);

      document.cookie = 'AUTH_TOKEN=abc123';
      service.checkSession();

      expect(service.isLoggedIn()).toBe(true);
      expect(service.user()).toEqual(mockUser);
    });

    it('should do nothing when already logged out', () => {
      expect(service.isLoggedIn()).toBe(false);

      document.cookie = '';
      service.checkSession();

      expect(service.isLoggedIn()).toBe(false);
      expect(service.user()).toBeNull();
    });

    it('should handle AUTH_TOKEN among multiple cookies', () => {
      service.login({ usernameOrEmail: 'test', password: 'test' }).subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush(mockUser);

      document.cookie = 'other=value; AUTH_TOKEN=abc123; another=test';
      service.checkSession();

      expect(service.isLoggedIn()).toBe(true);
    });
  });
});
