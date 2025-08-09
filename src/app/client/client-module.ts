import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing-module';
import { ClientDashboardComponent } from './dashboard/dashboard';
import { Layout } from './layout/layout';

const routes = [
  {
    path: '',
    component: Layout,
  },
];

@NgModule({
  declarations: [Layout],
  imports: [CommonModule, ClientRoutingModule, ClientDashboardComponent],
})
export class ClientModule {}
