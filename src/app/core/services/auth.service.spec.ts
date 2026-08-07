import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { UserResponse } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: UserResponse = {
    id: 1,
    username: 'testuser',
    role: 'USER',
    email: 'test@example.com',
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    usernameChosen: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
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

  describe('initial state', () => {
    it('should not be logged in initially', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should have null user initially', () => {
      expect(service.user()).toBeNull();
    });

    it('should not need username initially', () => {
      expect(service.needsUsername()).toBe(false);
    });
  });

  describe('checkSession', () => {
    it('should set user on successful session check', () => {
      service.checkSession().subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/me');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockUser);

      expect(service.isLoggedIn()).toBe(true);
      expect(service.user()).toEqual(mockUser);
    });

    it('should clear user on 401', () => {
      service.checkSession().subscribe(user => {
        expect(user).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/me');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(service.isLoggedIn()).toBe(false);
    });

    it('should detect user needing username', () => {
      const newUser = { ...mockUser, usernameChosen: false };
      service.checkSession().subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/auth/me');
      req.flush(newUser);

      expect(service.needsUsername()).toBe(true);
    });
  });

  describe('chooseUsername', () => {
    it('should update user after choosing username', () => {
      service.chooseUsername({ username: 'newname' }).subscribe(user => {
        expect(user.username).toBe('newname');
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/choose-username');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'newname' });
      expect(req.request.withCredentials).toBe(true);
      req.flush({ ...mockUser, username: 'newname' });

      expect(service.user()?.username).toBe('newname');
    });

    it('should propagate errors', () => {
      let errorStatus = 0;
      service.chooseUsername({ username: 'taken' }).subscribe({
        error: (e: { status: number }) => { errorStatus = e.status; }
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/choose-username');
      req.flush({ message: 'Username taken' }, { status: 409, statusText: 'Conflict' });

      expect(errorStatus).toBe(409);
    });
  });

  describe('devLogin', () => {
    it('should set user on dev login', () => {
      service.devLogin({ email: 'test@example.com' }).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/dev-login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com' });
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockUser);

      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user on logout', () => {
      // First set a user
      service.checkSession().subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/me').flush(mockUser);
      expect(service.isLoggedIn()).toBe(true);

      // Then logout
      service.logout().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush(null);

      expect(service.isLoggedIn()).toBe(false);
      expect(service.user()).toBeNull();
    });
  });

  describe('clearUser', () => {
    it('should reset user to null', () => {
      service.checkSession().subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/me').flush(mockUser);
      expect(service.isLoggedIn()).toBe(true);

      service.clearUser();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('role checks', () => {
    it('should detect admin role', () => {
      service.checkSession().subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/me').flush({ ...mockUser, role: 'ADMIN' });
      expect(service.isAdmin()).toBe(true);
    });

    it('should detect moderator role', () => {
      service.checkSession().subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/me').flush({ ...mockUser, role: 'MODERATOR' });
      expect(service.isModerator()).toBe(true);
    });

    it('should not be admin for regular user', () => {
      service.checkSession().subscribe();
      httpMock.expectOne('http://localhost:8080/api/auth/me').flush(mockUser);
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('loginWithGoogle', () => {
    let open: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.useFakeTimers();
      open = vi.spyOn(window, 'open');
    });

    afterEach(() => {
      vi.useRealTimers();
      open.mockRestore();
    });

    /**
     * A blocked popup used to leave a 2 Hz interval and a `message` listener running forever, on a
     * root-scoped service -- so every further sign-in click stacked another set.
     */
    it('rejects immediately when the popup is blocked, rather than polling forever', async () => {
      open.mockReturnValue(null);
      const setInterval = vi.spyOn(globalThis, 'setInterval');
      const addListener = vi.spyOn(window, 'addEventListener');

      await expect(service.loginWithGoogle()).rejects.toThrow('Popup blocked');

      expect(setInterval).not.toHaveBeenCalled();
      expect(addListener).not.toHaveBeenCalled();
    });

    it('rejects and stops polling once the user closes the popup', async () => {
      const popup = { closed: false } as Window;
      open.mockReturnValue(popup);
      const clearInterval = vi.spyOn(globalThis, 'clearInterval');

      const pending = service.loginWithGoogle();
      (popup as { closed: boolean }).closed = true;
      vi.advanceTimersByTime(500);

      await expect(pending).rejects.toThrow('Popup closed');
      expect(clearInterval).toHaveBeenCalled();
    });

    it('gives up on a popup left open, so its timers cannot outlive the attempt', async () => {
      open.mockReturnValue({ closed: false } as Window);
      const removeListener = vi.spyOn(window, 'removeEventListener');

      const pending = service.loginWithGoogle();
      vi.advanceTimersByTime(5 * 60 * 1000);

      await expect(pending).rejects.toThrow('Sign-in timed out');
      expect(removeListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('resolves on the callback message and tears everything down', async () => {
      open.mockReturnValue({ closed: false } as Window);
      const clearInterval = vi.spyOn(globalThis, 'clearInterval');
      const clearTimeout = vi.spyOn(globalThis, 'clearTimeout');

      const pending = service.loginWithGoogle();
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'oauth-callback', params: {} },
          origin: window.location.origin,
        }),
      );

      await expect(pending).resolves.toEqual({});
      expect(clearInterval).toHaveBeenCalled();
      expect(clearTimeout).toHaveBeenCalled();
    });
  });
});
