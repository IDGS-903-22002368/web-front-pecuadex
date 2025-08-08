import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import {
  LoginDto,
  RegisterDto,
  AuthResponse,
  UserDetail,
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/account`;
  private currentUserSubject = new BehaviorSubject<UserDetail | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Para debugging
  private isDebugMode = true;

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginDto): Observable<AuthResponse> {
    if (this.isDebugMode) {
      console.log('🔐 Intentando login con:', credentials.email);
      console.log('📡 URL de login:', `${this.apiUrl}/login`);
    }

    // Asegurarnos de que el Content-Type sea correcto
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials, { headers })
      .pipe(
        tap((response) => {
          if (this.isDebugMode) {
            console.log('✅ Respuesta del servidor:', response);
          }

          if (response.isSuccess && response.token) {
            // Guardar tokens
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken || '');

            // Decodificar el token para debugging
            if (this.isDebugMode) {
              try {
                const decoded = jwtDecode(response.token);
                console.log('🎫 Token decodificado:', decoded);
              } catch (error) {
                console.error('❌ Error decodificando token:', error);
              }
            }

            // Cargar detalles del usuario
            this.loadUserDetails();
          }
        }),
        catchError((error) => {
          if (this.isDebugMode) {
            console.error('❌ Error en login:', error);
            console.error('Detalles del error:', {
              status: error.status,
              message: error.message,
              error: error.error,
            });
          }
          return throwError(() => error);
        })
      );
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    if (this.isDebugMode) {
      console.log('📝 Intentando registro:', data);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data, { headers })
      .pipe(
        tap((response) => {
          if (this.isDebugMode) {
            console.log('✅ Registro exitoso:', response);
          }
        }),
        catchError((error) => {
          if (this.isDebugMode) {
            console.error('❌ Error en registro:', error);
          }
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    if (this.isDebugMode) {
      console.log('👋 Cerrando sesión...');
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      if (this.isDebugMode) {
        console.log('❌ No hay token almacenado');
      }
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      const exp = decoded.exp * 1000;
      const isValid = Date.now() < exp;

      if (this.isDebugMode) {
        const expirationDate = new Date(exp);
        console.log('🕐 Token expira en:', expirationDate);
        console.log('✅ Token válido:', isValid);
      }

      return isValid;
    } catch (error) {
      if (this.isDebugMode) {
        console.error('❌ Error validando token:', error);
      }
      return false;
    }
  }

  getUserRole(): string[] {
    const token = this.getToken();
    if (!token) return [];

    try {
      const decoded: any = jwtDecode(token);

      // El claim de roles puede venir de diferentes formas
      const roles =
        decoded[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ] ||
        decoded['role'] ||
        decoded['roles'];

      if (this.isDebugMode) {
        console.log('👤 Roles del usuario:', roles);
      }

      return Array.isArray(roles) ? roles : [roles].filter(Boolean);
    } catch (error) {
      if (this.isDebugMode) {
        console.error('❌ Error obteniendo roles:', error);
      }
      return [];
    }
  }

  isAdmin(): boolean {
    const roles = this.getUserRole();
    return roles.includes('Admin');
  }

  isClient(): boolean {
    const roles = this.getUserRole();
    return roles.includes('User') || roles.includes('Client');
  }

  loadUserDetails(): void {
    if (!this.isLoggedIn()) {
      if (this.isDebugMode) {
        console.log('⏭️ No se pueden cargar detalles, usuario no logueado');
      }
      return;
    }

    if (this.isDebugMode) {
      console.log('📥 Cargando detalles del usuario...');
    }

    this.http.get<UserDetail>(`${this.apiUrl}/detail`).subscribe({
      next: (user) => {
        if (this.isDebugMode) {
          console.log('✅ Detalles del usuario cargados:', user);
        }
        this.currentUserSubject.next(user);
      },
      error: (error) => {
        if (this.isDebugMode) {
          console.error('❌ Error cargando detalles del usuario:', error);
        }
      },
    });
  }

  checkToken(): void {
    if (this.isLoggedIn()) {
      this.loadUserDetails();
    }
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    const refreshToken = localStorage.getItem('refreshToken');
    const email = this.getCurrentUserEmail();

    if (this.isDebugMode) {
      console.log('🔄 Refrescando token...');
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh-token`, {
        token,
        refreshToken,
        email,
      })
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken || '');

            if (this.isDebugMode) {
              console.log('✅ Token refrescado exitosamente');
            }
          }
        }),
        catchError((error) => {
          if (this.isDebugMode) {
            console.error('❌ Error refrescando token:', error);
          }
          return throwError(() => error);
        })
      );
  }

  private getCurrentUserEmail(): string {
    const token = this.getToken();
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      return decoded.email || decoded.Email || '';
    } catch {
      return '';
    }
  }

  // Métodos adicionales útiles para debugging
  debugTokenInfo(): void {
    const token = this.getToken();
    if (!token) {
      console.log('No hay token almacenado');
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      console.log('=== INFORMACIÓN DEL TOKEN ===');
      console.log('Token completo:', token);
      console.log('Token decodificado:', decoded);
      console.log('Email:', decoded.email || decoded.Email);
      console.log('Nombre:', decoded.name || decoded.Name);
      console.log('Roles:', this.getUserRole());
      console.log('Expira:', new Date(decoded.exp * 1000));
      console.log('Es Admin:', this.isAdmin());
      console.log('Es Cliente:', this.isClient());
      console.log('===========================');
    } catch (error) {
      console.error('Error decodificando token:', error);
    }
  }

  // Método para probar la conexión con el backend
  testConnection(): Observable<any> {
    console.log('🔌 Probando conexión con el backend...');
    return this.http.get(`${environment.apiUrl}/roles`).pipe(
      tap(() => console.log('✅ Conexión exitosa')),
      catchError((error) => {
        console.error('❌ Error de conexión:', error);
        return throwError(() => error);
      })
    );
  }
}
