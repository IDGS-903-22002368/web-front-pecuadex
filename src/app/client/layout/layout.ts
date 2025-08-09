import { Component, OnInit, OnDestroy } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  component?: string;
  children?: NavItem[];
  badge?: string;
  permission?: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [Navbar, CommonModule],
  template: `
    <div class="client-layout">
      <!-- Navbar -->
      <app-navbar
        [navItems]="clientNavItems"
        [brandText]="'Panel Cliente'"
        [homeRoute]="'/client'"
        [userType]="'client'"
      >
      </app-navbar>

      <!-- Main Content -->
      <main class="main-content">
        <div class="container-fluid py-4">
          <!-- Dashboard Component -->
          <div *ngIf="activeComponent === 'dashboard'" class="fade-in"></div>

          <!-- Mis Compras Component -->
          <div *ngIf="activeComponent === 'mis-compras'" class="fade-in"></div>

          <!-- Documentación Component -->
          <div
            *ngIf="activeComponent === 'documentacion'"
            class="fade-in"
          ></div>

          <!-- Perfil Component -->
          <div *ngIf="activeComponent === 'perfil'" class="fade-in"></div>

          <!-- Default: Dashboard cuando no hay componente activo -->
          <div *ngIf="!activeComponent" class="fade-in"></div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .client-layout {
        min-height: 100vh;
        background: #f8f9fa;
      }

      .main-content {
        margin-top: 0;
        min-height: calc(100vh - 70px);
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      }

      .fade-in {
        animation: fadeIn 0.5s ease-in;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .container-fluid {
        max-width: 1400px;
      }
    `,
  ],
})
export class Layout implements OnInit, OnDestroy {
  activeComponent: string = 'dashboard';

  clientNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-chart-line',
      component: 'dashboard',
    },
    {
      label: 'Mis Compras',
      icon: 'fas fa-shopping-bag',
      component: 'mis-compras',
    },
    {
      label: 'Documentación',
      icon: 'fas fa-book',
      component: 'documentacion',
    },
  ];

  private eventListener: (event: CustomEvent) => void;

  constructor() {
    // Crear listener para eventos de navbar
    this.eventListener = (event: CustomEvent) => {
      this.activeComponent = event.detail.component;
    };
  }

  ngOnInit(): void {
    // Escuchar eventos del navbar
    window.addEventListener(
      'navbar-component-selected',
      this.eventListener as EventListener
    );
  }

  ngOnDestroy(): void {
    // Limpiar listener
    window.removeEventListener(
      'navbar-component-selected',
      this.eventListener as EventListener
    );
  }
}
