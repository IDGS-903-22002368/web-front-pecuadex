import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss', '../auth.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  returnUrl: string = '/';
  isDemo = false;

  // Para debugging
  debugMode = false;

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
    // Primero, probar la conexión con el backend
    this.testBackendConnection();

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.isDemo = this.route.snapshot.queryParams['demo'] === 'true';

    // Si es demo, prellenar credenciales
    if (this.isDemo) {
      this.loginForm.patchValue({
        email: 'admin@pecuadex.com',
        password: 'Admin@123456',
      });
      this.toastr.info(
        'Credenciales de administrador prellenadas',
        'Modo Demo'
      );
    }

    // Si ya está logueado, redirigir
    if (this.authService.isLoggedIn()) {
      this.toastr.info('Ya tienes una sesión activa', 'Sesión Activa');
      this.redirectUser();
    }
  }

  testBackendConnection(): void {
    if (this.debugMode) {
      console.log('🔌 Probando conexión con el backend...');
    }

    this.authService.testConnection().subscribe({
      next: () => {
        if (this.debugMode) {
          console.log('✅ Backend conectado correctamente');
        }
      },
      error: (error) => {
        console.error('❌ Error conectando con el backend:', error);

        // Mostrar alerta solo si es un error real de conexión
        if (error.status === 0) {
          Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            html: `
              <p>No se puede conectar con el servidor.</p>
              <hr>
              <p class="small">Verifica que:</p>
              <ul class="text-start small">
                <li>El backend esté ejecutándose en https://localhost:5000</li>
                <li>CORS esté configurado correctamente</li>
                <li>El certificado SSL sea válido</li>
              </ul>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d33',
          });
        }
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    // Validar formulario
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });

      this.toastr.warning(
        'Por favor completa todos los campos correctamente',
        'Formulario Incompleto'
      );
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    if (this.debugMode) {
      console.log('📧 Email:', email);
      console.log('🔐 Iniciando proceso de login...');
    }

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.loading = false;

        if (this.debugMode) {
          console.log('✅ Respuesta del servidor:', response);
        }

        if (response.isSuccess) {
          // Mostrar información del usuario logueado si está en debug
          if (this.debugMode) {
            this.authService.debugTokenInfo();
          }

          // Mensaje de éxito personalizado según el rol
          const roles = this.authService.getUserRole();
          let welcomeMessage = 'Bienvenido a Pecuadex';

          if (roles.includes('Admin')) {
            welcomeMessage = 'Bienvenido Administrador';
          } else if (roles.includes('Client') || roles.includes('User')) {
            welcomeMessage = 'Bienvenido Cliente';
          }

          this.toastr.success(welcomeMessage, '¡Inicio de sesión exitoso!', {
            timeOut: 3000,
            progressBar: true,
          });

          // Redirigir después de un breve delay para que se vea el mensaje
          setTimeout(() => {
            this.redirectUser();
          }, 500);
        } else {
          // Error del servidor pero con respuesta exitosa HTTP
          this.handleLoginError(response.message || 'Error al iniciar sesión');
        }
      },
      error: (error) => {
        this.loading = false;

        if (this.debugMode) {
          console.error('❌ Error completo:', error);
        }

        // Manejar diferentes tipos de errores
        if (error.status === 0) {
          // Error de red/CORS
          this.handleNetworkError();
        } else if (error.status === 401) {
          // Credenciales incorrectas
          this.handleAuthenticationError();
        } else if (error.status === 400) {
          // Bad Request - posiblemente validación
          this.handleValidationError(error);
        } else if (error.status === 500) {
          // Error del servidor
          this.handleServerError();
        } else {
          // Otros errores
          this.handleGenericError(error);
        }
      },
    });
  }

  private handleLoginError(message: string): void {
    this.toastr.error(message, 'Error de Autenticación', {
      timeOut: 5000,
      closeButton: true,
    });
  }

  private handleNetworkError(): void {
    Swal.fire({
      icon: 'error',
      title: 'Error de Conexión',
      html: `
        <p>No se puede conectar con el servidor.</p>
        <hr>
        <p class="small text-muted">Posibles causas:</p>
        <ul class="text-start small">
          <li>El servidor no está ejecutándose</li>
          <li>Problema de CORS</li>
          <li>Certificado SSL inválido</li>
        </ul>
        <p class="mt-3">
          <strong>URL esperada:</strong><br>
          <code>https://localhost:5000</code>
        </p>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33',
    });
  }

  private handleAuthenticationError(): void {
    this.toastr.error(
      'Email o contraseña incorrectos. Por favor verifica tus credenciales.',
      'Credenciales Incorrectas',
      {
        timeOut: 5000,
        closeButton: true,
      }
    );

    // Limpiar el campo de contraseña
    this.loginForm.patchValue({ password: '' });
    this.loginForm.get('password')?.markAsUntouched();
  }

  private handleValidationError(error: any): void {
    if (error.error && typeof error.error === 'object') {
      // Si hay errores de validación específicos
      const errors = error.error.errors || error.error;
      let errorMessage = 'Error de validación:\n';

      Object.keys(errors).forEach((key) => {
        if (Array.isArray(errors[key])) {
          errorMessage += `${errors[key].join(', ')}\n`;
        } else {
          errorMessage += `${errors[key]}\n`;
        }
      });

      this.toastr.error(errorMessage, 'Error de Validación', {
        timeOut: 7000,
        closeButton: true,
      });
    } else {
      this.toastr.error(
        'Los datos enviados no son válidos. Por favor revisa el formulario.',
        'Error de Validación'
      );
    }
  }

  private handleServerError(): void {
    Swal.fire({
      icon: 'error',
      title: 'Error del Servidor',
      html: `
        <p>Ocurrió un error interno en el servidor.</p>
        <p class="small text-muted mt-2">
          Por favor intenta nuevamente en unos momentos o contacta al administrador.
        </p>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33',
    });
  }

  private handleGenericError(error: any): void {
    console.error('Error no manejado:', error);

    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.toastr.error(errorMessage, 'Error', {
      timeOut: 5000,
      closeButton: true,
    });
  }

  redirectUser(): void {
    const roles = this.authService.getUserRole();

    if (this.debugMode) {
      console.log('🚀 Redirigiendo usuario con roles:', roles);
    }

    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
    } else if (this.authService.isClient()) {
      this.router.navigate(['/client']);
    } else {
      this.router.navigate([this.returnUrl]);
    }
  }

  // Método para probar el login con diferentes usuarios
  fillTestCredentials(userType: 'admin' | 'client' | 'user'): void {
    const testUsers = {
      admin: {
        email: 'admin@pecuadex.com',
        password: 'Admin123!',
      },
      client: {
        email: 'cliente@pecuadex.com',
        password: 'Cliente123!',
      },
      user: {
        email: 'usuario@pecuadex.com',
        password: 'Usuario123!',
      },
    };

    const user = testUsers[userType];
    if (user) {
      this.loginForm.patchValue(user);
      this.toastr.info(
        `Credenciales de ${userType} prellenadas`,
        'Modo Prueba'
      );
    }
  }

  // Método para debugging
  showDebugInfo(): void {
    const debugInfo = {
      'Backend URL': 'https://localhost:5000',
      'Login Endpoint': 'https://localhost:5000/api/account/login',
      'Frontend URL': window.location.origin,
      'Formulario Válido': this.loginForm.valid,
      'Valores del Formulario': this.loginForm.value,
      'Token Actual': this.authService.getToken() ? 'Sí' : 'No',
      'Usuario Logueado': this.authService.isLoggedIn() ? 'Sí' : 'No',
    };

    console.table(debugInfo);

    Swal.fire({
      title: 'Información de Debug',
      html: `
        <div class="text-start">
          ${Object.entries(debugInfo)
            .map(
              ([key, value]) =>
                `<p><strong>${key}:</strong> ${
                  typeof value === 'object' ? JSON.stringify(value) : value
                }</p>`
            )
            .join('')}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      width: '600px',
    });
  }

  // Método adicional para verificar el estado de la API
  checkApiStatus(): void {
    if (!this.debugMode) return;

    console.log('🔍 Verificando estado de la API...');

    // Verificar endpoint de roles (no requiere autenticación según tu código)
    this.authService.testConnection().subscribe({
      next: (response) => {
        console.log('✅ API respondiendo correctamente');
        this.toastr.success('API conectada correctamente', 'Conexión OK');
      },
      error: (error) => {
        console.error('❌ Error al conectar con la API:', error);
        this.toastr.error(
          'No se puede conectar con la API',
          'Error de Conexión'
        );
      },
    });
  }

  // Método para limpiar el formulario
  resetForm(): void {
    this.loginForm.reset({
      email: '',
      password: '',
      rememberMe: false,
    });
    this.loginForm.markAsUntouched();
  }

  // Método para verificar si el formulario tiene errores específicos
  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  // Método para obtener mensaje de error de un campo
  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `El campo ${field} es requerido`;
    }
    if (control.errors['email']) {
      return 'Ingresa un email válido';
    }
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    return 'Campo inválido';
  }
}
