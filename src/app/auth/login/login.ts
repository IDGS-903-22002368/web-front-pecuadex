import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Si ya está logueado, redirigir
    if (this.authService.isLoggedIn()) {
      this.redirectUser();
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastr.success(
            'Bienvenido a Pecuadex',
            '¡Inicio de sesión exitoso!'
          );
          this.redirectUser();
        } else {
          this.toastr.error(
            response.message || 'Error al iniciar sesión',
            'Error'
          );
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.toastr.error(
            'Credenciales incorrectas',
            'Error de autenticación'
          );
        } else {
          this.toastr.error('Error al conectar con el servidor', 'Error');
        }
      },
    });
  }

  redirectUser(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
    } else if (this.authService.isClient()) {
      this.router.navigate(['/client']);
    } else {
      this.router.navigate([this.returnUrl]);
    }
  }

  loginWithGoogle(): void {
    this.toastr.info('Función disponible próximamente', 'Google Login');
  }

  loginWithFacebook(): void {
    this.toastr.info('Función disponible próximamente', 'Facebook Login');
  }
}
