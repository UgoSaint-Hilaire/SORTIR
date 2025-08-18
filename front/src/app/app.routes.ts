import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feed/feed-nav/feed-nav.component').then(
        (c) => c.FeedNavComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profil/profil.component').then((c) => c.ProfileComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'preferences',
    loadComponent: () =>
      import(
        './profil/preferences-selector/preferences-selector.component'
      ).then((c) => c.PreferencesSelectorComponent),
    canActivate: [AuthGuard],
  },
];
