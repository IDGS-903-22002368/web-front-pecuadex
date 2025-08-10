import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { ToastrService } from 'ngx-toastr';

export interface MiManualData {
  titulo: string;
  urlDocumento: string;
  producto?: string;
}

@Component({
  selector: 'app-mis-manuales',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mis-manuales-container">
      <!-- Header -->
      <div class="header-card">
        <div class="toolbar">
          <div class="toolbar-left">
            <h2 class="page-title">
              <i class="icon-manual"></i>
              <span>Mis Manuales</span>
            </h2>
            <p class="page-subtitle">Manuales de productos adquiridos</p>
          </div>

          <div class="toolbar-right">
            <button
              class="btn btn-outline"
              (click)="exportManuales()"
              [disabled]="loading"
            >
              <i class="icon-download"></i>
              Exportar Lista
            </button>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="manuales-container">
        <!-- Loading -->
        <div *ngIf="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Cargando manuales...</p>
        </div>

        <!-- Lista de Manuales -->
        <div *ngIf="!loading && manuales.length > 0" class="manuales-grid">
          <div
            *ngFor="let manual of manuales; trackBy: trackByManual"
            class="manual-card"
          >
            <div class="manual-icon">
              <i class="icon-document"></i>
            </div>
            <div class="manual-info">
              <h3 class="manual-titulo">{{ manual.titulo }}</h3>
              <p class="manual-producto" *ngIf="manual.producto">
                Producto: {{ manual.producto }}
              </p>
            </div>
            <div class="manual-actions">
              <button
                class="btn btn-primary"
                (click)="openManual(manual.urlDocumento)"
                title="Abrir manual"
              >
                <i class="icon-external-link"></i>
                Ver Manual
              </button>
              <button
                class="btn btn-outline"
                (click)="downloadManual(manual.urlDocumento, manual.titulo)"
                title="Descargar manual"
              >
                <i class="icon-download"></i>
                Descargar
              </button>
            </div>
          </div>
        </div>

        <!-- No hay manuales -->
        <div *ngIf="!loading && manuales.length === 0" class="no-data">
          <div class="no-data-content">
            <i class="icon-manual-empty"></i>
            <h3>No hay manuales disponibles</h3>
            <p>
              Los manuales de tus productos aparecerán aquí una vez que realices
              compras.
            </p>
            <a href="/products" class="btn btn-primary">
              <i class="icon-shopping"></i>
              Ver Productos
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      // Variables
      $primary-color: #2e7d32;
      $light-color: #f8f9fa;
      $dark-color: #343a40;
      $border-color: #e5e7eb;
      $text-muted: #6c757d;
      $border-radius: 0.375rem;
      $shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);

      .mis-manuales-container {
        padding: 1rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      // Header Card
      .header-card {
        background: white;
        border-radius: $border-radius;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: $shadow;
        border: 1px solid $border-color;

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;

          .toolbar-left {
            .page-title {
              margin: 0 0 0.5rem 0;
              font-size: 1.5rem;
              font-weight: 600;
              color: $primary-color;
              display: flex;
              align-items: center;
              gap: 0.5rem;

              .icon-manual::before {
                content: '📖';
              }
            }

            .page-subtitle {
              margin: 0;
              color: $text-muted;
              font-size: 0.9rem;
            }
          }

          .toolbar-right {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
        }
      }

      // Container de manuales
      .manuales-container {
        background: white;
        border-radius: $border-radius;
        padding: 1.5rem;
        box-shadow: $shadow;
        border: 1px solid $border-color;
      }

      // Grid de manuales
      .manuales-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
      }

      // Card de manual
      .manual-card {
        border: 1px solid $border-color;
        border-radius: $border-radius;
        padding: 1.5rem;
        transition: all 0.15s ease;
        background: white;

        &:hover {
          box-shadow: $shadow;
          border-color: $primary-color;
          transform: translateY(-2px);
        }

        .manual-icon {
          text-align: center;
          margin-bottom: 1rem;

          .icon-document::before {
            content: '📄';
            font-size: 2.5rem;
          }
        }

        .manual-info {
          margin-bottom: 1.5rem;

          .manual-titulo {
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: $dark-color;
            line-height: 1.4;
          }

          .manual-producto {
            margin: 0;
            color: $text-muted;
            font-size: 0.875rem;
          }
        }

        .manual-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
      }

      // Botones
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid transparent;
        border-radius: $border-radius;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &.btn-primary {
          background-color: $primary-color;
          color: white;
          border-color: $primary-color;

          &:hover:not(:disabled) {
            background-color: darken($primary-color, 10%);
            border-color: darken($primary-color, 10%);
          }
        }

        &.btn-outline {
          background-color: transparent;
          color: $dark-color;
          border-color: $border-color;

          &:hover:not(:disabled) {
            background-color: $light-color;
          }
        }
      }

      // Iconos
      .icon-manual::before {
        content: '📖';
      }
      .icon-download::before {
        content: '⬇️';
      }
      .icon-document::before {
        content: '📄';
      }
      .icon-external-link::before {
        content: '🔗';
      }
      .icon-manual-empty::before {
        content: '📖';
        opacity: 0.3;
        font-size: 4rem;
      }
      .icon-shopping::before {
        content: '🛒';
      }
      .icon-refresh::before {
        content: '🔄';
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
          width: 2rem;
          height: 2rem;
          border: 3px solid $light-color;
          border-top: 3px solid $primary-color;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        p {
          color: $text-muted;
          margin: 0;
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

      // No data
      .no-data {
        padding: 3rem;
        text-align: center;

        .no-data-content {
          max-width: 400px;
          margin: 0 auto;

          i {
            font-size: 4rem;
            margin-bottom: 1rem;
            display: block;
            opacity: 0.3;
          }

          h3 {
            margin: 0 0 1rem 0;
            color: $dark-color;
            font-size: 1.25rem;
          }

          p {
            margin: 0 0 1.5rem 0;
            color: $text-muted;
            line-height: 1.5;
          }
        }
      }

      // Responsive
      @media (max-width: 768px) {
        .mis-manuales-container {
          padding: 0.5rem;
        }

        .header-card .toolbar {
          flex-direction: column;
          align-items: stretch;

          .toolbar-right {
            justify-content: center;
          }
        }

        .manuales-grid {
          grid-template-columns: 1fr;
        }

        .manual-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class MisManuales implements OnInit {
  manuales: MiManualData[] = [];
  loading = false;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef // Inyectar ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadManuales();
  }

  loadManuales(): void {
    this.loading = true;
    this.cdr.detectChanges(); // Forzar detección de cambios

    this.apiService.getManualesCliente().subscribe({
      next: (data) => {
        console.log('Manuales del cliente - Tipo:', typeof data, 'Data:', data);

        // Manejar diferentes estructuras de respuesta
        if (Array.isArray(data)) {
          this.manuales = data;
        } else if (data && typeof data === 'object') {
          // Si viene un objeto único, convertirlo a array
          this.manuales = [data];
        } else {
          this.manuales = [];
        }

        this.loading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios

        console.log('Manuales procesados:', this.manuales);
        console.log('Loading state:', this.loading);
      },
      error: (error) => {
        console.error('Error cargando manuales:', error);
        this.loading = false;
        this.manuales = [];
        this.cdr.detectChanges(); // Forzar detección de cambios
        this.toastr.error('Error al cargar los manuales', 'Error');
      },
    });
  }

  reloadManuales(): void {
    this.loadManuales();
  }

  trackByManual(index: number, manual: MiManualData): string {
    return manual.titulo + manual.urlDocumento;
  }

  openManual(url: string): void {
    window.open(url, '_blank');
  }

  downloadManual(url: string, titulo: string): void {
    // Abrir en nueva pestaña y dar instrucciones al usuario
    window.open(url, '_blank');
    this.toastr.info(
      'Manual abierto en nueva pestaña. Para descargarlo, usa Ctrl+S o click derecho → "Guardar como"',
      'Descarga',
      {
        timeOut: 5000,
      }
    );
  }

  exportManuales(): void {
    if (this.manuales.length === 0) {
      this.toastr.warning('No hay manuales para exportar');
      return;
    }

    const csvContent = this.convertToCSV(this.manuales);
    this.downloadCSV(csvContent, 'mis-manuales');
  }

  private convertToCSV(data: MiManualData[]): string {
    if (!data || data.length === 0) return '';

    const headers = ['Título', 'Producto', 'URL'];
    const csvData = data.map((manual) => [
      manual.titulo,
      manual.producto || '',
      manual.urlDocumento,
    ]);

    const csvArray = [headers, ...csvData];
    return csvArray.map((row) => row.join(',')).join('\n');
  }

  private downloadCSV(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
