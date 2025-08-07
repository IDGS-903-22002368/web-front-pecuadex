import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
//import { ForgotPasswordComponent } from './forgot-password/forgot-password';
//import { ResetPasswordComponent } from './reset-password/reset-password';
import { SharedModule } from '../shared/shared-module';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  //{ path: 'forgot-password', component: ForgotPasswordComponent },
  //{ path: 'reset-password', component: ResetPasswordComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  declarations: [],
  imports: [
    LoginComponent,
    RegisterComponent,
    //ForgotPasswordComponent,
    //ResetPasswordComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class AuthModule {}
