import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feed/feed-nav/feed-nav.component').then(
        (c) => c.FeedNavComponent
      ),
  },
];
