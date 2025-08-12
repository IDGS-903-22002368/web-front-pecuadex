import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/services/api';

export interface ComponentesProducto {
  id?: number;
  productoId: number;
  piezaId: number;
  cantidadRequerida: number;
  // propiedades opcionales devueltas por el backend (Include)
  producto?: { nombre: string };
  pieza?: { nombre: string };
}

@Component({
  selector: 'app-componentes-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './componentes-producto.html',
  styleUrls: ['./componentes-producto.scss'],
})
export class ComponentesProducto implements OnInit {
  componentes: ComponentesProducto[] = [];
  filteredComponentes: ComponentesProducto[] = [];
  selectedComponentesProducto: ComponentesProducto[] = [];

  productos: any[] = [];
  piezas: any[] = [];

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Estados
  loading = false;
  loadingProductos = false;
  loadingPiezas = false;
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  itemsPerPageOptions = [10, 20, 50];

  dialogVisible = false;
  deleteDialogVisible = false;
  isEditMode = false;
  submitted = false;
  searchTerm = '';

  componenteForm: FormGroup;
  componenteToDelete: ComponentesProducto | null = null;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.componenteForm = this.fb.group({
      id: [null],
      productoId: [null, Validators.required],
      piezaId: [null, Validators.required],
      cantidadRequerida: [0, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.loadComponentes();
    this.loadProductosYPiezas();
  }

  loadComponentes(): void {
    this.loading = true;
    this.apiService.getComponentesProducto().subscribe({
      next: (data) => {
        this.componentes = data || [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando componentes:', error);
        this.toastr.error('Error cargando componentes');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadProductosYPiezas(): void {
    // Cargar productos
    this.loadingProductos = true;
    this.apiService.getProductos().subscribe({
      next: (data) => {
        this.productos = data || [];
        this.loadingProductos = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.toastr.error('Error cargando productos');
        this.loadingProductos = false;
        this.cdr.detectChanges();
      },
    });

    // Cargar piezas
    this.loadingPiezas = true;
    this.apiService.getPiezas().subscribe({
      next: (data) => {
        this.piezas = data || [];
        this.loadingPiezas = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando piezas:', error);
        this.toastr.error('Error cargando piezas');
        this.loadingPiezas = false;
        this.cdr.detectChanges();
      },
    });
  }

  // CORREGIDO: Este método ahora filtra componentes, no productos
  applyFilters(): void {
    let filtered = [...this.componentes]; // ← CORREGIDO: era this.productos

    if (this.searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.producto?.nombre?.toLowerCase().includes(this.searchTerm) ||
          c.pieza?.nombre?.toLowerCase().includes(this.searchTerm)
      );
    }

    // Aplicar ordenamiento
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue = a[this.sortField as keyof ComponentesProducto];
        let bValue = b[this.sortField as keyof ComponentesProducto];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (
          (aValue === undefined || aValue === null) &&
          (bValue === undefined || bValue === null)
        )
          return 0;
        if (aValue === undefined || aValue === null)
          return this.sortDirection === 'asc' ? 1 : -1;
        if (bValue === undefined || bValue === null)
          return this.sortDirection === 'asc' ? -1 : 1;

        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Calcular paginación
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.filteredComponentes = filtered.slice(startIndex, endIndex);
  }

  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
    this.cdr.detectChanges();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'sort';
    return this.sortDirection === 'asc' ? 'sort-up' : 'sort-down';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
      this.cdr.detectChanges();
    }
  }

  changeItemsPerPage(event: any): void {
    this.itemsPerPage = parseInt(event.target.value);
    this.currentPage = 1;
    this.applyFilters();
    this.cdr.detectChanges();
  }

  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `Mostrando ${start} a ${end} de ${this.totalItems} componentes`; // ← CORREGIDO: era "piezas"
  }

  // Selección múltiple
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedComponentesProducto = [];
    } else {
      this.selectedComponentesProducto = [...this.filteredComponentes]; // ← CORREGIDO
    }
    this.cdr.detectChanges();
  }

  toggleSelect(componente: ComponentesProducto): void {
    // ← CORREGIDO: parámetro renombrado
    const index = this.selectedComponentesProducto.findIndex(
      (p) => p.id === componente.id
    );
    if (index > -1) {
      this.selectedComponentesProducto.splice(index, 1);
    } else {
      this.selectedComponentesProducto.push(componente);
    }
    this.cdr.detectChanges();
  }

  isSelected(componente: ComponentesProducto): boolean {
    // ← CORREGIDO: parámetro renombrado
    return this.selectedComponentesProducto.some((p) => p.id === componente.id);
  }

  isAllSelected(): boolean {
    return (
      this.filteredComponentes.length > 0 &&
      this.filteredComponentes.every((p) => this.isSelected(p))
    );
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.currentPage = 1; // Reset page when searching
    this.applyFilters();
    this.cdr.detectChanges();
  }

  openNew(): void {
    this.isEditMode = false;
    this.componenteForm.reset({ cantidadRequerida: 1 }); // ← Valor por defecto más lógico
    this.dialogVisible = true;
    this.submitted = false;
    this.cdr.detectChanges();
  }

  editComponente(c: ComponentesProducto): void {
    this.isEditMode = true;
    this.componenteForm.patchValue(c);
    this.dialogVisible = true;
    this.cdr.detectChanges();
  }

  saveComponente(): void {
    this.submitted = true;
    if (this.componenteForm.invalid) {
      this.cdr.detectChanges();
      return;
    }

    const formValue = this.componenteForm.value;

    if (formValue.id) {
      // Actualizar
      this.apiService
        .updateComponenteProducto(formValue.id, formValue)
        .subscribe({
          next: () => {
            this.toastr.success('Componente actualizado correctamente');
            this.loadComponentes();
            this.dialogVisible = false;
            this.submitted = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error actualizando componente:', error);
            this.toastr.error('Error actualizando componente');
            this.cdr.detectChanges();
          },
        });
    } else {
      // Crear
      this.apiService.createComponenteProducto(formValue).subscribe({
        next: () => {
          this.toastr.success('Componente creado correctamente');
          this.loadComponentes();
          this.dialogVisible = false;
          this.submitted = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creando componente:', error);
          this.toastr.error('Error creando componente');
          this.cdr.detectChanges();
        },
      });
    }
  }

  deleteComponente(c: ComponentesProducto): void {
    this.componenteToDelete = c;
    this.deleteDialogVisible = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.componenteToDelete?.id) return;

    this.apiService
      .deleteComponenteProducto(this.componenteToDelete.id)
      .subscribe({
        next: () => {
          this.toastr.success('Componente eliminado correctamente');
          this.loadComponentes();
          this.deleteDialogVisible = false;
          this.componenteToDelete = null;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error eliminando componente:', error);
          this.toastr.error('Error eliminando componente');
          this.cdr.detectChanges();
        },
      });
  }

  // Método para cerrar modales
  hideDialog(): void {
    this.dialogVisible = false;
    this.submitted = false;
    this.componenteForm.reset();
    this.cdr.detectChanges();
  }

  hideDeleteDialog(): void {
    this.deleteDialogVisible = false;
    this.componenteToDelete = null;
    this.cdr.detectChanges();
  }
}
