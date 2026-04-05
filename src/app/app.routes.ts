import { Routes } from '@angular/router';
import { authSessionGuard } from './core/guards/auth-session.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authSessionGuard],
    children: [
      { path: 'reference', loadComponent: () => import('./features/reference/reference').then(m => m.Reference) },
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
        path: 'character/:id/level-up',
        loadComponent: () => import('./features/level-up/level-up').then(m => m.LevelUp)
      },
      {
        path: 'character/:id/level-down',
        loadComponent: () => import('./features/level-down/level-down').then(m => m.LevelDown)
      },
      {
        path: 'character/:id',
        loadComponent: () => import('./features/character-sheet/character-sheet').then(m => m.CharacterSheet)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile)
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile)
      },
      {
        path: 'campaigns',
        loadComponent: () => import('./features/campaigns/campaigns').then(m => m.Campaigns)
      },
      {
        path: 'campaigns/create',
        loadComponent: () => import('./features/campaigns/create-campaign/create-campaign').then(m => m.CreateCampaign)
      },
      {
        path: 'campaigns/join/:token',
        loadComponent: () => import('./features/campaign-join/campaign-join').then(m => m.CampaignJoin)
      },
      {
        path: 'campaign/:id',
        loadComponent: () => import('./features/campaign/campaign').then(m => m.Campaign)
      },
      {
        path: 'player/:id',
        redirectTo: 'profile/:id',
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      }
    ]
  }
];
