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

export interface ProveedorData {
  id?: number;
  nombreEmpresa: string;
  contacto?: string;
  telefono?: string;
  email?: string;
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './proveedor.html',
  styleUrls: ['./proveedor.scss'],
})
export class ProveedorComponent implements OnInit {
  proveedores: ProveedorData[] = [];
  filteredProveedores: ProveedorData[] = [];
  selectedProveedores: ProveedorData[] = [];

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Estados
  loading = false;
  dialogVisible = false;
  deleteDialogVisible = false;
  searchTerm = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Form
  proveedorForm: FormGroup;
  submitted = false;
  isEditMode = false;
  proveedorToDelete: ProveedorData | null = null;

  // Opciones de items por página
  itemsPerPageOptions = [10, 20, 50];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.proveedorForm = this.fb.group({
      id: [null],
      nombreEmpresa: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      contacto: ['', [Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
    });
  }

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores(): void {
    this.loading = true;
    this.apiService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data.filter(proveedor => proveedor != null);
        this.applyFiltersAndPagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando proveedores:', error);
        this.loading = false;
        this.toastr.error('Error al cargar proveedores', 'Error');
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
    let filtered = [...this.proveedores];

    if (this.searchTerm) {
      filtered = filtered.filter(
        (proveedor) =>
          (proveedor.nombreEmpresa?.toLowerCase().includes(this.searchTerm) ?? false) ||
          (proveedor.contacto?.toLowerCase().includes(this.searchTerm) ?? false) ||
          (proveedor.telefono?.toLowerCase().includes(this.searchTerm) ?? false) ||
          (proveedor.email?.toLowerCase().includes(this.searchTerm) ?? false)
      );
    }

    // Ordenamiento
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue = a[this.sortField as keyof ProveedorData];
        let bValue = b[this.sortField as keyof ProveedorData];

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

    this.filteredProveedores = filtered.slice(startIndex, endIndex);
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
    return `Mostrando ${start} a ${end} de ${this.totalItems} proveedores`;
  }

  // Selección múltiple
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedProveedores = [];
    } else {
      this.selectedProveedores = [...this.filteredProveedores];
    }
  }

  toggleSelect(proveedor: ProveedorData): void {
    const index = this.selectedProveedores.findIndex((p) => p.id === proveedor.id);
    if (index > -1) {
      this.selectedProveedores.splice(index, 1);
    } else {
      this.selectedProveedores.push(proveedor);
    }
  }

  isSelected(proveedor: ProveedorData): boolean {
    return this.selectedProveedores.some((p) => p.id === proveedor.id);
  }

  isAllSelected(): boolean {
    return (
      this.filteredProveedores.length > 0 &&
      this.filteredProveedores.every((p) => this.isSelected(p))
    );
  }

  // CRUD
  openNew(): void {
    this.isEditMode = false;
    this.proveedorForm.reset();
    this.submitted = false;
    this.dialogVisible = true;
  }

  editProveedor(proveedor: ProveedorData): void {
    this.isEditMode = true;
    this.proveedorForm.patchValue(proveedor);
    this.dialogVisible = true;
  }

  deleteProveedor(proveedor: ProveedorData): void {
    this.proveedorToDelete = proveedor;
    this.deleteDialogVisible = true;
  }

  confirmDelete(): void {
    if (this.proveedorToDelete) {
      this.apiService.deleteProveedor(this.proveedorToDelete.id!).subscribe({
        next: () => {
          this.proveedores = this.proveedores.filter(
            (val) => val.id !== this.proveedorToDelete!.id
          );
          this.applyFiltersAndPagination();
          this.deleteDialogVisible = false;
          this.proveedorToDelete = null;
          this.toastr.success('Proveedor eliminado correctamente');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error eliminando proveedor:', error);
          this.toastr.error('Error al eliminar proveedor');
        },
      });
    }
  }

  deleteSelectedProveedores(): void {
    if (this.selectedProveedores.length === 0) return;

    const deletePromises = this.selectedProveedores.map((proveedor) =>
      this.apiService.deleteProveedor(proveedor.id!).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        this.proveedores = this.proveedores.filter(
          (val) => !this.selectedProveedores.includes(val)
        );
        this.selectedProveedores = [];
        this.applyFiltersAndPagination();
        this.toastr.success('Proveedores eliminados correctamente');
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Error eliminando proveedores:', error);
        this.toastr.error('Error al eliminar proveedores');
      });
  }

  saveProveedor(): void {
    this.submitted = true;

    if (this.proveedorForm.valid) {
      const formData = { ...this.proveedorForm.value };

      if (formData.id) {
        this.apiService.updateProveedor(formData.id, formData).subscribe({
          next: (updatedProveedor) => {
            const index = this.proveedores.findIndex((p) => p.id === formData.id);
            if (index !== -1) {
              this.proveedores[index] = updatedProveedor || formData;
            }
            this.applyFiltersAndPagination();
            this.toastr.success('Proveedor actualizado correctamente');
            this.hideDialog();
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error actualizando proveedor:', error);
            this.toastr.error('Error al actualizar proveedor');
          },
        });
      } else {
        this.apiService.createProveedor(formData).subscribe({
          next: (newProveedor) => {
            this.proveedores.push(newProveedor);
            this.applyFiltersAndPagination();
            this.toastr.success('Proveedor creado correctamente');
            this.hideDialog();
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error creando proveedor:', error);
            this.toastr.error('Error al crear proveedor');
          },
        });
      }
    }
  }

  hideDialog(): void {
    this.dialogVisible = false;
    this.submitted = false;
    this.proveedorForm.reset({
      id: null,
      nombreEmpresa: '',
      contacto: '',
      telefono: '',
      email: ''
    });
  }

  // Getters para controles del formulario
  get nombreEmpresaControl(): AbstractControl | null {
    return this.proveedorForm.get('nombreEmpresa');
  }
  get contactoControl(): AbstractControl | null {
    return this.proveedorForm.get('contacto');
  }
  get telefonoControl(): AbstractControl | null {
    return this.proveedorForm.get('telefono');
  }
  get emailControl(): AbstractControl | null {
    return this.proveedorForm.get('email');
  }
}