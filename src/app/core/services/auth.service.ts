import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  timezone?: string;
  role: string;
  createdAt: string;
  lastModifiedAt: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  timezone?: string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<UserResponse | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly user = computed(() => this.currentUser());

  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${environment.apiUrl}/auth/login`, request, { withCredentials: true }).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(this.handleError)
    );
  }

  register(request: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${environment.apiUrl}/auth/register`, request, { withCredentials: true }).pipe(
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

  checkSession(): Observable<void> {
    return this.http.get<UserResponse>(`${environment.apiUrl}/users/me`, { withCredentials: true }).pipe(
      tap(user => this.currentUser.set(user)),
      map(() => undefined),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.currentUser.set(null);
        }
        return of(undefined);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error);
  }
}
