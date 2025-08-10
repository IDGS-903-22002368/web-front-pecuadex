import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing-module';
import { ClientDashboardComponent } from './dashboard/dashboard';
import { Layout } from './layout/layout';
import { Navbar } from '../shared/components/navbar/navbar';
import { RouterModule } from '@angular/router';
import { MisCompras } from './mis-compras/mis-compras';
import { MiManualData, MisManuales } from './manuales/manuales';

const routes = [
  {
    path: '',
    component: Layout,
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ClientRoutingModule,
    ClientDashboardComponent,
    Navbar,
    MisCompras,
    MisManuales,
    Layout,
    RouterModule.forChild(routes),
  ],
})
export class ClientModule {}
