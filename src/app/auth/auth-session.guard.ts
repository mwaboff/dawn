import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authSessionGuard: CanActivateFn = () => {
  inject(AuthService).checkSession();
  return true;
};
