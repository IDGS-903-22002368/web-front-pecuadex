import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api';
import { ToastrService } from 'ngx-toastr';

export interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  phoneNumber?: string | null;
  twoFactorEnabled: boolean;
  phoneNumberConfirmed: boolean;
  accessFailedCount: number;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit {
  userInfo: UserInfo | null = null;
  loading = false;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.apiService.getUserDetail().subscribe({
      next: (data: UserInfo) => {
        this.userInfo = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error cargando perfil:', error);
        this.loading = false;
        this.toastr.error('Error al cargar información del perfil', 'Error');
        this.cdr.detectChanges();
      },
    });
  }

  getInitials(): string {
    if (!this.userInfo?.fullName) {
      return 'U';
    }

    const names = this.userInfo.fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      Admin: 'Administrador',
      Client: 'Cliente',
      Employee: 'Empleado',
      User: 'Usuario',
      Manager: 'Gerente',
      Supervisor: 'Supervisor',
    };
    return roleNames[role] || role;
  }

  getRoleClass(role: string): string {
    const roleClasses: { [key: string]: string } = {
      Admin: 'admin',
      Client: 'client',
      Employee: 'employee',
      Manager: 'admin',
      Supervisor: 'employee',
    };
    return roleClasses[role] || 'default';
  }

  refreshProfile(): void {
    this.loadUserProfile();
  }
}
