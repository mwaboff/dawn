# Backend Task: Update OAuth Redirect Targets for Popup Flow

## Context

The frontend is switching from full-page redirect OAuth to a **popup window** flow. After Google auth completes, the backend currently redirects the browser to `${FRONTEND_BASE_URL}` or `${FRONTEND_BASE_URL}/choose-username`. In the popup flow, the backend must instead redirect to a single callback URL (`/auth/callback`) with query parameters. The popup page reads those params, sends a `postMessage` to the parent window, and closes itself.

There are 4 changes needed. **All are small.** No new endpoints, no new database changes, no new dependencies.

---

## Change 1: Update `OAuth2LoginSuccessHandler` redirect URLs

Find the success handler class (likely named `OAuth2LoginSuccessHandler` or similar — it implements `AuthenticationSuccessHandler` or `SimpleUrlAuthenticationSuccessHandler`). It currently redirects based on whether `usernameChosen` is true or false.

### Current behavior:
```
usernameChosen == false → redirect to ${FRONTEND_BASE_URL}/choose-username
usernameChosen == true  → redirect to ${FRONTEND_BASE_URL}
```

### New behavior:
```
usernameChosen == false → redirect to ${FRONTEND_BASE_URL}/auth/callback?needsUsername=true
usernameChosen == true  → redirect to ${FRONTEND_BASE_URL}/auth/callback?needsUsername=false
```

The redirect URL must include the query parameter as a string (`"true"` / `"false"`).

Example: if `FRONTEND_BASE_URL` is `http://localhost:4200`, a successful first-time login redirects to:
```
http://localhost:4200/auth/callback?needsUsername=true
```

---

## Change 2: Update `OAuth2LoginFailureHandler` redirect URL

Find the failure handler class (likely named `OAuth2LoginFailureHandler` or similar — it implements `AuthenticationFailureHandler` or `SimpleUrlAuthenticationFailureHandler`).

### Current behavior:
```
redirect to ${FRONTEND_BASE_URL}/login?error
```

### New behavior:
```
redirect to ${FRONTEND_BASE_URL}/auth/callback?error=auth_failed
```

---

## Change 3: Verify AUTH_TOKEN cookie uses `SameSite=Lax`

Find where the `AUTH_TOKEN` cookie is created (likely in the success handler, a JWT filter, or a cookie utility). The cookie's `SameSite` attribute must be `Lax`, **not** `Strict`.

**Why:** The OAuth flow involves a redirect from Google's domain back to our backend. With `SameSite=Strict`, the browser will not attach the cookie on this cross-site redirect, which breaks the entire flow. `Lax` allows the cookie to be sent on top-level navigations (like our OAuth redirect) while still blocking cross-site POST requests.

If it's already `Lax` or `None`, no change needed. If it's `Strict`, change it to `Lax`.

---

## Change 4: Verify CORS and FRONTEND_BASE_URL

### CORS
Verify the CORS configuration allows `http://localhost:4200` (dev) with `Access-Control-Allow-Credentials: true`. The frontend makes these API calls with `withCredentials: true`:
- `GET /api/auth/me`
- `POST /api/auth/choose-username`
- `POST /api/auth/logout`
- `POST /api/auth/dev-login`

### FRONTEND_BASE_URL
Check `application.yml`, `application-dev.yml`, or environment variables. `FRONTEND_BASE_URL` must be `http://localhost:4200` in the dev profile. The success and failure handlers use this value to build the redirect URL.

---

## Verification

After making changes, verify with this manual test:

1. Start the backend with the dev profile
2. Call `POST /api/auth/dev-login` with `{"email": "test@example.com"}` — should return a user with `usernameChosen: true` and set the `AUTH_TOKEN` cookie
3. Inspect the `AUTH_TOKEN` cookie — confirm `SameSite=Lax` (not `Strict`)
4. Confirm CORS headers are present on responses to requests from `http://localhost:4200`

The redirect behavior can't be easily tested without the full Google OAuth flow, but you can verify the handler code by inspection: the success handler should build URLs like `${FRONTEND_BASE_URL}/auth/callback?needsUsername=true` and the failure handler should build `${FRONTEND_BASE_URL}/auth/callback?error=auth_failed`.

---

## What NOT to change

- Do not change any API endpoint paths (`/api/auth/me`, `/api/auth/choose-username`, etc.)
- Do not change the `dev-login` endpoint behavior
- Do not change the JWT token generation or cookie name
- Do not add new endpoints
- Do not change database schema
- Do not change the Google OAuth client configuration or scopes
