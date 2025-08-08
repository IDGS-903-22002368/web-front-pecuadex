import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../core/services/api';
import { AuthService } from '../../core/services/auth';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Chart, ChartConfiguration } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // UI Control
  sidebarCollapsed = false;
  activeSection = 'dashboard';
  searchTerm = '';
  loading = false;

  // User Info
  currentUser: any = null;

  // Dashboard Stats
  stats = {
    totalVentas: 0,
    ventasMes: 0,
    clientesActivos: 0,
    dispositivosActivos: 0,
    productosStock: 0,
    cotizacionesPendientes: 0,
  };

  // Data Collections
  productos: any[] = [];
  ventas: any[] = [];
  compras: any[] = [];
  proveedores: any[] = [];
  usuarios: any[] = [];
  cotizaciones: any[] = [];
  piezas: any[] = [];
  comentarios: any[] = [];

  // Forms
  productForm!: FormGroup;
  proveedorForm!: FormGroup;
  compraForm!: FormGroup;
  ventaForm!: FormGroup;
  cotizacionForm!: FormGroup;

  // Modals
  showProductModal = false;
  showProveedorModal = false;
  showCompraModal = false;
  showVentaModal = false;
  showCotizacionModal = false;
  showUserModal = false;

  // Edit States
  editingProduct: any = null;
  editingProveedor: any = null;
  selectedCotizacion: any = null;

  // Charts
  salesChart: any;
  productsChart: any;

  // Cotizaciones específicas
  cotizacionesStats = {
    total: 0,
    pendientes: 0,
    enviadas: 0,
    aceptadas: 0,
    convertidas: 0,
    rechazadas: 0,
    valorTotal: 0,
    tasaConversion: 0,
  };

  cotizacionFilter = 'todos';
  cotizacionPage = 1;
  cotizacionPageSize = 10;
  cotizacionTotalPages = 1;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadDashboardData();
    this.initializeCharts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms(): void {
    // Formulario de Producto
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', Validators.required],
      precioSugerido: [0, [Validators.required, Validators.min(0)]],
      imagen: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
    });

    // Formulario de Proveedor
    this.proveedorForm = this.fb.group({
      nombreEmpresa: ['', Validators.required],
      contacto: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    // Formulario de Compra
    this.compraForm = this.fb.group({
      proveedorId: ['', Validators.required],
      fecha: [new Date(), Validators.required],
      detalles: this.fb.array([]),
    });

    // Formulario de Venta
    this.ventaForm = this.fb.group({
      clienteId: ['', Validators.required],
      fecha: [new Date(), Validators.required],
      detalles: this.fb.array([]),
    });

    // Formulario de Cotización
    this.cotizacionForm = this.fb.group({
      precioFinal: [0, [Validators.required, Validators.min(0)]],
      notasAdicionales: [''],
      validezDias: [30, [Validators.required, Validators.min(1)]],
    });
  }

  loadUserInfo(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });
  }

  loadDashboardData(): void {
    this.loading = true;

    // Cargar estadísticas
    this.loadStats();

    // Cargar datos según la sección activa
    switch (this.activeSection) {
      case 'dashboard':
        this.loadDashboardStats();
        break;
      case 'productos':
        this.loadProductos();
        break;
      case 'ventas':
        this.loadVentas();
        break;
      case 'compras':
        this.loadCompras();
        break;
      case 'proveedores':
        this.loadProveedores();
        break;
      case 'usuarios':
        this.loadUsuarios();
        break;
      case 'cotizaciones':
        this.loadCotizaciones();
        break;
      case 'inventario':
        this.loadInventario();
        break;
    }
  }

  loadStats(): void {
    // Cargar estadísticas generales
    this.apiService.getVentas().subscribe((ventas) => {
      this.stats.totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
      const currentMonth = new Date().getMonth();
      this.stats.ventasMes = ventas
        .filter((v) => new Date(v.fecha).getMonth() === currentMonth)
        .reduce((sum, v) => sum + v.total, 0);
    });

    this.apiService.getUsers().subscribe((users) => {
      this.stats.clientesActivos = users.filter((u) =>
        u.roles.includes('Client')
      ).length;
    });

    this.apiService.getProductos().subscribe((productos) => {
      this.stats.productosStock = productos.length;
      this.stats.dispositivosActivos = productos
        .filter((p) => p.nombre.toLowerCase().includes('gps'))
        .reduce((sum, p) => sum + (p.stock || 0), 0);
    });

    // Cargar estadísticas de cotizaciones
    this.apiService.obtenerEstadisticasCotizaciones().subscribe((stats) => {
      this.cotizacionesStats = stats;
      this.stats.cotizacionesPendientes = stats.pendientes;
    });
  }

  loadDashboardStats(): void {
    // Datos adicionales para el dashboard
    this.loadRecentActivities();
    this.updateCharts();
  }

  loadProductos(): void {
    this.apiService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Error al cargar productos', 'Error');
        this.loading = false;
      },
    });
  }

  loadVentas(): void {
    this.apiService.getVentas().subscribe({
      next: (ventas) => {
        this.ventas = ventas.map((v) => ({
          ...v,
          cliente: 'Cliente ' + v.usuarioId?.substring(0, 8),
          items: v.detalles?.length || 0,
        }));
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Error al cargar ventas', 'Error');
        this.loading = false;
      },
    });
  }

  loadCompras(): void {
    this.apiService.getCompras().subscribe({
      next: (compras) => {
        this.compras = compras;
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Error al cargar compras', 'Error');
        this.loading = false;
      },
    });
  }

  loadProveedores(): void {
    this.apiService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Error al cargar proveedores', 'Error');
        this.loading = false;
      },
    });
  }

  loadUsuarios(): void {
    this.apiService.getUsers().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Error al cargar usuarios', 'Error');
        this.loading = false;
      },
    });
  }

  loadCotizaciones(): void {
    const estado =
      this.cotizacionFilter === 'todos' ? undefined : this.cotizacionFilter;

    this.apiService
      .listarCotizaciones(estado, this.cotizacionPage, this.cotizacionPageSize)
      .subscribe({
        next: (response) => {
          this.cotizaciones = response.cotizaciones;
          this.cotizacionTotalPages = response.totalPages;
          this.loading = false;
        },
        error: (error) => {
          this.toastr.error('Error al cargar cotizaciones', 'Error');
          this.loading = false;
        },
      });
  }

  loadInventario(): void {
    this.apiService.getPiezas().subscribe({
      next: (piezas) => {
        this.piezas = piezas;

        // Cargar movimientos para calcular existencias
        this.apiService.getMovimientos().subscribe((movimientos) => {
          // Calcular existencias actuales por pieza
          this.piezas = this.piezas.map((pieza) => {
            const movimientosPieza = movimientos.filter(
              (m) => m.piezaId === pieza.id
            );
            const ultimoMovimiento = movimientosPieza.sort(
              (a, b) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            )[0];

            return {
              ...pieza,
              existencias: ultimoMovimiento?.existencias || 0,
              costoPromedio: ultimoMovimiento?.costoPromedio || 0,
            };
          });
        });

        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Error al cargar inventario', 'Error');
        this.loading = false;
      },
    });
  }

  // ========== GESTIÓN DE COTIZACIONES ==========

  verCotizacion(cotizacion: any): void {
    this.selectedCotizacion = cotizacion;
    this.showCotizacionModal = true;

    // Cargar detalles completos
    this.apiService.obtenerCotizacion(cotizacion.id).subscribe({
      next: (data) => {
        this.selectedCotizacion = data;
        this.cotizacionForm.patchValue({
          precioFinal: data.precioFinal || data.precioCalculado || 0,
          notasAdicionales: data.notasInternas || '',
        });
      },
      error: (error) => {
        this.toastr.error('Error al cargar detalles de cotización', 'Error');
      },
    });
  }

  enviarCotizacion(): void {
    if (!this.selectedCotizacion) return;

    Swal.fire({
      title: '¿Enviar Cotización?',
      text: `Se enviará la cotización por $${this.cotizacionForm.value.precioFinal} MXN al cliente`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Enviar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          cotizacionId: this.selectedCotizacion.id,
          precioFinal: this.cotizacionForm.value.precioFinal,
          notasAdicionales: this.cotizacionForm.value.notasAdicionales,
          validezDias: this.cotizacionForm.value.validezDias,
        };

        this.apiService.enviarCotizacion(data).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastr.success('Cotización enviada exitosamente', 'Éxito');
              this.showCotizacionModal = false;
              this.loadCotizaciones();
            }
          },
          error: (error) => {
            this.toastr.error('Error al enviar cotización', 'Error');
          },
        });
      }
    });
  }

  aceptarCotizacion(cotizacion: any): void {
    Swal.fire({
      title: 'Marcar como Aceptada',
      text: 'La cotización será marcada como aceptada por el cliente',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.aceptarCotizacion(cotizacion.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastr.success('Cotización marcada como aceptada', 'Éxito');
              this.loadCotizaciones();
            }
          },
          error: (error) => {
            this.toastr.error('Error al actualizar cotización', 'Error');
          },
        });
      }
    });
  }

  crearClienteDesdeCotizacion(cotizacion: any): void {
    Swal.fire({
      title: 'Crear Cliente',
      html: `
        <p>Se creará un usuario cliente para:</p>
        <p><strong>${cotizacion.nombreCliente}</strong></p>
        <p>${cotizacion.emailCliente}</p>
        <hr>
        <div class="form-group">
          <label>Contraseña (dejar vacío para generar automáticamente):</label>
          <input type="password" id="swal-password" class="swal2-input" placeholder="Contraseña opcional">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear Cliente',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const password = (
          document.getElementById('swal-password') as HTMLInputElement
        ).value;
        return password;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService
          .crearClienteDesdeCotizacion(cotizacion.id, result.value)
          .subscribe({
            next: (response) => {
              if (response.success) {
                Swal.fire({
                  icon: 'success',
                  title: 'Cliente Creado',
                  html: `
                  <p>Cliente creado exitosamente</p>
                  <p><strong>Email:</strong> ${response.email}</p>
                  <p><strong>ID Venta:</strong> #${response.ventaId}</p>
                  <p class="text-info">Se han enviado las credenciales por email al cliente</p>
                `,
                  confirmButtonText: 'Excelente',
                });
                this.loadCotizaciones();
                this.loadUsuarios();
              }
            },
            error: (error) => {
              this.toastr.error(
                error.error?.message || 'Error al crear cliente',
                'Error'
              );
            },
          });
      }
    });
  }

  cambiarEstadoCotizacion(cotizacion: any, nuevoEstado: string): void {
    const estados = {
      Pendiente: 'warning',
      Enviada: 'info',
      Aceptada: 'success',
      Rechazada: 'error',
      Convertida: 'success',
    };

    Swal.fire({
      title: 'Cambiar Estado',
      input: 'select',
      inputOptions: estados,
      inputValue: cotizacion.estado,
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService
          .actualizarEstadoCotizacion(cotizacion.id, result.value, '')
          .subscribe({
            next: () => {
              this.toastr.success('Estado actualizado', 'Éxito');
              this.loadCotizaciones();
            },
            error: (error) => {
              this.toastr.error('Error al actualizar estado', 'Error');
            },
          });
      }
    });
  }

  // ========== GESTIÓN DE PRODUCTOS ==========

  openProductModal(product?: any): void {
    this.editingProduct = product;
    if (product) {
      this.productForm.patchValue(product);
    } else {
      this.productForm.reset();
    }
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.editingProduct = null;
    this.productForm.reset();
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach((key) => {
        const control = this.productForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const productData = this.productForm.value;

    if (this.editingProduct) {
      this.apiService
        .updateProducto(this.editingProduct.id, productData)
        .subscribe({
          next: () => {
            this.toastr.success('Producto actualizado exitosamente', 'Éxito');
            this.closeProductModal();
            this.loadProductos();
          },
          error: (error) => {
            this.toastr.error('Error al actualizar producto', 'Error');
          },
        });
    } else {
      this.apiService.createProducto(productData).subscribe({
        next: () => {
          this.toastr.success('Producto creado exitosamente', 'Éxito');
          this.closeProductModal();
          this.loadProductos();
        },
        error: (error) => {
          this.toastr.error('Error al crear producto', 'Error');
        },
      });
    }
  }

  deleteProduct(product: any): void {
    Swal.fire({
      title: '¿Eliminar Producto?',
      text: `Se eliminará el producto: ${product.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteProducto(product.id).subscribe({
          next: () => {
            this.toastr.success('Producto eliminado', 'Éxito');
            this.loadProductos();
          },
          error: (error) => {
            this.toastr.error('Error al eliminar producto', 'Error');
          },
        });
      }
    });
  }

  // ========== UTILIDADES ==========

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    this.loadDashboardData();
  }

  getSectionTitle(): string {
    const titles: any = {
      dashboard: 'Dashboard',
      productos: 'Productos',
      ventas: 'Ventas',
      compras: 'Compras',
      proveedores: 'Proveedores',
      usuarios: 'Usuarios',
      cotizaciones: 'Cotizaciones',
      inventario: 'Inventario',
      reportes: 'Reportes',
    };
    return titles[this.activeSection] || 'Dashboard';
  }

  getStockClass(stock: number): string {
    if (stock > 50) return 'bg-success';
    if (stock > 20) return 'bg-warning';
    return 'bg-danger';
  }

  getStatusClass(status: string): string {
    const classes: any = {
      Pendiente: 'warning',
      Enviada: 'info',
      Aceptada: 'success',
      Completada: 'success',
      Rechazada: 'danger',
      Convertida: 'primary',
    };
    return classes[status] || 'secondary';
  }

  getCotizacionBadgeClass(estado: string): string {
    const classes: any = {
      Pendiente: 'badge-warning',
      Enviada: 'badge-info',
      Aceptada: 'badge-success',
      Rechazada: 'badge-danger',
      Convertida: 'badge-primary',
    };
    return classes[estado] || 'badge-secondary';
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productForm.patchValue({ imagen: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  logout(): void {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: 'Se cerrará tu sesión actual',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Cerrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }

  // ========== CHARTS ==========

  initializeCharts(): void {
    // Inicializar después de que el DOM esté listo
    setTimeout(() => {
      this.createSalesChart();
      this.createProductsChart();
    }, 500);
  }

  createSalesChart(): void {
    const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Ventas',
            data: [12000, 19000, 15000, 25000, 22000, 30000],
            borderColor: '#2E7D32',
            backgroundColor: 'rgba(46, 125, 50, 0.1)',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };

    this.salesChart = new Chart(ctx, config);
  }

  createProductsChart(): void {
    const ctx = document.getElementById('productsChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['GPS Básico', 'GPS Pro', 'GPS Enterprise', 'Accesorios'],
        datasets: [
          {
            data: [35, 40, 20, 5],
            backgroundColor: ['#2E7D32', '#81C784', '#FF6F00', '#FFB300'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };

    this.productsChart = new Chart(ctx, config);
  }

  updateCharts(): void {
    // Actualizar datos de los charts
    if (this.salesChart) {
      this.salesChart.update();
    }
    if (this.productsChart) {
      this.productsChart.update();
    }
  }

  loadRecentActivities(): void {
    // Simular actividades recientes (en producción vendría de la API)
    this.recentActivities = [
      {
        type: 'success',
        icon: 'fas fa-shopping-cart',
        description: 'Nueva venta registrada #1234',
        time: 'Hace 5 minutos',
      },
      {
        type: 'info',
        icon: 'fas fa-file-invoice',
        description: 'Cotización enviada a Juan Pérez',
        time: 'Hace 1 hora',
      },
      {
        type: 'warning',
        icon: 'fas fa-box',
        description: 'Stock bajo en GPS Básico',
        time: 'Hace 2 horas',
      },
    ];
  }

  recentActivities: any[] = [];
}
