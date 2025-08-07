import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { AdminGuard } from './core/guards/admin-guard';
import { ClientGuard } from './core/guards/client-guard';
import { GuestGuard } from './core/guards/guest-guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./landing/landing-module').then((m) => m.LandingModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then((m) => m.AuthModule),
    canActivate: [GuestGuard],
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin-module').then((m) => m.AdminModule),
    canActivate: [AdminGuard],
  },
  {
    path: 'client',
    loadChildren: () =>
      import('./client/client-module').then((m) => m.ClientModule),
    canActivate: [ClientGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      scrollOffset: [0, 64],
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
