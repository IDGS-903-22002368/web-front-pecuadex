import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import {
  LoginDto,
  RegisterDto,
  AuthResponse,
  UserDetail,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/account';
  private currentUserSubject = new BehaviorSubject<UserDetail | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkToken();
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken || '');
            this.loadUserDetails();
          }
        })
      );
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  logout(): void {
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
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const exp = decoded.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  getUserRole(): string[] {
    const token = this.getToken();
    if (!token) return [];

    try {
      const decoded: any = jwtDecode(token);
      const roles =
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      return Array.isArray(roles) ? roles : [roles];
    } catch {
      return [];
    }
  }

  isAdmin(): boolean {
    return this.getUserRole().includes('Admin');
  }

  isClient(): boolean {
    return (
      this.getUserRole().includes('User') ||
      this.getUserRole().includes('Client')
    );
  }

  loadUserDetails(): void {
    if (this.isLoggedIn()) {
      this.http
        .get<UserDetail>(`${this.apiUrl}/detail`)
        .subscribe((user) => this.currentUserSubject.next(user));
    }
  }

  private checkToken(): void {
    if (this.isLoggedIn()) {
      this.loadUserDetails();
    }
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    const refreshToken = localStorage.getItem('refreshToken');
    const email = this.getCurrentUserEmail();

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
          }
        })
      );
  }

  private getCurrentUserEmail(): string {
    const token = this.getToken();
    if (!token) return '';

    try {
      const decoded: any = jwtDecode(token);
      return decoded.email || '';
    } catch {
      return '';
    }
  }

  forgotPassword(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/forgot-password`, {
      email,
    });
  }

  resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/reset-password`, {
      email,
      token,
      newPassword,
    });
  }
}
