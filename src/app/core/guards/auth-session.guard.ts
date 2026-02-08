import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authSessionGuard: CanActivateFn = () => {
  return inject(AuthService).checkSession().pipe(
    map(() => true)
  );
};
