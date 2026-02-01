import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';

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

const API_URL = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<UserResponse | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly user = computed(() => this.currentUser());

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${API_URL}/auth/login`, request, { withCredentials: true }).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(this.handleError)
    );
  }

  register(request: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${API_URL}/auth/register`, request, { withCredentials: true }).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(this.handleError)
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.currentUser.set(null)),
      catchError(this.handleError)
    );
  }

  clearUser(): void {
    this.currentUser.set(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error);
  }
}
