import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing-module';
import { DashboardComponent } from './dashboard/dashboard';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';
import { Layout } from './layout/layout';

const routes = [
  {
    path: '',
    component: Layout,
  },
];

@NgModule({
  declarations: [Layout],
  imports: [
    CommonModule,
    AdminRoutingModule,
    DashboardComponent,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class AdminModule {}
