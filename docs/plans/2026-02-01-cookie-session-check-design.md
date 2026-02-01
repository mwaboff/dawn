# Cookie Session Check on Navigation

## Overview

Check if the `AUTH_TOKEN` cookie exists on every route navigation. If missing (browser deleted it due to expiration), clear the auth state so the user is considered logged out.

## Requirements

- Check cookie on every route navigation (including app startup)
- If `AUTH_TOKEN` cookie is missing and user appears logged in, clear auth state
- Do not block navigation - just sync the auth state

## Implementation

### 1. Add cookie check method to `AuthService`

Add a `checkSession()` method that:
- Parses `document.cookie` to check for `AUTH_TOKEN`
- If cookie is missing and `isLoggedIn()` is true, sets `currentUser` to null

```typescript
checkSession(): void {
  const hasAuthCookie = document.cookie
    .split('; ')
    .some(cookie => cookie.startsWith('AUTH_TOKEN='));

  if (!hasAuthCookie && this.isLoggedIn()) {
    this.currentUser.set(null);
  }
}
```

### 2. Create functional route guard

New file: `src/app/auth/auth-session.guard.ts`

```typescript
import { CanActivateFn, inject } from '@angular/router';
import { AuthService } from './auth.service';

export const authSessionGuard: CanActivateFn = () => {
  inject(AuthService).checkSession();
  return true;
};
```

### 3. Apply guard to all routes

Wrap all routes in a parent route with the guard:

```typescript
export const routes: Routes = [
  {
    path: '',
    canActivate: [authSessionGuard],
    children: [
      { path: '', loadComponent: ... },
      { path: 'auth', loadComponent: ... },
    ]
  }
];
```

## Files Changed

- `src/app/auth/auth.service.ts` - Add `checkSession()` method
- `src/app/auth/auth-session.guard.ts` - New file
- `src/app/app.routes.ts` - Restructure with parent route and guard
- `src/app/auth/auth.service.spec.ts` - Add tests for `checkSession()`
- `src/app/auth/auth-session.guard.spec.ts` - New test file

## Testing

- Test `checkSession()` clears state when cookie missing and user logged in
- Test `checkSession()` does nothing when cookie exists
- Test `checkSession()` does nothing when already logged out
- Test guard runs on navigation and returns true
