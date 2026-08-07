import { CanMatchFn } from '@angular/router';
import { readStoredSheetLayout } from '../../shared/models/preferences.model';

/**
 * Picks which of the two `character/:id` routes serves a request, based on the stored sheet
 * layout preference. Both routes share the same path; the classic route is declared first and
 * carries this guard.
 *
 * A `CanMatchFn` returning `false` does NOT block navigation the way `CanActivateFn` does -- it
 * tells the router "this route doesn't match", so the router falls through to try the next
 * sibling route with the same path (see `@angular/router`'s `_router-chunk.mjs:2773`). So when
 * this guard returns false for a 'beta' preference, the router simply moves on to try the beta
 * route declared right after it. Because `canMatch` runs before `loadComponent`, each user only
 * ever downloads the chunk for their own layout -- never both.
 *
 * Deliberately localStorage-only and DI-free (no AuthService/HttpClient): route matching must
 * resolve synchronously, and adding an HTTP round-trip here would also break tests that assume
 * exactly one `/auth/me` call per navigation (see `navigateAndFlushSession` in
 * `app.routes.spec.ts`). See `readStoredSheetLayout()` for the same rationale -- it never throws
 * and always resolves to a valid layout.
 */
export const classicSheetGuard: CanMatchFn = () => readStoredSheetLayout() !== 'beta';
