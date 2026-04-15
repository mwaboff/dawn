# Implementation Plan: OAuth Authentication Flow

## Overview

Replace the existing username/password auth with Google OAuth2 login via a **popup window**. The backend already supports OAuth — the frontend needs to catch up, and the backend needs a small redirect target change to support the popup pattern.

**Key backend endpoints:**
- `GET /oauth2/authorization/google` — initiates Google OAuth flow (redirect chain)
- `GET /api/auth/me` — session check, returns `usernameChosen` boolean
- `POST /api/auth/choose-username` — first-time users pick a username
- `POST /api/auth/logout` — clears AUTH_TOKEN cookie
- `POST /api/auth/dev-login` — dev-only mock login (no Google needed locally)

---

## Required Backend Changes

### 1. Change OAuth redirect targets to `/auth/callback`

The popup flow requires the backend to redirect to a dedicated callback URL (instead of `/` or `/choose-username`) so the popup can communicate back to the parent window and close itself.

**In `OAuth2LoginSuccessHandler`:**
```
# WAS:
usernameChosen == false → redirect to ${FRONTEND_BASE_URL}/choose-username
usernameChosen == true  → redirect to ${FRONTEND_BASE_URL}

# CHANGE TO:
usernameChosen == false → redirect to ${FRONTEND_BASE_URL}/auth/callback?needsUsername=true
usernameChosen == true  → redirect to ${FRONTEND_BASE_URL}/auth/callback?needsUsername=false
```

**In `OAuth2LoginFailureHandler`:**
```
# WAS:
redirect to ${FRONTEND_BASE_URL}/login?error

# CHANGE TO:
redirect to ${FRONTEND_BASE_URL}/auth/callback?error=auth_failed
```

### 2. Verify Cookie Configuration

- `SameSite=Lax` (NOT `Strict`) — `Strict` breaks the OAuth redirect because the request originates from Google's domain
- `Path=/` — so the cookie is sent on all requests
- `HttpOnly` — already set

### 3. Verify CORS

Ensure CORS allows `http://localhost:4200` with `withCredentials: true` for the API calls (`/api/auth/me`, `/api/auth/choose-username`, `/api/auth/logout`). The OAuth redirect chain itself doesn't need CORS.

### 4. Verify `FRONTEND_BASE_URL`

Must be set to `http://localhost:4200` in dev. The success/failure handlers use this for the callback redirect.

---

## Step-by-Step Frontend Implementation

### Step 1: Update Auth Models

**File: `src/app/core/models/auth.model.ts`**

Remove `LoginRequest` and `RegisterRequest`. Update `UserResponse` to include `usernameChosen`. Add `ChooseUsernameRequest`.

```typescript
import { Role } from '../../shared/models/role.model';

export interface UserResponse {
  id: number;
  username: string;
  role: Role;
  email?: string;          // Now nullable (OAuth provider may not expose it)
  avatarUrl?: string;
  timezone?: string;
  createdAt: string;
  lastModifiedAt: string;
  usernameChosen: boolean;  // false for first-time OAuth users
}

export interface ChooseUsernameRequest {
  username: string;
}

export interface DevLoginRequest {
  email: string;
  role?: string;
  username?: string;
}
```

### Step 2: Update Environment Config

**File: `src/environments/environment.ts`**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  backendBaseUrl: 'http://localhost:8080',
};
```

**File: `src/environments/environment.prod.ts`**

```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  backendBaseUrl: '',
};
```

### Step 3: Update AuthService

**File: `src/app/core/services/auth.service.ts`**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<UserResponse | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly user = computed(() => this.currentUser());
  readonly needsUsername = computed(() => {
    const user = this.currentUser();
    return user !== null && !user.usernameChosen;
  });
  // isAdmin, isModerator, isPrivileged — unchanged

  private readonly http = inject(HttpClient);

  // REMOVE: login() and register()

  // Opens Google OAuth in a popup window.
  // Returns a Promise that resolves with the callback query params
  // when the popup communicates back via postMessage.
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
        // Only accept messages from our own origin
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'oauth-callback') return;

        window.removeEventListener('message', handleMessage);
        clearInterval(pollTimer);
        resolve(event.data.params);
      };

      // Poll in case popup is closed without completing auth (user closed it)
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

  // Dev-only login (no Google needed)
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

  // UPDATED: uses /api/auth/me (includes usernameChosen), returns UserResponse | null
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

  // logout(), clearUser(), handleError() — unchanged
}
```

### Step 4: Create Auth Callback Component

**New file: `src/app/features/auth/auth-callback/auth-callback.ts`**

This is the lightweight component that loads inside the popup after Google redirects back. It reads the query params, posts a message to the parent window, and closes itself.

```typescript
@Component({
  selector: 'app-auth-callback',
  template: `<p style="text-align:center;padding:2rem;color:#f5e6d3;font-family:Lora,serif;">Completing sign-in...</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthCallback {
  constructor() {
    const params = new URLSearchParams(window.location.search);
    const data = {
      type: 'oauth-callback',
      params: {
        needsUsername: params.get('needsUsername'),
        error: params.get('error')
      }
    };

    if (window.opener) {
      // We're in a popup — send result to parent and close
      window.opener.postMessage(data, window.location.origin);
      window.close();
    } else {
      // Fallback: user navigated here directly (not in popup)
      // Redirect based on params
      const router = inject(Router);
      if (data.params.error) {
        router.navigate(['/auth'], { queryParams: { error: data.params.error } });
      } else if (data.params.needsUsername === 'true') {
        router.navigate(['/choose-username']);
      } else {
        router.navigate(['/']);
      }
    }
  }
}
```

### Step 5: Update Auth Session Guard

**File: `src/app/core/guards/auth-session.guard.ts`**

Add `usernameChosen` redirect logic. The guard must NOT redirect if the user is heading to `/choose-username` or `/auth/callback` (to avoid infinite loops).

```typescript
export const authSessionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkSession().pipe(
    map((user) => {
      if (user && !user.usernameChosen) {
        const path = route.routeConfig?.path;
        if (path !== 'choose-username' && path !== 'auth/callback') {
          return router.createUrlTree(['/choose-username']);
        }
      }
      return true;
    })
  );
};
```

### Step 6: Rewrite the Auth (Login) Page

**File: `src/app/features/auth/auth.ts`**

Drastically simplified — Google button + optional dev login.

```typescript
@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule],   // Only needed if dev login form is present
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Auth {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authError = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly isDev = !environment.production;

  // Dev login form
  readonly devEmail = signal('test@example.com');

  constructor() {
    // Check for error query param (from callback fallback or direct navigation)
    const errorParam = this.route.snapshot.queryParamMap.get('error');
    if (errorParam) {
      this.authError.set('Sign-in failed. Please try again.');
    }
  }

  onGoogleLogin(): void {
    this.isLoading.set(true);
    this.authError.set(null);

    this.authService.loginWithGoogle().then(params => {
      if (params.error) {
        this.authError.set('Sign-in failed. Please try again.');
        this.isLoading.set(false);
        return;
      }

      // Popup closed successfully — cookie is now set by the backend.
      // Check session to get user data and determine next step.
      this.authService.checkSession().subscribe(user => {
        this.isLoading.set(false);
        if (user && !user.usernameChosen) {
          this.router.navigate(['/choose-username']);
        } else {
          this.router.navigate(['/']);
        }
      });
    }).catch(() => {
      // User closed the popup without completing auth
      this.isLoading.set(false);
    });
  }

  onDevLogin(): void {
    this.isLoading.set(true);
    this.authError.set(null);

    this.authService.devLogin({ email: this.devEmail() }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        if (!user.usernameChosen) {
          this.router.navigate(['/choose-username']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.authError.set('Dev login failed.');
      }
    });
  }
}
```

**File: `src/app/features/auth/auth.html`**

```html
<div class="auth-container">
  <!-- decorative ornaments, grain, vignette — same as before -->

  <div class="auth-card">
    <h1 class="auth-title">Welcome, Adventurer</h1>
    <p class="auth-subtitle">Sign in to continue your journey</p>

    @if (authError()) {
      <div class="form-error" role="alert">{{ authError() }}</div>
    }

    <div class="auth-divider">
      <span class="auth-divider-text">sign in with</span>
    </div>

    <button type="button" class="google-btn" (click)="onGoogleLogin()" [disabled]="isLoading()">
      <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
        <!-- Google multicolor logo paths -->
      </svg>
      @if (isLoading()) { Signing in... } @else { Google }
    </button>

    @if (isDev) {
      <div class="dev-login-section">
        <div class="auth-divider"><span class="auth-divider-text">dev only</span></div>
        <div class="dev-login-row">
          <input type="email" class="form-input" [value]="devEmail()"
                 (input)="devEmail.set($any($event.target).value)"
                 placeholder="Dev email" />
          <button type="button" class="dev-login-btn" (click)="onDevLogin()" [disabled]="isLoading()">
            Dev Login
          </button>
        </div>
      </div>
    }
  </div>
</div>
```

**File: `src/app/features/auth/auth.css`**

Keep: `.auth-container`, `.auth-card`, `.auth-title`, `.auth-subtitle`, ornament styles, animations.
Remove: `.auth-tabs`, `.auth-tab`, `.auth-form` styles.
Add: `.google-btn`, `.auth-divider`, `.dev-login-section`, `.dev-login-row`, `.dev-login-btn`.

### Step 7: Create Choose Username Page

**New files:**
- `src/app/features/choose-username/choose-username.ts`
- `src/app/features/choose-username/choose-username.html`
- `src/app/features/choose-username/choose-username.css`
- `src/app/features/choose-username/choose-username.spec.ts`

(Full code in original plan — unchanged. Single form with username input, validation errors for minlength/maxlength/pattern, server errors for 409 Conflict and 400 Bad Request.)

### Step 8: Extract Shared Auth Page Styles

**New file: `src/app/shared/styles/auth-page.css`**

Extract from `auth.css`: `.auth-container`, `.auth-card`, `.auth-title`, `.auth-subtitle`, `.auth-ornament*`, `.auth-submit`, and responsive breakpoints. Both `auth.css` and `choose-username.css` import this file.

### Step 9: Update Routes

**File: `src/app/app.routes.ts`**

```typescript
// Add two new routes inside children array:
{
  path: 'auth/callback',
  loadComponent: () => import('./features/auth/auth-callback/auth-callback').then(m => m.AuthCallback)
},
{
  path: 'choose-username',
  loadComponent: () => import('./features/choose-username/choose-username').then(m => m.ChooseUsername)
},
```

### Step 10: Update Admin Guard

**File: `src/app/core/guards/admin.guard.ts`**

Adapt to new `checkSession()` return type (`Observable<UserResponse | null>` instead of `Observable<void>`).

### Step 11: Update Navbar

**File: `src/app/layout/navbar/navbar.html`**

Change "Login / Sign Up" text to "Sign In" (both desktop and mobile).

### Step 12: Update Tests

1. `auth.service.spec.ts` — Remove login/register tests. Add: `loginWithGoogle` (popup + postMessage), `chooseUsername`, `devLogin`, updated `checkSession`.
2. `auth.spec.ts` — Replace form tests with: Google button click, error query param display, dev login.
3. `auth-session.guard.spec.ts` — Add: usernameChosen=false redirects to /choose-username, usernameChosen=true proceeds normally.
4. New: `choose-username.spec.ts` — Form validation, successful submit, 409 error, 400 error.
5. New: `auth-callback.spec.ts` — postMessage to opener, fallback redirect.

### Step 13: Clean Up Dead Code

- Remove `LoginRequest` and `RegisterRequest` from `auth.model.ts`
- Remove `export type { LoginRequest, RegisterRequest }` from `auth.service.ts`
- Remove any other imports of these types

---

## Flow Diagrams

### Popup Flow: New User
```
1. User clicks "Sign In" in navbar → navigates to /auth
2. User clicks "Google" button
3. → window.open("http://localhost:8080/oauth2/authorization/google")
4. → Popup: Google consent screen
5. → Popup: Google redirects to backend callback
6. → Popup: Backend creates user, sets AUTH_TOKEN cookie
7. → Popup: Backend redirects to http://localhost:4200/auth/callback?needsUsername=true
8. → Popup: AuthCallback component loads, reads query params
9. → Popup: window.opener.postMessage({ type: 'oauth-callback', params: { needsUsername: 'true' } })
10. → Popup: window.close()
11. → Parent: receives message, calls checkSession()
12. → Parent: user has usernameChosen=false → navigate to /choose-username
13. User enters username, clicks "Claim Name"
14. → POST /api/auth/choose-username → 200 OK
15. → Navigate to / (home, logged in)
```

### Popup Flow: Returning User
```
1-6. Same as above
7. → Popup: Backend redirects to /auth/callback?needsUsername=false
8-10. Same postMessage flow
11. → Parent: calls checkSession(), usernameChosen=true → navigate to /
```

### Dev Login Flow (Local Testing)
```
1. User on /auth, sees dev-only section
2. Enters email (default: test@example.com), clicks "Dev Login"
3. → POST /api/auth/dev-login { email: "test@example.com" }
4. → Backend creates/finds user, sets AUTH_TOKEN cookie
5. → Response: UserResponse with usernameChosen=true
6. → Navigate to / (home, logged in)
```

### Error Paths
```
OAuth failure:
  Popup redirects to /auth/callback?error=auth_failed
  → postMessage sends error to parent
  → Parent shows "Sign-in failed. Please try again."

User closes popup:
  → pollTimer detects popup.closed
  → Promise rejects, isLoading set to false, no error shown

Username taken (409):
  → "That username is already taken. Try another."

Username invalid (400):
  → Backend error message or fallback text
```

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/core/models/auth.model.ts` | **Modify** | Remove LoginRequest/RegisterRequest, add usernameChosen, add ChooseUsernameRequest/DevLoginRequest |
| `src/app/core/services/auth.service.ts` | **Modify** | Remove login/register, add loginWithGoogle (popup), chooseUsername, devLogin, update checkSession |
| `src/environments/environment.ts` | **Modify** | Add backendBaseUrl |
| `src/environments/environment.prod.ts` | **Modify** | Add backendBaseUrl |
| `src/app/core/guards/auth-session.guard.ts` | **Modify** | Add usernameChosen redirect logic |
| `src/app/core/guards/admin.guard.ts` | **Modify** | Adapt to new checkSession return type |
| `src/app/features/auth/auth.ts` | **Rewrite** | Google popup button + dev login + error handling |
| `src/app/features/auth/auth.html` | **Rewrite** | Google button, dev login section, no forms/tabs |
| `src/app/features/auth/auth.css` | **Modify** | Remove tab/form styles, add google-btn/divider/dev styles |
| `src/app/features/auth/auth-callback/auth-callback.ts` | **Create** | Popup callback: postMessage to parent, close popup |
| `src/app/features/choose-username/choose-username.ts` | **Create** | Username selection form component |
| `src/app/features/choose-username/choose-username.html` | **Create** | Username form with validation errors |
| `src/app/features/choose-username/choose-username.css` | **Create** | Styles (imports shared auth-page.css) |
| `src/app/shared/styles/auth-page.css` | **Create** | Shared auth page chrome (container, card, ornaments) |
| `src/app/app.routes.ts` | **Modify** | Add /auth/callback and /choose-username routes |
| `src/app/layout/navbar/navbar.html` | **Modify** | "Login / Sign Up" → "Sign In" |
| Tests (5 files) | **Modify/Create** | See Step 12 |

---

## Manual Steps Required (for the backend agent)

Give the backend agent these instructions:

### Backend Task 1: Change OAuth redirect targets

In `OAuth2LoginSuccessHandler`, change the redirect URLs:

```
# When usernameChosen is false:
BEFORE: redirect to ${FRONTEND_BASE_URL}/choose-username
AFTER:  redirect to ${FRONTEND_BASE_URL}/auth/callback?needsUsername=true

# When usernameChosen is true:
BEFORE: redirect to ${FRONTEND_BASE_URL}
AFTER:  redirect to ${FRONTEND_BASE_URL}/auth/callback?needsUsername=false
```

In `OAuth2LoginFailureHandler`:

```
BEFORE: redirect to ${FRONTEND_BASE_URL}/login?error
AFTER:  redirect to ${FRONTEND_BASE_URL}/auth/callback?error=auth_failed
```

### Backend Task 2: Verify cookie SameSite

Ensure the `AUTH_TOKEN` cookie uses `SameSite=Lax`, not `Strict`. Look in the JWT/cookie configuration. `Strict` will break the OAuth flow because the browser won't send the cookie on the redirect from Google → backend → frontend.

### Backend Task 3: Verify CORS

Ensure `http://localhost:4200` is allowed with `Access-Control-Allow-Credentials: true`.

### Backend Task 4: Verify FRONTEND_BASE_URL

Check `application.yml` or `application-dev.yml` — `FRONTEND_BASE_URL` must be `http://localhost:4200`.

---

## Local Testing Steps

### Testing with Dev Login (no Google credentials needed)

1. Start the backend: `cd ../heart-n-fear && ./gradlew bootRun` (or however you start it)
2. Start the frontend: `npm start` (serves on http://localhost:4200)
3. Navigate to http://localhost:4200/auth
4. You should see the "Google" button AND a "Dev Only" section below it
5. Enter an email (default `test@example.com`), click "Dev Login"
6. You should be redirected to the home page, logged in
7. Check the navbar shows your username and user menu

### Testing the Choose Username flow with Dev Login

The dev-login endpoint always sets `usernameChosen: true`, so it skips the choose-username flow. To test that flow:

**Option A**: Temporarily modify the dev-login backend endpoint to set `usernameChosen: false`

**Option B**: After dev-login, manually update the database:
```sql
UPDATE users SET username_chosen = false WHERE email = 'test@example.com';
```
Then refresh the page — the `authSessionGuard` will call `/api/auth/me`, see `usernameChosen: false`, and redirect to `/choose-username`.

### Testing the Google OAuth Popup Flow

Requires Google OAuth credentials configured on the backend:

1. Ensure backend has Google client ID/secret configured
2. Navigate to http://localhost:4200/auth
3. Click "Google" — a popup should open to Google's consent screen
4. Sign in with Google
5. Popup should briefly show "Completing sign-in..." then close
6. Parent page should navigate to `/choose-username` (new user) or `/` (returning user)

### Testing Error Scenarios

- **Username taken**: On /choose-username, enter a username that already exists. Should see "That username is already taken."
- **Invalid username**: Enter `ab` (too short) — client-side validation prevents submit. Enter `a!b` — pattern validation prevents submit.
- **OAuth failure**: Hard to simulate naturally. If backend redirects to `/auth/callback?error=auth_failed`, the auth page should show the error.
- **Popup closed**: Click Google, then close the popup immediately. The page should return to idle state (no error, no loading).

### Testing Session Persistence

1. Log in via dev-login or Google
2. Refresh the page — you should still be logged in (cookie persists)
3. Open a new tab to http://localhost:4200 — should also be logged in
4. Click logout — should return to logged-out state
5. Refresh — should remain logged out
