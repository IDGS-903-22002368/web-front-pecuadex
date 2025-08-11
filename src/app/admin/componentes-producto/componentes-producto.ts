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
import { ApiService } from '../../core/services/api'; // este sería el mismo que usas para cargar Productos y Piezas
export interface ComponentesProducto {
  id?: number; // opcional
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
  Math: any;

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
    this.apiService.getComponentesProducto().subscribe({
      next: (data) => {
        this.componentes = data;
        this.applyFilters();
      },
      error: () => this.toastr.error('Error cargando componentes'),
    });
  }

  loadProductosYPiezas(): void {
    this.apiService.getProductos().subscribe((data) => (this.productos = data));
    this.apiService.getPiezas().subscribe((data) => (this.piezas = data));
  }
  applyFiltersAndPagination(): void {
    let filtered = [...this.productos];

    // Aplicar filtro de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(this.searchTerm) ||
          producto.descripcion.toLowerCase().includes(this.searchTerm) ||
          producto.precioSugerido.toString().includes(this.searchTerm)
      );
    }

    // Aplicar ordenamiento
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue = a[this.sortField as keyof ComponentesProducto];
        let bValue = b[this.sortField as keyof ComponentesProducto];

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

    // Calcular paginación
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.filteredComponentes = filtered.slice(startIndex, endIndex);
  }

  applyFilters(): void {
    let filtered = [...this.componentes];

    if (this.searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.producto?.nombre?.toLowerCase().includes(this.searchTerm) ||
          c.pieza?.nombre?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredComponentes = filtered.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
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
    return `Mostrando ${start} a ${end} de ${this.totalItems} piezas`;
  }

  // Selección múltiple
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedComponentesProducto = [];
    } else {
      this.selectedComponentesProducto = [...this.selectedComponentesProducto];
    }
  }

  toggleSelect(pieza: ComponentesProducto): void {
    const index = this.selectedComponentesProducto.findIndex(
      (p) => p.id === pieza.id
    );
    if (index > -1) {
      this.selectedComponentesProducto.splice(index, 1);
    } else {
      this.selectedComponentesProducto.push(pieza);
    }
  }

  isSelected(pieza: ComponentesProducto): boolean {
    return this.selectedComponentesProducto.some((p) => p.id === pieza.id);
  }

  isAllSelected(): boolean {
    return (
      this.filteredComponentes.length > 0 &&
      this.filteredComponentes.every((p) => this.isSelected(p))
    );
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  openNew() {
    this.isEditMode = false;
    this.componenteForm.reset({ cantidadRequerida: 0 });
    this.dialogVisible = true;
    this.submitted = false;
  }

  editComponente(c: ComponentesProducto) {
    this.isEditMode = true;
    this.componenteForm.patchValue(c);
    this.dialogVisible = true;
  }

  saveComponente() {
    this.submitted = true;
    if (this.componenteForm.invalid) return;

    const formValue = this.componenteForm.value;

    if (formValue.id) {
      this.apiService
        .updateComponenteProducto(formValue.id, formValue)
        .subscribe({
          next: () => {
            this.toastr.success('Componente actualizado');
            this.loadComponentes();
            this.dialogVisible = false;
          },
          error: () => this.toastr.error('Error actualizando'),
        });
    } else {
      this.apiService.createComponenteProducto(formValue).subscribe({
        next: () => {
          this.toastr.success('Componente creado');
          this.loadComponentes();
          this.dialogVisible = false;
        },
        error: () => this.toastr.error('Error creando'),
      });
    }
  }

  deleteComponente(c: ComponentesProducto) {
    this.componenteToDelete = c;
    this.deleteDialogVisible = true;
  }

  confirmDelete() {
    if (!this.componenteToDelete?.id) return; // verificamos que existe y no es null

    this.apiService
      .deleteComponenteProducto(this.componenteToDelete.id)
      .subscribe({
        next: () => {
          this.toastr.success('Componente eliminado');
          this.loadComponentes();
          this.deleteDialogVisible = false;
        },
        error: () => this.toastr.error('Error eliminando'),
      });
  }
}
