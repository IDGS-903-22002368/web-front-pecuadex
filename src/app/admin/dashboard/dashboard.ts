import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface DashboardStats {
  totalProductos: number;
  totalVentas: number;
  totalCompras: number;
  totalProveedores: number;
  totalPiezas: number;
  totalComentarios: number;
  totalCotizaciones: number;
  totalUsuarios: number;
  ventasHoy: number;
  comprasHoy: number;
  ingresosTotales: number;
  gastosTotales: number;
}

interface VentaReciente {
  id: number;
  fecha: Date;
  usuario: string;
  total: number;
  estado: string;
}

interface ProductoPopular {
  id: number;
  nombre: string;
  ventasCount: number;
  ingresos: number;
}

interface ComentarioReciente {
  id: number;
  comentario: string;
  calificacion: number;
  nombreUsuario: string;
  fecha: Date;
  producto: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  loading = true;

  stats: DashboardStats = {
    totalProductos: 0,
    totalVentas: 0,
    totalCompras: 0,
    totalProveedores: 0,
    totalPiezas: 0,
    totalComentarios: 0,
    totalCotizaciones: 0,
    totalUsuarios: 0,
    ventasHoy: 0,
    comprasHoy: 0,
    ingresosTotales: 0,
    gastosTotales: 0,
  };

  ventasRecientes: VentaReciente[] = [];
  productosPopulares: ProductoPopular[] = [];
  comentariosRecientes: ComentarioReciente[] = [];
  cotizacionesPendientes: any[] = [];

  // Para gráficos simples
  ventasPorMes: { mes: string; ventas: number; ingresos: number }[] = [];
  comprasPorMes: { mes: string; compras: number; gastos: number }[] = [];

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Cargar datos de forma más segura - algunos endpoints pueden fallar
    const requests = {
      productos: this.apiService.getProductos().pipe(
        catchError((error) => {
          console.warn('Error cargando productos:', error);
          return of([]);
        })
      ),
      ventas: this.apiService.getVentas().pipe(
        catchError((error) => {
          console.warn('Error cargando ventas:', error);
          return of([]);
        })
      ),
      compras: this.apiService.getCompras().pipe(
        catchError((error) => {
          console.warn('Error cargando compras:', error);
          return of([]);
        })
      ),
      proveedores: this.apiService.getProveedores().pipe(
        catchError((error) => {
          console.warn('Error cargando proveedores:', error);
          return of([]);
        })
      ),
      piezas: this.apiService.getPiezas().pipe(
        catchError((error) => {
          console.warn('Error cargando piezas:', error);
          return of([]);
        })
      ),
      comentarios: this.apiService.getComentarios().pipe(
        catchError((error) => {
          console.warn('Error cargando comentarios:', error);
          return of([]);
        })
      ),
      usuarios: this.apiService.getUsers().pipe(
        catchError((error) => {
          console.warn('Error cargando usuarios:', error);
          return of([]);
        })
      ),
      cotizaciones: this.apiService.listarCotizaciones().pipe(
        catchError((error) => {
          console.warn('Error cargando cotizaciones:', error);
          return of({ totalItems: 0, items: [] });
        })
      ),
    };

    forkJoin(requests).subscribe({
      next: (data) => {
        console.log('Datos cargados:', data);
        this.processData(data);
        this.loading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (error) => {
        console.error('Error crítico cargando datos del dashboard:', error);
        this.loading = false;
        // Incluso si hay error, inicializar con datos vacíos
        this.processData({
          productos: [],
          ventas: [],
          compras: [],
          proveedores: [],
          piezas: [],
          comentarios: [],
          usuarios: [],
          cotizaciones: { totalItems: 0, items: [] },
        });
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
    });
  }

  processData(data: any): void {
    console.log('Procesando datos:', data);

    // Procesar estadísticas básicas con validaciones
    this.stats.totalProductos = Array.isArray(data.productos)
      ? data.productos.length
      : 0;
    this.stats.totalVentas = Array.isArray(data.ventas)
      ? data.ventas.length
      : 0;
    this.stats.totalCompras = Array.isArray(data.compras)
      ? data.compras.length
      : 0;
    this.stats.totalProveedores = Array.isArray(data.proveedores)
      ? data.proveedores.length
      : 0;
    this.stats.totalPiezas = Array.isArray(data.piezas)
      ? data.piezas.length
      : 0;
    this.stats.totalComentarios = Array.isArray(data.comentarios)
      ? data.comentarios.length
      : 0;
    this.stats.totalUsuarios = Array.isArray(data.usuarios)
      ? data.usuarios.length
      : 0;
    this.stats.totalCotizaciones = data.cotizaciones?.totalItems || 0;

    // Procesar ventas
    if (Array.isArray(data.ventas) && data.ventas.length > 0) {
      try {
        this.processVentas(
          data.ventas,
          data.usuarios || [],
          data.productos || []
        );
      } catch (error) {
        console.warn('Error procesando ventas:', error);
      }
    }

    // Procesar compras
    if (Array.isArray(data.compras) && data.compras.length > 0) {
      try {
        this.processCompras(data.compras);
      } catch (error) {
        console.warn('Error procesando compras:', error);
      }
    }

    // Procesar comentarios
    if (Array.isArray(data.comentarios) && data.comentarios.length > 0) {
      try {
        this.processComentarios(
          data.comentarios,
          data.usuarios || [],
          data.productos || []
        );
      } catch (error) {
        console.warn('Error procesando comentarios:', error);
      }
    }

    // Procesar cotizaciones pendientes
    if (data.cotizaciones?.items && Array.isArray(data.cotizaciones.items)) {
      try {
        this.cotizacionesPendientes = data.cotizaciones.items
          .filter((c: any) => c && c.estado === 'Pendiente')
          .slice(0, 5);
      } catch (error) {
        console.warn('Error procesando cotizaciones:', error);
        this.cotizacionesPendientes = [];
      }
    }
  }

  processVentas(ventas: any[], usuarios: any[], productos: any[]): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let ingresosTotales = 0;
    let ventasHoy = 0;
    const productosVendidos: {
      [key: number]: { count: number; ingresos: number };
    } = {};
    const ventasPorMesMap: {
      [key: string]: { ventas: number; ingresos: number };
    } = {};

    // Procesar cada venta con validaciones
    ventas.forEach((venta) => {
      try {
        const fechaVenta = new Date(venta.fecha);
        if (isNaN(fechaVenta.getTime())) {
          console.warn('Fecha inválida en venta:', venta);
          return;
        }

        const totalVenta = this.getTotalVenta(venta);

        if (totalVenta > 0) {
          ingresosTotales += totalVenta;

          // Ventas de hoy
          if (fechaVenta >= hoy) {
            ventasHoy++;
          }

          // Productos más vendidos
          if (Array.isArray(venta.detalles)) {
            venta.detalles.forEach((detalle: any) => {
              if (detalle && detalle.productoId) {
                if (!productosVendidos[detalle.productoId]) {
                  productosVendidos[detalle.productoId] = {
                    count: 0,
                    ingresos: 0,
                  };
                }
                productosVendidos[detalle.productoId].count +=
                  detalle.cantidad || 0;
                productosVendidos[detalle.productoId].ingresos +=
                  detalle.subtotal || 0;
              }
            });
          }

          // Ventas por mes
          const mesKey = fechaVenta.toLocaleDateString('es-ES', {
            month: 'short',
            year: 'numeric',
          });
          if (!ventasPorMesMap[mesKey]) {
            ventasPorMesMap[mesKey] = { ventas: 0, ingresos: 0 };
          }
          ventasPorMesMap[mesKey].ventas++;
          ventasPorMesMap[mesKey].ingresos += totalVenta;
        }
      } catch (error) {
        console.warn('Error procesando venta individual:', error, venta);
      }
    });

    this.stats.ingresosTotales = ingresosTotales;
    this.stats.ventasHoy = ventasHoy;

    // Ventas recientes (últimas 5)
    this.ventasRecientes = ventas
      .filter((venta) => venta && venta.fecha)
      .sort((a, b) => {
        try {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        } catch {
          return 0;
        }
      })
      .slice(0, 5)
      .map((venta) => {
        try {
          const usuario = usuarios.find((u) => u && u.id === venta.usuarioId);
          return {
            id: venta.id || 0,
            fecha: new Date(venta.fecha),
            usuario: usuario?.fullName || 'Usuario desconocido',
            total: this.getTotalVenta(venta),
            estado: venta.estado || 'Completada',
          };
        } catch (error) {
          console.warn('Error procesando venta reciente:', error);
          return null;
        }
      })
      .filter((venta) => venta !== null) as VentaReciente[];

    // Productos más populares
    this.productosPopulares = Object.entries(productosVendidos)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([productoId, data]) => {
        try {
          const producto = productos.find((p) => p && p.id == productoId);
          return {
            id: parseInt(productoId),
            nombre: producto?.nombre || 'Producto desconocido',
            ventasCount: data.count,
            ingresos: data.ingresos,
          };
        } catch (error) {
          console.warn('Error procesando producto popular:', error);
          return null;
        }
      })
      .filter((producto) => producto !== null) as ProductoPopular[];

    // Convertir ventas por mes para gráficos
    this.ventasPorMes = Object.entries(ventasPorMesMap)
      .map(([mes, data]) => ({
        mes,
        ventas: data.ventas,
        ingresos: data.ingresos,
      }))
      .slice(-6); // Últimos 6 meses
  }

  processCompras(compras: any[]): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let gastosTotales = 0;
    let comprasHoy = 0;
    const comprasPorMesMap: {
      [key: string]: { compras: number; gastos: number };
    } = {};

    compras.forEach((compra) => {
      const fechaCompra = new Date(compra.fecha);
      const totalCompra = this.getTotalCompra(compra);

      gastosTotales += totalCompra;

      if (fechaCompra >= hoy) {
        comprasHoy++;
      }

      // Compras por mes
      const mesKey = fechaCompra.toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric',
      });
      if (!comprasPorMesMap[mesKey]) {
        comprasPorMesMap[mesKey] = { compras: 0, gastos: 0 };
      }
      comprasPorMesMap[mesKey].compras++;
      comprasPorMesMap[mesKey].gastos += totalCompra;
    });

    this.stats.gastosTotales = gastosTotales;
    this.stats.comprasHoy = comprasHoy;

    this.comprasPorMes = Object.entries(comprasPorMesMap)
      .map(([mes, data]) => ({
        mes,
        compras: data.compras,
        gastos: data.gastos,
      }))
      .slice(-6);
  }

  processComentarios(
    comentarios: any[],
    usuarios: any[],
    productos: any[]
  ): void {
    this.comentariosRecientes = comentarios
      .sort(
        (a, b) =>
          new Date(b.fechaCreacion || b.fecha).getTime() -
          new Date(a.fechaCreacion || a.fecha).getTime()
      )
      .slice(0, 5)
      .map((comentario) => {
        const usuario = usuarios.find((u) => u.id === comentario.usuarioId);
        const producto = productos.find((p) => p.id === comentario.productoId);
        return {
          id: comentario.id,
          comentario: comentario.comentario,
          calificacion: comentario.calificacion || 0,
          nombreUsuario: usuario?.fullName || 'Usuario anónimo',
          fecha: new Date(comentario.fechaCreacion || comentario.fecha),
          producto: producto?.nombre || 'Producto desconocido',
        };
      });
  }

  getTotalVenta(venta: any): number {
    return (
      venta.detalles?.reduce(
        (sum: number, detalle: any) => sum + (detalle.subtotal || 0),
        0
      ) || 0
    );
  }

  getTotalCompra(compra: any): number {
    return (
      compra.detalles?.reduce(
        (sum: number, detalle: any) => sum + (detalle.precioTotal || 0),
        0
      ) || 0
    );
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  }

  getUtilidad(): number {
    return this.stats.ingresosTotales - this.stats.gastosTotales;
  }

  getMargenUtilidad(): number {
    if (this.stats.ingresosTotales === 0) return 0;
    return (this.getUtilidad() / this.stats.ingresosTotales) * 100;
  }

  getMaxVentas(): number {
    if (this.ventasPorMes.length === 0) return 1;
    return Math.max(...this.ventasPorMes.map((item) => item.ventas));
  }

  getMaxCompras(): number {
    if (this.comprasPorMes.length === 0) return 1;
    return Math.max(...this.comprasPorMes.map((item) => item.compras));
  }

  refreshData(): void {
    this.loadDashboardData();
  }
}
