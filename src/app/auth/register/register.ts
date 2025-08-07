import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  currentStep = 1;
  totalSteps = 2;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.registerForm = this.fb.group(
      {
        // Step 1: Información personal
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            this.passwordValidator,
          ],
        ],
        confirmPassword: ['', Validators.required],

        // Step 2: Información adicional
        phoneNumber: ['', [Validators.pattern(/^[\d\s\+\-\(\)]+$/)]],
        companyName: [''],
        ranchSize: [''],
        animalCount: [''],
        acceptTerms: [false, Validators.requiredTrue],
        subscribeNewsletter: [false],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  passwordValidator(control: any): any {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasNumber && hasUpper && hasLower && hasSpecial;

    if (!valid) {
      return { weakPassword: true };
    }
    return null;
  }

  passwordMatchValidator(form: any): any {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePassword(field: string): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      const step1Fields = ['fullName', 'email', 'password', 'confirmPassword'];
      let valid = true;

      step1Fields.forEach((field) => {
        const control = this.registerForm.get(field);
        if (control && control.invalid) {
          control.markAsTouched();
          valid = false;
        }
      });

      if (valid) {
        this.currentStep = 2;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach((key) => {
        const control = this.registerForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;

    const registerData = {
      fullName: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      roles: ['User'], // Por defecto, todos son usuarios/clientes
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastr.success(
            'Cuenta creada exitosamente. Por favor inicia sesión.',
            '¡Registro exitoso!'
          );

          // Guardar información adicional en localStorage para completar el perfil después
          const additionalInfo = {
            phoneNumber: this.registerForm.value.phoneNumber,
            companyName: this.registerForm.value.companyName,
            ranchSize: this.registerForm.value.ranchSize,
            animalCount: this.registerForm.value.animalCount,
            subscribeNewsletter: this.registerForm.value.subscribeNewsletter,
          };
          localStorage.setItem(
            'pendingProfile',
            JSON.stringify(additionalInfo)
          );

          this.router.navigate(['/auth/login']);
        } else {
          this.toastr.error(
            response.message || 'Error al crear la cuenta',
            'Error'
          );
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        if (error.error && error.error.length > 0) {
          const errorMessage =
            error.error[0].description || 'Error al registrar usuario';
          this.toastr.error(errorMessage, 'Error');
        } else {
          this.toastr.error('Error al conectar con el servidor', 'Error');
        }
      },
    });
  }
}
