import { Routes } from '@angular/router';
import { authSessionGuard } from './auth/auth-session.guard';

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authSessionGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then(m => m.Home)
      },
      {
        path: 'auth',
        loadComponent: () => import('./auth/auth').then(m => m.Auth)
      },
      {
        path: 'create-character',
        loadComponent: () => import('./create-character/create-character').then(m => m.CreateCharacter)
      }
    ]
  }
];
