import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss', '../auth.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.values(this.registerForm.controls).forEach((control) =>
        control.markAsTouched()
      );
      this.toastr.warning('Por favor completa el formulario correctamente');
      return;
    }

    const { email, fullName, password } = this.registerForm.value;
    const registerData = {
      email,
      fullName,
      password,
      roles: ['Client'], // o 'Client', según corresponda
    };

    this.loading = true;

    this.authService.register(registerData).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.isSuccess) {
          this.toastr.success(
            'Registro exitoso. Ahora puedes iniciar sesión.',
            '¡Bienvenido!'
          );
          this.router.navigate(['/auth/login']);
        } else {
          this.toastr.error(res.message || 'Ocurrió un error al registrar');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en el registro:', error);
        this.toastr.error('No se pudo completar el registro');
      },
    });
  }

  hasError(field: string, error: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }
}
