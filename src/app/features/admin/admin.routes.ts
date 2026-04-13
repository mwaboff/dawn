import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin').then(m => m.Admin),
    children: [
      { path: '', redirectTo: 'cards', pathMatch: 'full' },
      { path: 'cards', loadComponent: () => import('./card-search/card-search').then(m => m.CardSearch) },
      { path: 'cards/subclass-path/:pathId', loadComponent: () => import('./subclass-path-edit/subclass-path-edit').then(m => m.SubclassPathEdit) },
      { path: 'cards/:cardType/:id', loadComponent: () => import('./card-edit/card-edit').then(m => m.CardEdit) },
      { path: 'bulk-upload', loadComponent: () => import('./bulk-upload/bulk-upload').then(m => m.BulkUpload) },
    ]
  }
];
