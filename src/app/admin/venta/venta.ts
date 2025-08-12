import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { ApiService } from '../../core/services/api';
import { ToastrService } from 'ngx-toastr';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precioSugerido: number;
  imagen: string;
  componentesProducto?: {
    pieza: {
      nombre: string;
      unidadMedida: string;
    };
    cantidadRequerida: number;
  }[];
}

interface Usuario {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface DetalleVentaForm {
  productoId: number;
  cantidad: number;
  subtotal: number;
}

interface Venta {
  id?: number;
  fecha: Date;
  total: number;
  estado: string;
  detalles: DetalleVenta[];
  usuarioId?: string;
  usuario?: Usuario;
}

interface DetalleVenta {
  id?: number;
  ventaId?: number;
  productoId: number;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './venta.html',
  styleUrls: ['./venta.scss'],
})
export class VentasComponent implements OnInit {
  ventas: Venta[] = [];
  filteredVentas: Venta[] = [];
  productos: Producto[] = [];
  usuarios: Usuario[] = [];
  selectedVenta: Venta | null = null;

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Filtros
  fechaDesde: string | null = null;
  fechaHasta: string | null = null;
  searchTerm = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Estados
  loading = false;
  dialogVisible = false;
  viewDialogVisible = false;
  submitted = false;

  // Form
  ventaForm: FormGroup;
  itemsPerPageOptions = [10, 20, 50];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.ventaForm = this.fb.group({
      id: [null],
      usuarioId: ['', Validators.required],
      detalles: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadVentas();
    this.loadProductos();
    this.loadUsuarios();
  }

  get detalles(): FormArray {
    return this.ventaForm.get('detalles') as FormArray;
  }

  loadVentas(): void {
    this.loading = true;
    this.apiService.getVentas().subscribe({
      next: (data) => {
        this.ventas = data.map(venta => ({
          ...venta,
          fecha: new Date(venta.fecha),
          detalles: venta.detalles.map((detalle: DetalleVenta) => ({
            ...detalle,
            producto: this.productos.find(p => p.id === detalle.productoId)
          }))
        }));
        this.applyFiltersAndPagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando ventas:', error);
        this.loading = false;
        this.toastr.error('Error al cargar ventas', 'Error');
      },
    });
  }

  loadProductos(): void {
    this.apiService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        // Después de cargar productos, recargamos las ventas para vincular los productos
        this.loadVentas();
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.toastr.error('Error al cargar productos', 'Error');
      },
    });
  }

  loadUsuarios(): void {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.toastr.error('Error al cargar usuarios', 'Error');
      },
    });
  }

  // Filtrado y búsqueda
  onSearch(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  applyFiltersAndPagination(): void {
    let filtered = [...this.ventas];

    // Filtrar por fechas
    if (this.fechaDesde) {
      const desde = new Date(this.fechaDesde);
      filtered = filtered.filter(v => new Date(v.fecha) >= desde);
    }
    if (this.fechaHasta) {
      const hasta = new Date(this.fechaHasta);
      filtered = filtered.filter(v => new Date(v.fecha) <= hasta);
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(
        (venta) =>
          venta.detalles.some(d => 
            d.producto?.nombre.toLowerCase().includes(this.searchTerm)
          ) ||
          venta.estado.toLowerCase().includes(this.searchTerm) ||
          venta.usuario?.fullName.toLowerCase().includes(this.searchTerm) ||
          venta.usuario?.email.toLowerCase().includes(this.searchTerm)
      );
    }

    // Ordenamiento
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (this.sortField === 'total') {
          aValue = this.getTotalVenta(a);
          bValue = this.getTotalVenta(b);
        } else {
          aValue = a[this.sortField as keyof Venta];
          bValue = b[this.sortField as keyof Venta];
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return this.sortDirection === 'asc' ? 1 : -1;
        if (bValue === undefined) return this.sortDirection === 'asc' ? -1 : 1;

        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Paginación
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.filteredVentas = filtered.slice(startIndex, endIndex);
  }

  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndPagination();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'sort';
    return this.sortDirection === 'asc' ? 'sort-up' : 'sort-down';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndPagination();
    }
  }

  changeItemsPerPage(event: any): void {
    this.itemsPerPage = parseInt(event.target.value);
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `Mostrando ${start} a ${end} de ${this.totalItems} ventas`;
  }

  // Métodos para el formulario de detalles
  createDetalle(detalle?: DetalleVentaForm): FormGroup {
    return this.fb.group({
      productoId: [detalle?.productoId || null, Validators.required],
      cantidad: [detalle?.cantidad || 1, [Validators.required, Validators.min(1)]],
      subtotal: [{ value: detalle?.subtotal || 0, disabled: true }],
    });
  }

  addDetalle(): void {
    this.detalles.push(this.createDetalle());
    this.calcularTotalVenta();
  }

  removeDetalle(index: number): void {
    this.detalles.removeAt(index);
    this.calcularTotalVenta();
  }

  calcularTotalDetalle(index: number): void {
    const detalle = this.detalles.at(index);
    const cantidad = detalle.get('cantidad')?.value || 0;
    const productoId = detalle.get('productoId')?.value;
    
    if (productoId) {
      const producto = this.productos.find(p => p.id == productoId);
      if (producto) {
        const subtotal = cantidad * producto.precioSugerido;
        detalle.get('subtotal')?.setValue(subtotal);
      }
    }
    
    this.calcularTotalVenta();
  }

  calcularTotalVenta(): number {
    return this.detalles.controls.reduce((sum, detalle) => {
      return sum + (detalle.get('subtotal')?.value || 0);
    }, 0);
  }

  getTotalVenta(venta: Venta): number {
    return venta.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  }

  // CRUD Operations
  openNew(): void {
    this.ventaForm.reset({
      usuarioId: '',
      detalles: []
    });
    this.detalles.clear();
    this.addDetalle(); // Agregar un detalle por defecto
    this.submitted = false;
    this.dialogVisible = true;
  }

  viewVenta(venta: Venta): void {
    this.selectedVenta = venta;
    this.viewDialogVisible = true;
  }

  saveVenta(): void {
    this.submitted = true;

    if (this.ventaForm.valid && this.detalles.length > 0) {
      const formData = this.ventaForm.value;
      
      const ventaData = {
        usuarioId: formData.usuarioId,
        detalles: formData.detalles.map((d: any) => {
          const producto = this.productos.find(p => p.id == d.productoId);
          return {
            productoId: d.productoId,
            cantidad: d.cantidad,
            precioUnitario: producto ? producto.precioSugerido : 0,
            subtotal: d.subtotal
          };
        })
      };

      console.log('Datos a enviar:', JSON.stringify(ventaData, null, 2));

      this.apiService.createVenta(ventaData).subscribe({
        next: (newVenta) => {
          // Vincular los productos y usuario a la nueva venta
          newVenta.detalles = newVenta.detalles.map((detalle: DetalleVenta) => ({
            ...detalle,
            producto: this.productos.find(p => p.id === detalle.productoId)
          }));
          
          newVenta.usuario = this.usuarios.find(u => u.id === newVenta.usuarioId);
          newVenta.fecha = new Date(newVenta.fecha);
          
          this.ventas.unshift(newVenta);
          this.applyFiltersAndPagination();
          this.toastr.success('Venta creada correctamente');
          this.hideDialog();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creando venta:', error);
          this.toastr.error('Error al crear venta: ' + (error.error?.message || 'Error desconocido'));
        },
      });
    }
  }

  hideDialog(): void {
    this.dialogVisible = false;
    this.submitted = false;
  }

  // Getters para controles del formulario
  get usuarioControl(): AbstractControl | null {
    return this.ventaForm.get('usuarioId');
  }

  getProductoControl(index: number): AbstractControl | null {
    return this.detalles.at(index).get('productoId');
  }

  getCantidadControl(index: number): AbstractControl | null {
    return this.detalles.at(index).get('cantidad');
  }

  // Método para actualizar el subtotal cuando se selecciona un producto o cambia la cantidad
  onProductoChange(index: number): void {
    this.calcularTotalDetalle(index);
  }

  onCantidadChange(index: number): void {
    this.calcularTotalDetalle(index);
  }

  // Método para obtener el precio sugerido de un producto seleccionado
  getProductoPrecio(productoId: number): number {
    const producto = this.productos.find(p => p.id == productoId);
    return producto ? producto.precioSugerido : 0;
  }

  // Método para verificar stock disponible (opcional - requeriría endpoint adicional)
  checkStockDisponible(productoId: number, cantidadRequerida: number): boolean {
    // Esta funcionalidad requeriría un endpoint que devuelva el stock actual
    // por ahora retorna true, pero podrías implementarlo
    return true;
  }

  // Método para obtener información adicional del producto
  getProductoInfo(productoId: number): Producto | undefined {
    return this.productos.find(p => p.id == productoId);
  }

  // Método para obtener el nombre del usuario
  getUsuarioNombre(usuarioId: string): string {
    const usuario = this.usuarios.find(u => u.id === usuarioId);
    return usuario ? usuario.fullName : 'Usuario no encontrado';
  }
}