import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api';
import { ToastrService } from 'ngx-toastr';

interface DashboardStats {
  totalCompras: number;
  totalGastado: number;
  productosComprados: number;
  comentariosRealizados: number;
  manualesDisponibles: number;
  ultimaCompra?: Date;
}

interface CompraReciente {
  fecha: Date;
  total: number;
  productos: string[];
  ventaId?: number;
}

interface ProductoFavorito {
  nombre: string;
  cantidadComprada: number;
  totalGastado: number;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Header de Bienvenida -->
      <div class="welcome-header">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1 class="welcome-title">¡Bienvenido de nuevo! 👋</h1>
            <p class="welcome-subtitle">
              Aquí tienes un resumen de tu actividad reciente
            </p>
          </div>
          <div class="welcome-actions">
            <button class="btn btn-primary" (click)="navigateToProducts()">
              <i class="icon-shopping"></i>
              Ver Productos
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Cargando tu dashboard...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!loading" class="dashboard-content">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon shopping">
              <i class="icon-shopping-bag"></i>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.totalCompras }}</h3>
              <p class="stat-label">Compras Realizadas</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon money">
              <i class="icon-money"></i>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">
                {{ formatCurrency(stats.totalGastado) }}
              </h3>
              <p class="stat-label">Total Gastado</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon products">
              <i class="icon-box"></i>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.productosComprados }}</h3>
              <p class="stat-label">Productos Únicos</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon comments">
              <i class="icon-comment"></i>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.comentariosRealizados }}</h3>
              <p class="stat-label">Comentarios</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon manuals">
              <i class="icon-manual"></i>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.manualesDisponibles }}</h3>
              <p class="stat-label">Manuales Disponibles</p>
            </div>
          </div>

          <div class="stat-card" *ngIf="stats.ultimaCompra">
            <div class="stat-icon calendar">
              <i class="icon-calendar"></i>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ formatDate(stats.ultimaCompra) }}</h3>
              <p class="stat-label">Última Compra</p>
            </div>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="content-grid">
          <!-- Compras Recientes -->
          <div class="dashboard-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="icon-clock"></i>
                Compras Recientes
              </h3>
              <button class="btn-link" (click)="navigateToCompras()">
                Ver todas
                <i class="icon-arrow-right"></i>
              </button>
            </div>
            <div class="card-content">
              <div *ngIf="comprasRecientes.length === 0" class="empty-state">
                <i class="icon-shopping-empty"></i>
                <p>No tienes compras recientes</p>
                <button
                  class="btn btn-primary btn-sm"
                  (click)="navigateToProducts()"
                >
                  Explorar productos
                </button>
              </div>

              <div *ngFor="let compra of comprasRecientes" class="compra-item">
                <div class="compra-info">
                  <div class="compra-date">{{ formatDate(compra.fecha) }}</div>
                  <div class="compra-products">
                    {{ getProductsText(compra.productos) }}
                  </div>
                </div>
                <div class="compra-total">
                  {{ formatCurrency(compra.total) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Productos Favoritos -->
          <div class="dashboard-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="icon-star"></i>
                Tus Productos Favoritos
              </h3>
            </div>
            <div class="card-content">
              <div *ngIf="productosFavoritos.length === 0" class="empty-state">
                <i class="icon-heart-empty"></i>
                <p>Realiza más compras para ver tus favoritos</p>
              </div>

              <div
                *ngFor="let producto of productosFavoritos"
                class="producto-favorito"
              >
                <div class="producto-info">
                  <h4 class="producto-name">{{ producto.nombre }}</h4>
                  <p class="producto-stats">
                    {{ producto.cantidadComprada }} unidades •
                    {{ formatCurrency(producto.totalGastado) }}
                  </p>
                </div>
                <div class="producto-badge">
                  <i class="icon-trophy"></i>
                </div>
              </div>
            </div>
            <div class="tip-item" *ngIf="stats.manualesDisponibles > 0">
              <i class="icon-manual"></i>
              <p>
                Tienes {{ stats.manualesDisponibles }} manuales disponibles.
                ¡Descárgalos cuando los necesites!
              </p>
            </div>
          </div>

          <!-- Acciones Rápidas -->
          <div class="dashboard-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="icon-zap"></i>
                Acciones Rápidas
              </h3>
            </div>
            <div class="card-content">
              <div class="quick-actions">
                <button class="quick-action-btn" (click)="navigateToCompras()">
                  <i class="icon-shopping-bag"></i>
                  <span>Mis Compras</span>
                </button>

                <button class="quick-action-btn" (click)="navigateToManuales()">
                  <i class="icon-manual"></i>
                  <span>Manuales</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      // Variables
      $primary-color: #2e7d32;
      $success-color: #28a745;
      $info-color: #17a2b8;
      $warning-color: #ffc107;
      $danger-color: #dc3545;
      $light-color: #f8f9fa;
      $dark-color: #343a40;
      $border-color: #e5e7eb;
      $text-muted: #6c757d;
      $border-radius: 0.5rem;
      $shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
      $shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

      .dashboard-container {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
        min-height: calc(100vh - 140px);
      }

      // Welcome Header
      .welcome-header {
        background: linear-gradient(
          135deg,
          $primary-color 0%,
          darken($primary-color, 10%) 100%
        );
        border-radius: $border-radius;
        padding: 2rem;
        margin-bottom: 2rem;
        color: white;
        box-shadow: $shadow-lg;

        .welcome-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .welcome-title {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .welcome-subtitle {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);

          &:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
        }
      }

      // Loading
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        text-align: center;

        .spinner {
          width: 3rem;
          height: 3rem;
          border: 4px solid $light-color;
          border-top: 4px solid $primary-color;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      // Stats Grid
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: white;
        border-radius: $border-radius;
        padding: 1.5rem;
        box-shadow: $shadow;
        border: 1px solid $border-color;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: $shadow-lg;
        }

        .stat-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;

          &.shopping {
            background: rgba($primary-color, 0.1);
            color: $primary-color;
          }
          &.money {
            background: rgba($success-color, 0.1);
            color: $success-color;
          }
          &.products {
            background: rgba($info-color, 0.1);
            color: $info-color;
          }
          &.comments {
            background: rgba($warning-color, 0.1);
            color: $warning-color;
          }
          &.manuals {
            background: rgba($danger-color, 0.1);
            color: $danger-color;
          }
          &.calendar {
            background: rgba($dark-color, 0.1);
            color: $dark-color;
          }
        }

        .stat-value {
          margin: 0 0 0.25rem 0;
          font-size: 1.75rem;
          font-weight: 700;
          color: $dark-color;
        }

        .stat-label {
          margin: 0;
          color: $text-muted;
          font-size: 0.875rem;
        }
      }

      // Content Grid
      .content-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 1.5rem;
      }

      .dashboard-card {
        background: white;
        border-radius: $border-radius;
        box-shadow: $shadow;
        border: 1px solid $border-color;
        overflow: hidden;

        .card-header {
          padding: 1.5rem;
          border-bottom: 1px solid $border-color;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .card-title {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: $dark-color;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
        }

        .card-content {
          padding: 1.5rem;
        }
      }

      // Buttons
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: 1px solid transparent;
        border-radius: $border-radius;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;

        &.btn-primary {
          background-color: $primary-color;
          color: white;

          &:hover {
            background-color: darken($primary-color, 10%);
            transform: translateY(-1px);
          }
        }

        &.btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
        }
      }

      .btn-link {
        background: none;
        border: none;
        color: $primary-color;
        text-decoration: none;
        cursor: pointer;
        font-size: 0.875rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;

        &:hover {
          text-decoration: underline;
        }
      }

      // Compras Recientes
      .compra-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid rgba($border-color, 0.5);

        &:last-child {
          border-bottom: none;
        }

        .compra-date {
          font-weight: 500;
          color: $dark-color;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .compra-products {
          color: $text-muted;
          font-size: 0.75rem;
        }

        .compra-total {
          font-weight: 600;
          color: $primary-color;
        }
      }

      // Productos Favoritos
      .producto-favorito {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid rgba($border-color, 0.5);

        &:last-child {
          border-bottom: none;
        }

        .producto-name {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: $dark-color;
        }

        .producto-stats {
          margin: 0;
          font-size: 0.75rem;
          color: $text-muted;
        }

        .producto-badge {
          color: $warning-color;
          font-size: 1.25rem;
        }
      }

      // Quick Actions
      .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
      }

      .quick-action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: $light-color;
        border: 1px solid $border-color;
        border-radius: $border-radius;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        color: $dark-color;

        &:hover {
          background: rgba($primary-color, 0.1);
          border-color: $primary-color;
          transform: translateY(-2px);
        }

        i {
          font-size: 1.5rem;
          color: $primary-color;
        }

        span {
          font-size: 0.75rem;
          font-weight: 500;
        }
      }

      // Tips
      .tips-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .tip-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        background: rgba($info-color, 0.05);
        border-radius: $border-radius;
        border-left: 3px solid $info-color;

        i {
          color: $info-color;
          margin-top: 0.125rem;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
          color: $dark-color;
          line-height: 1.4;
        }
      }

      // Empty States
      .empty-state {
        text-align: center;
        padding: 2rem 1rem;

        i {
          font-size: 3rem;
          color: $text-muted;
          opacity: 0.5;
          margin-bottom: 1rem;
          display: block;
        }

        p {
          margin: 0 0 1rem 0;
          color: $text-muted;
        }
      }

      // Icons (usando emojis como fallback)
      .icon-shopping::before {
        content: '🛒';
      }
      .icon-shopping-bag::before {
        content: '🛍️';
      }
      .icon-money::before {
        content: '💰';
      }
      .icon-box::before {
        content: '📦';
      }
      .icon-comment::before {
        content: '💬';
      }
      .icon-manual::before {
        content: '📖';
      }
      .icon-calendar::before {
        content: '📅';
      }
      .icon-clock::before {
        content: '🕐';
      }
      .icon-star::before {
        content: '⭐';
      }
      .icon-zap::before {
        content: '⚡';
      }
      .icon-lightbulb::before {
        content: '💡';
      }
      .icon-calculator::before {
        content: '🧮';
      }
      .icon-trophy::before {
        content: '🏆';
      }
      .icon-arrow-right::before {
        content: '→';
      }
      .icon-info::before {
        content: 'ℹ️';
      }
      .icon-shield::before {
        content: '🛡️';
      }
      .icon-shopping-empty::before {
        content: '🛒';
        opacity: 0.3;
      }
      .icon-heart-empty::before {
        content: '💝';
        opacity: 0.3;
      }

      // Responsive
      @media (max-width: 768px) {
        .dashboard-container {
          padding: 1rem;
        }

        .welcome-header {
          padding: 1.5rem;

          .welcome-content {
            flex-direction: column;
            text-align: center;
          }

          .welcome-title {
            font-size: 1.5rem;
          }
        }

        .stats-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .content-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .quick-actions {
          grid-template-columns: repeat(2, 1fr);
        }

        .stat-card {
          padding: 1rem;
        }
      }
    `,
  ],
})
export class ClientDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalCompras: 0,
    totalGastado: 0,
    productosComprados: 0,
    comentariosRealizados: 0,
    manualesDisponibles: 0,
  };

  comprasRecientes: CompraReciente[] = [];
  productosFavoritos: ProductoFavorito[] = [];
  loading = true;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    this.loading = true;

    try {
      // Cargar datos en paralelo
      const [compras, comentarios, manuales] = await Promise.all([
        this.apiService.getComprasCliente().toPromise(),
        this.apiService.getMisComentarios().toPromise(),
        this.apiService.getManualesCliente().toPromise(),
      ]);

      this.processComprasData(compras || []);
      this.processComentariosData(comentarios || []);
      this.processManualesData(manuales || []);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      this.toastr.error('Error al cargar los datos del dashboard');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private processComprasData(compras: any[]): void {
    if (!compras || compras.length === 0) return;

    // Estadísticas básicas
    this.stats.totalCompras = compras.length;
    this.stats.totalGastado = compras.reduce(
      (sum, compra) => sum + compra.total,
      0
    );

    // Productos únicos
    const productosUnicos = new Set();
    const productosConteo: {
      [key: string]: { cantidad: number; total: number };
    } = {};

    compras.forEach((compra) => {
      compra.productos.forEach((producto: any) => {
        productosUnicos.add(producto.productoId);

        const key = producto.nombre;
        if (!productosConteo[key]) {
          productosConteo[key] = { cantidad: 0, total: 0 };
        }
        productosConteo[key].cantidad += producto.cantidad;
        productosConteo[key].total += producto.subtotal;
      });
    });

    this.stats.productosComprados = productosUnicos.size;

    // Compras recientes (últimas 5)
    this.comprasRecientes = compras
      .map((compra) => ({
        fecha: new Date(compra.fecha),
        total: compra.total,
        productos: compra.productos.map((p: any) => p.nombre),
        ventaId: compra.ventaId,
      }))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 5);

    // Última compra
    if (this.comprasRecientes.length > 0) {
      this.stats.ultimaCompra = this.comprasRecientes[0].fecha;
    }

    // Productos favoritos (top 5 por cantidad)
    this.productosFavoritos = Object.entries(productosConteo)
      .map(([nombre, data]) => ({
        nombre,
        cantidadComprada: data.cantidad,
        totalGastado: data.total,
      }))
      .sort((a, b) => b.cantidadComprada - a.cantidadComprada)
      .slice(0, 5);
  }

  private processComentariosData(comentarios: any[]): void {
    this.stats.comentariosRealizados = comentarios?.length || 0;
  }

  private processManualesData(manuales: any[]): void {
    this.stats.manualesDisponibles = manuales?.length || 0;
  }

  // Navegación
  navigateToCompras(): void {
    // Simular navegación mediante evento
    window.dispatchEvent(
      new CustomEvent('navbar-component-selected', {
        detail: { component: 'mis-compras' },
      })
    );
  }

  navigateToManuales(): void {
    window.dispatchEvent(
      new CustomEvent('navbar-component-selected', {
        detail: { component: 'documentacion' },
      })
    );
  }

  navigateToProducts(): void {
    window.open('/products', '_blank');
  }

  solicitarCotizacion(): void {
    window.open('/cotizacion', '_blank');
  }

  // Utilidades
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value || 0);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  }

  getProductsText(productos: string[]): string {
    if (productos.length <= 2) {
      return productos.join(', ');
    }
    return `${productos.slice(0, 2).join(', ')} y ${productos.length - 2} más`;
  }
}
