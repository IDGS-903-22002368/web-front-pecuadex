import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { ApiService } from '../../core/services/api';
import { ToastrService } from 'ngx-toastr';

export interface CompraClienteData {
  fecha: Date;
  total: number;
  productos: ProductoCompraData[];
  ventaId?: number; // Agregar ID de venta
}

export interface ProductoCompraData {
  id?: number;
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  ventaId?: number; // Agregar ID de venta
}

export interface ComentarioData {
  id?: number;
  ventaId: number;
  productoId: number;
  descripcion: string;
  calificacion: number;
  fecha?: Date;
  nombreProducto?: string;
  nombreCliente?: string;
}

@Component({
  selector: 'app-mis-compras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mis-compras.html',
  styleUrls: ['./mis-compras.scss'],
})
export class MisCompras implements OnInit {
  compras: CompraClienteData[] = [];
  filteredCompras: CompraClienteData[] = [];
  comentarios: ComentarioData[] = [];

  // Paginación
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;
  totalPages = 0;

  // Estados
  loading = false;
  dialogVisible = false;
  searchTerm = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Form para comentarios
  comentarioForm: FormGroup;
  submitted = false;
  selectedProducto: ProductoCompraData | null = null;
  currentVentaId: number | null = null;
  isEditMode = false;
  comentarioToEdit: ComentarioData | null = null;

  // Opciones de items por página
  itemsPerPageOptions = [5, 10, 20];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.comentarioForm = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      calificacion: [
        5,
        [Validators.required, Validators.min(1), Validators.max(5)],
      ],
    });
  }

  ngOnInit(): void {
    this.loadCompras();
    this.loadMisComentarios();
  }

  loadCompras(): void {
    this.loading = true;
    this.apiService.getComprasCliente().subscribe({
      next: (data) => {
        console.log('Datos de compras recibidos:', data);

        // Mapear los datos usando los IDs de venta reales del backend
        this.compras = data.map((compra) => ({
          ...compra,
          fecha: new Date(compra.fecha),
          ventaId: compra.ventaId, // Usar el ID real de venta
          productos: compra.productos.map((producto: any) => ({
            ...producto,
            productoId: producto.productoId || producto.id,
            ventaId: compra.ventaId, // Usar el ID real de venta
          })),
        }));

        this.applyFiltersAndPagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando compras:', error);
        this.loading = false;
        this.toastr.error('Error al cargar las compras', 'Error');
      },
    });
  }

  loadMisComentarios(): void {
    this.apiService.getMisComentarios().subscribe({
      next: (data) => {
        console.log('Comentarios del usuario:', data);
        this.comentarios = data.map((comentario) => ({
          ...comentario,
          fecha: new Date(comentario.fecha),
        }));
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando comentarios:', error);
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
    let filtered = [...this.compras];

    // Aplicar filtro de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(
        (compra) =>
          compra.productos.some((producto) =>
            producto.nombre.toLowerCase().includes(this.searchTerm)
          ) ||
          compra.total.toString().includes(this.searchTerm) ||
          this.formatDate(compra.fecha).toLowerCase().includes(this.searchTerm)
      );
    }

    // Aplicar ordenamiento por fecha (más recientes primero)
    filtered.sort((a, b) => {
      return b.fecha.getTime() - a.fecha.getTime();
    });

    // Calcular paginación
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.filteredCompras = filtered.slice(startIndex, endIndex);
  }

  // Paginación
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
    return `Mostrando ${start} a ${end} de ${this.totalItems} compras`;
  }

  // Comentarios
  openComentarioDialog(producto: ProductoCompraData): void {
    console.log('Abriendo dialog para producto:', producto);

    this.selectedProducto = producto;
    this.currentVentaId = producto.ventaId || null;
    this.isEditMode = false;
    this.comentarioToEdit = null;

    if (!this.currentVentaId) {
      this.toastr.error('Error: No se pudo identificar la venta', 'Error');
      return;
    }

    // Verificar si ya existe un comentario para este producto en esta venta
    const existingComentario = this.comentarios.find(
      (c) =>
        c.productoId === producto.productoId &&
        c.ventaId === this.currentVentaId
    );

    if (existingComentario) {
      this.isEditMode = true;
      this.comentarioToEdit = existingComentario;
      this.comentarioForm.patchValue({
        descripcion: existingComentario.descripcion,
        calificacion: existingComentario.calificacion,
      });
    } else {
      this.comentarioForm.reset({
        descripcion: '',
        calificacion: 5,
      });
    }

    this.submitted = false;
    this.dialogVisible = true;
  }

  saveComentario(): void {
    this.submitted = true;

    if (
      this.comentarioForm.valid &&
      this.selectedProducto &&
      this.currentVentaId
    ) {
      const formData = this.comentarioForm.value;

      const comentarioData = {
        ventaId: this.currentVentaId,
        productoId: this.selectedProducto.productoId,
        descripcion: formData.descripcion,
        calificacion: formData.calificacion,
      };

      console.log('Enviando comentario:', comentarioData);

      if (this.isEditMode && this.comentarioToEdit) {
        // Actualizar comentario existente
        this.apiService
          .updateComentario(this.comentarioToEdit.id!, comentarioData)
          .subscribe({
            next: (updatedComentario) => {
              console.log('Comentario actualizado:', updatedComentario);
              this.loadMisComentarios(); // Recargar comentarios
              this.toastr.success('Comentario actualizado correctamente');
              this.hideDialog();
            },
            error: (error) => {
              console.error('Error actualizando comentario:', error);
              this.toastr.error(
                error.error?.message || 'Error al actualizar comentario'
              );
            },
          });
      } else {
        // Crear nuevo comentario
        this.apiService.createComentario(comentarioData).subscribe({
          next: (response) => {
            console.log('Comentario creado:', response);
            this.loadMisComentarios(); // Recargar comentarios
            this.toastr.success('Comentario guardado correctamente');
            this.hideDialog();
          },
          error: (error) => {
            console.error('Error creando comentario:', error);
            this.toastr.error(
              error.error?.message || 'Error al guardar comentario'
            );
          },
        });
      }
    } else {
      this.toastr.error('Por favor, complete todos los campos requeridos');
    }
  }

  hideDialog(): void {
    this.dialogVisible = false;
    this.submitted = false;
    this.selectedProducto = null;
    this.currentVentaId = null;
    this.comentarioToEdit = null;
  }

  // Verificar si un producto ya tiene comentario
  hasComentario(productoId: number, ventaId?: number): boolean {
    if (!productoId || !ventaId) return false;
    return this.comentarios.some(
      (c) => c.productoId === productoId && c.ventaId === ventaId
    );
  }

  getComentario(
    productoId: number,
    ventaId?: number
  ): ComentarioData | undefined {
    if (!productoId || !ventaId) return undefined;
    return this.comentarios.find(
      (c) => c.productoId === productoId && c.ventaId === ventaId
    );
  }

  // Utilidades
  formatCurrency(value: number): string {
    if (!value && value !== 0) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  exportCompras(): void {
    const csvContent = this.convertToCSV(this.compras);
    this.downloadCSV(csvContent, 'mis-compras');
  }

  private convertToCSV(data: CompraClienteData[]): string {
    if (!data || data.length === 0) return '';

    const headers = ['Fecha', 'Total', 'Productos'];
    const csvData = data.map((compra) => [
      this.formatDate(compra.fecha),
      compra.total,
      compra.productos.map((p) => `${p.nombre} (${p.cantidad})`).join('; '),
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

  getStars(calificacion: number): number[] {
    return Array(calificacion).fill(0);
  }

  getEmptyStars(calificacion: number): number[] {
    return Array(5 - calificacion).fill(0);
  }

  // Form getters
  get descripcionControl(): AbstractControl | null {
    return this.comentarioForm.get('descripcion');
  }

  get calificacionControl(): AbstractControl | null {
    return this.comentarioForm.get('calificacion');
  }
}
