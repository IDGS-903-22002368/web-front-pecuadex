import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from './components/navbar/navbar';
import { ProfileComponent } from './components/profile/profile';

@NgModule({
  declarations: [],
  imports: [CommonModule, Navbar, ProfileComponent],
})
export class SharedModule {}
