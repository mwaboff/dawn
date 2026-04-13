import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse, ChooseUsernameRequest, DevLoginRequest } from '../models/auth.model';
import { isAtLeast } from '../../shared/models/role.model';

export type { UserResponse, ChooseUsernameRequest, DevLoginRequest };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<UserResponse | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly user = computed(() => this.currentUser());
  readonly needsUsername = computed(() => {
    const user = this.currentUser();
    return user !== null && !user.usernameChosen;
  });
  readonly isAdmin = computed(() => {
    const user = this.currentUser();
    return user !== null && isAtLeast(user.role, 'ADMIN');
  });
  readonly isModerator = computed(() => {
    const user = this.currentUser();
    return user !== null && isAtLeast(user.role, 'MODERATOR');
  });
  readonly isPrivileged = computed(() => this.isModerator());

  private readonly http = inject(HttpClient);

  loginWithGoogle(): Promise<{ needsUsername?: string; error?: string }> {
    const url = `${environment.backendBaseUrl}/oauth2/authorization/google`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},popup=yes`;

    const popup = window.open(url, 'google-auth', features);

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'oauth-callback') return;

        window.removeEventListener('message', handleMessage);
        clearInterval(pollTimer);
        resolve(event.data.params);
      };

      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', handleMessage);
          reject(new Error('Popup closed'));
        }
      }, 500);

      window.addEventListener('message', handleMessage);
    });
  }

  devLogin(request: DevLoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${environment.apiUrl}/auth/dev-login`,
      request,
      { withCredentials: true }
    ).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(this.handleError)
    );
  }

  chooseUsername(request: ChooseUsernameRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${environment.apiUrl}/auth/choose-username`,
      request,
      { withCredentials: true }
    ).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(this.handleError)
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.currentUser.set(null)),
      catchError(this.handleError)
    );
  }

  clearUser(): void {
    this.currentUser.set(null);
  }

  checkSession(): Observable<UserResponse | null> {
    return this.http.get<UserResponse>(
      `${environment.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      tap(user => this.currentUser.set(user)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.currentUser.set(null);
        }
        return of(null);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error);
  }
}
