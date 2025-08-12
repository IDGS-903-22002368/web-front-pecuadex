import { Component, OnInit, OnDestroy } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { CommonModule } from '@angular/common';
import { Producto } from '../producto/producto';
import { Pieza } from '../pieza/pieza';
import { ProveedorComponent } from '../proveedor/proveedor';
import { ComprasComponent } from '../compra/compra';
import { VentasComponent } from '../venta/venta';
import { ComponentesProducto } from '../componentes-producto/componentes-producto';
import { Costeo } from '../costeo/costeo';
import { DashboardComponent } from '../dashboard/dashboard';

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
  imports: [
    Navbar,
    CommonModule,
    Producto,
    Pieza,
    ProveedorComponent,
    ComprasComponent,
    VentasComponent,
    ComponentesProducto,
    Costeo,
    DashboardComponent,
  ],
  template: `
    <div class="admin-layout">
      <!-- Navbar -->
      <app-navbar
        [navItems]="adminNavItems"
        [brandText]="'Panel Administrativo'"
        [homeRoute]="'/admin'"
        [userType]="'admin'"
      >
      </app-navbar>

      <!-- Main Content -->
      <main class="main-content">
        <div class="container-fluid py-4">
          <!-- Dashboard Component -->
          <div *ngIf="activeComponent === 'dashboard'" class="fade-in">
            <app-admin-dashboard></app-admin-dashboard>
          </div>

          <!-- Comentarios Clientes Component -->
          <div
            *ngIf="activeComponent === 'comentarios-clientes'"
            class="fade-in"
          ></div>

          <!-- Ventas Component -->
          <div *ngIf="activeComponent === 'ventas'" class="fade-in">
            <app-ventas></app-ventas>
          </div>

          <!-- Proveedores Component -->
          <div *ngIf="activeComponent === 'proveedores'" class="fade-in">
            <app-proveedores></app-proveedores>
          </div>
          <!-- Costeo Component -->
          <div *ngIf="activeComponent === 'costeo'" class="fade-in">
            <app-costeo></app-costeo>
          </div>

          <!-- Compras Component -->
          <div *ngIf="activeComponent === 'compras'" class="fade-in">
            <app-compras></app-compras>
          </div>

          <!-- Materias Primas Component -->
          <div *ngIf="activeComponent === 'materias-primas'" class="fade-in">
            <app-piezas></app-piezas>
          </div>

          <!-- Productos Component -->
          <div *ngIf="activeComponent === 'productos'" class="fade-in">
            <app-productos></app-productos>
          </div>

          <!-- ComponentesProducto -->
          <div
            *ngIf="activeComponent === 'componentes-producto'"
            class="fade-in"
          >
            <app-componentes-producto></app-componentes-producto>
          </div>

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
      .admin-layout {
        min-height: 100vh;
        background: #f8f9fa;
      }

      .main-content {
        margin-top: 0;
        min-height: calc(100vh - 70px);
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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

  // Para Admin Layout (src/app/admin/layout/layout.ts)
  adminNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-chart-line',
      component: 'dashboard',
    },
    {
      label: 'Gestión Comercial',
      icon: 'fas fa-handshake',
      children: [
        {
          label: 'Comentarios Clientes',
          icon: 'fas fa-comments',
          component: 'comentarios-clientes',
        },
        {
          label: 'Ventas',
          icon: 'fas fa-cash-register',
          component: 'ventas',
        },
      ],
    },
    {
      label: 'Gestión de Compras',
      icon: 'fas fa-shopping-cart',
      children: [
        {
          label: 'Proveedores',
          icon: 'fas fa-truck',
          component: 'proveedores',
        },
        {
          label: 'Compras',
          icon: 'fas fa-receipt',
          component: 'compras',
        },
        {
          label: 'Movimientos de Costeo',
          icon: 'fas fa-calculator',
          component: 'costeo',
        },
      ],
    },
    {
      label: 'Inventario',
      icon: 'fas fa-warehouse',
      children: [
        {
          label: 'Materias Primas',
          icon: 'fas fa-cubes',
          component: 'materias-primas',
        },
        {
          label: 'Productos',
          icon: 'fas fa-box-open',
          component: 'productos',
        },
        {
          label: 'Componentes Receta',
          icon: 'fas fa-box-open',
          component: 'componentes-producto',
        },
      ],
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
