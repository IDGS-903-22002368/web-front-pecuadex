import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing-module';
import { DashboardComponent } from './dashboard/dashboard';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';
import { Layout } from './layout/layout';
import { Navbar } from '../shared/components/navbar/navbar';
import { Producto } from './producto/producto';
import { Pieza } from './pieza/pieza';

const routes = [
  {
    path: '',
    component: Layout,
  },
];

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    DashboardComponent,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    Navbar,
    Layout,
    Producto,
    RouterModule.forChild(routes),
  ],
})
export class AdminModule {}
