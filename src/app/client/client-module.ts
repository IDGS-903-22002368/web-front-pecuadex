import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing-module';
import { ClientDashboardComponent } from './dashboard/dashboard';

@NgModule({
  declarations: [],
  imports: [CommonModule, ClientRoutingModule, ClientDashboardComponent],
})
export class ClientModule {}
