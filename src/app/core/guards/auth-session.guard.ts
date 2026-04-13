import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

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
