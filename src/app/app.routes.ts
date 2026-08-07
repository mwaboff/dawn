import { Routes } from '@angular/router';
import { authSessionGuard } from './core/guards/auth-session.guard';
import { adminGuard } from './core/guards/admin.guard';
import { classicSheetGuard } from './core/guards/sheet-layout.guard';

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authSessionGuard],
    children: [
      {
        path: 'reference',
        loadComponent: () => import('./features/reference/reference').then(m => m.Reference),
        title: 'The Codex'
      },
      {
        path: 'gm-screen',
        loadComponent: () => import('./features/gm-screen/gm-screen').then(m => m.GmScreen),
        title: 'GM Screen'
      },
      {
        path: 'encounters',
        loadComponent: () => import('./features/encounters/encounters').then(m => m.Encounters),
        title: 'Encounters'
      },
      {
        // Must precede 'encounters/:id/edit' for the same reason as 'campaign/:id/gm-screen'
        // above -- a leaf route with no children only matches when it consumes every segment,
        // so 'encounters/:id/edit' declared first would swallow '/encounters/new' as id="new".
        path: 'encounters/new',
        loadComponent: () => import('./features/encounters/encounter-builder/encounter-builder').then(m => m.EncounterBuilder),
        title: 'Build an Encounter'
      },
      {
        path: 'encounters/:id/edit',
        loadComponent: () => import('./features/encounters/encounter-builder/encounter-builder').then(m => m.EncounterBuilder),
        title: 'Edit Encounter'
      },
      {
        path: 'encounters/:id/run',
        loadComponent: () => import('./features/encounters/encounter-run-page/encounter-run-page').then(m => m.EncounterRunPage),
        title: 'Run Encounter'
      },
      {
        // No ordering hazard with 'items/:type/:id/edit' below: that route is four segments and
        // this one is two, and a leaf route only matches when it consumes every segment.
        path: 'items/new',
        loadComponent: () => import('./features/items/item-builder/item-builder').then(m => m.ItemBuilder),
        title: 'Create an Item'
      },
      {
        // The kind is in the path because ids only identify a row within one of the three item
        // tables -- weapon 7, armor 7, and loot 7 are all different items.
        path: 'items/:type/:id/edit',
        loadComponent: () => import('./features/items/item-builder/item-builder').then(m => m.ItemBuilder),
        title: 'Edit Item'
      },
      {
        path: '',
        loadComponent: () => import('./features/home/home').then(m => m.Home)
      },
      {
        path: 'auth/callback',
        loadComponent: () => import('./features/auth/auth-callback/auth-callback').then(m => m.AuthCallback),
        title: 'Signing In'
      },
      {
        path: 'choose-username',
        loadComponent: () => import('./features/choose-username/choose-username').then(m => m.ChooseUsername),
        title: 'Choose a Username'
      },
      {
        path: 'auth',
        loadComponent: () => import('./features/auth/auth').then(m => m.Auth),
        title: 'Sign In'
      },
      {
        path: 'create-character',
        loadComponent: () => import('./features/create-character/create-character').then(m => m.CreateCharacter),
        title: 'Create a Character'
      },
      {
        path: 'character/:id/level-up',
        loadComponent: () => import('./features/level-up/level-up').then(m => m.LevelUp),
        title: 'Level Up'
      },
      {
        path: 'character/:id/level-down',
        loadComponent: () => import('./features/level-down/level-down').then(m => m.LevelDown),
        title: 'Level Down'
      },
      {
        // Two routes share this path; the guard picks. `canMatch` returning false makes the router
        // fall through to the next route rather than blocking navigation, and it runs before
        // `loadComponent`, so a user only downloads the chunk for the sheet they actually get.
        // Must precede the beta route -- the classic one is the guarded fall-through source, and
        // reversing them would strand every classic user on the beta sheet.
        path: 'character/:id',
        canMatch: [classicSheetGuard],
        loadComponent: () => import('./features/character-sheet/character-sheet').then(m => m.CharacterSheet),
        title: 'Character Sheet'
      },
      {
        path: 'character/:id',
        loadComponent: () => import('./features/character-sheet-beta/character-sheet-beta').then(m => m.CharacterSheetBeta),
        title: 'Character Sheet'
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
        title: 'Profile'
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
        title: 'Profile'
      },
      {
        path: 'preferences',
        loadComponent: () => import('./features/preferences/preferences').then(m => m.Preferences),
        title: 'Preferences'
      },
      {
        path: 'campaigns',
        loadComponent: () => import('./features/campaigns/campaigns').then(m => m.Campaigns),
        title: 'Campaigns'
      },
      {
        path: 'campaigns/create',
        loadComponent: () => import('./features/campaigns/create-campaign/create-campaign').then(m => m.CreateCampaign),
        title: 'Create a Campaign'
      },
      {
        path: 'campaigns/join/:token',
        loadComponent: () => import('./features/campaign-join/campaign-join').then(m => m.CampaignJoin),
        title: 'Join Campaign'
      },
      {
        // Must precede 'campaign/:id': Angular's leaf-route matcher requires a route to consume
        // every remaining segment when it has no children, so 'campaign/:id' alone never matches
        // a 3-segment URL -- but this order is verified by app.routes.spec.ts, not assumed.
        path: 'campaign/:id/gm-screen',
        loadComponent: () => import('./features/gm-screen/campaign/campaign-gm-screen').then(m => m.CampaignGmScreen),
        title: 'Campaign GM Screen'
      },
      {
        path: 'campaign/:id',
        loadComponent: () => import('./features/campaign/campaign').then(m => m.Campaign),
        title: 'Campaign'
      },
      {
        path: 'player/:id',
        redirectTo: 'profile/:id',
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
        title: 'Admin'
      },
      {
        path: '403',
        loadComponent: () => import('./shared/components/error-page/error-page').then(m => m.ErrorPage),
        data: { status: 403 },
        title: 'Access Denied'
      },
      {
        path: '**',
        loadComponent: () => import('./shared/components/error-page/error-page').then(m => m.ErrorPage),
        data: { status: 404 },
        title: 'Page Not Found'
      }
    ]
  }
];
