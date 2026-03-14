import { Routes } from '@angular/router';
import { authSessionGuard } from './core/guards/auth-session.guard';

export const routes: Routes = [
  { path: 'reference', loadComponent: () => import('./features/reference/reference').then(m => m.Reference) },
  {
    path: '',
    canActivateChild: [authSessionGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then(m => m.Home)
      },
      {
        path: 'auth',
        loadComponent: () => import('./features/auth/auth').then(m => m.Auth)
      },
      {
        path: 'create-character',
        loadComponent: () => import('./features/create-character/create-character').then(m => m.CreateCharacter)
      },
      {
        path: 'character/:id',
        loadComponent: () => import('./features/character-sheet/character-sheet').then(m => m.CharacterSheet)
      }
    ]
  }
];
