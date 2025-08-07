import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CarouselModule } from 'ngx-owl-carousel-o';

import { HomeComponent } from './home/home';
import { SharedModule } from '../shared/shared-module';

const routes: Routes = [{ path: '', component: HomeComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    CarouselModule,
    RouterModule.forChild(routes),
    HomeComponent,
  ],
})
export class LandingModule {}
