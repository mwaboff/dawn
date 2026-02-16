import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

export type { UserResponse, LoginRequest, RegisterRequest };

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
