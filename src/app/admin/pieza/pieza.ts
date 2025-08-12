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

export interface PiezaData {
  id?: number;
  nombre: string;
  unidadMedida: string;
  descripcion: string;
  fechaRegistro?: Date;
}

@Component({
  selector: 'app-piezas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pieza.html',
  styleUrls: ['./pieza.scss'],
})
export class Pieza implements OnInit {
  piezas: PiezaData[] = [];
  filteredPiezas: PiezaData[] = [];
  selectedPiezas: PiezaData[] = [];

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
  piezaForm: FormGroup;
  submitted = false;
  isEditMode = false;
  piezaToDelete: PiezaData | null = null;

  // Opciones de items por página
  itemsPerPageOptions = [10, 20, 50];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.piezaForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      unidadMedida: ['Unidades'],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit(): void {
    this.loadPiezas();
  }

  loadPiezas(): void {
  this.loading = true;
  this.apiService.getPiezas().subscribe({
    next: (data) => {
      this.piezas = data
        .filter(pieza => pieza != null)  // Evita null o undefined
        .map((pieza) => ({
          ...pieza,
          fechaRegistro: pieza.fechaRegistro ? new Date(pieza.fechaRegistro) : null,
        }));
      this.applyFiltersAndPagination();
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error cargando piezas:', error);
      this.loading = false;
      this.toastr.error('Error al cargar piezas', 'Error');
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
    let filtered = [...this.piezas];

    if (this.searchTerm) {
      filtered = filtered.filter(
        (pieza) =>
          pieza.nombre.toLowerCase().includes(this.searchTerm) ||
          pieza.descripcion.toLowerCase().includes(this.searchTerm) ||
          pieza.unidadMedida.toLowerCase().includes(this.searchTerm)
      );
    }

    // Ordenamiento
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue = a[this.sortField as keyof PiezaData];
        let bValue = b[this.sortField as keyof PiezaData];

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

    this.filteredPiezas = filtered.slice(startIndex, endIndex);
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
      this.selectedPiezas = [];
    } else {
      this.selectedPiezas = [...this.filteredPiezas];
    }
  }

  toggleSelect(pieza: PiezaData): void {
    const index = this.selectedPiezas.findIndex((p) => p.id === pieza.id);
    if (index > -1) {
      this.selectedPiezas.splice(index, 1);
    } else {
      this.selectedPiezas.push(pieza);
    }
  }

  isSelected(pieza: PiezaData): boolean {
    return this.selectedPiezas.some((p) => p.id === pieza.id);
  }

  isAllSelected(): boolean {
    return (
      this.filteredPiezas.length > 0 &&
      this.filteredPiezas.every((p) => this.isSelected(p))
    );
  }

  // CRUD
  openNew(): void {
    this.isEditMode = false;
    this.piezaForm.reset();
    this.submitted = false;
    this.dialogVisible = true;
  }

  editPieza(pieza: PiezaData): void {
    this.isEditMode = true;
    this.piezaForm.patchValue(pieza);
    this.dialogVisible = true;
  }

  deletePieza(pieza: PiezaData): void {
    this.piezaToDelete = pieza;
    this.deleteDialogVisible = true;
  }

  confirmDelete(): void {
    if (this.piezaToDelete) {
      this.apiService.deletePieza(this.piezaToDelete.id!).subscribe({
        next: () => {
          this.piezas = this.piezas.filter(
            (val) => val.id !== this.piezaToDelete!.id
          );
          this.applyFiltersAndPagination();
          this.deleteDialogVisible = false;
          this.piezaToDelete = null;
          this.toastr.success('Pieza eliminada correctamente');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error eliminando pieza:', error);
          this.toastr.error('Error al eliminar pieza');
        },
      });
    }
  }

  deleteSelectedPiezas(): void {
    if (this.selectedPiezas.length === 0) return;

    const deletePromises = this.selectedPiezas.map((pieza) =>
      this.apiService.deletePieza(pieza.id!).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        this.piezas = this.piezas.filter(
          (val) => !this.selectedPiezas.includes(val)
        );
        this.selectedPiezas = [];
        this.applyFiltersAndPagination();
        this.toastr.success('Piezas eliminadas correctamente');
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Error eliminando piezas:', error);
        this.toastr.error('Error al eliminar piezas');
      });
  }

  savePieza(): void {
  this.submitted = true;

  if (this.piezaForm.valid) {
    const formData = { ...this.piezaForm.value,unidadMedida: 'Unidades' };

    if (formData.id) {
      const originalPieza = this.piezas.find(p => p.id === formData.id);
      if (originalPieza) {
        formData.fechaRegistro = originalPieza.fechaRegistro;
      }

      this.apiService.updatePieza(formData.id, formData).subscribe({
        next: (updatedPieza) => {
          const index = this.piezas.findIndex((p) => p.id === formData.id);
          if (index !== -1) {
            this.piezas[index] = {
              ...originalPieza,
              ...(updatedPieza || formData),
            };
          }
          this.applyFiltersAndPagination();
          this.toastr.success('Pieza actualizada correctamente');
          this.hideDialog();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error actualizando pieza:', error);
          this.toastr.error('Error al actualizar pieza');
        },
      });

    } else {
      this.apiService.createPieza(formData).subscribe({
        next: (newPieza) => {
          this.piezas.push({
            ...newPieza,
            fechaRegistro: newPieza.fechaRegistro
              ? new Date(newPieza.fechaRegistro)
              : new Date(),
          });
          this.applyFiltersAndPagination();
          this.toastr.success('Pieza creada correctamente');
          this.hideDialog();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creando pieza:', error);
          this.toastr.error('Error al crear pieza');
        },
      });
    }
  }
}


  hideDialog(): void {
  this.dialogVisible = false;
  this.submitted = false;
  this.piezaForm.reset({
    id: null,
    nombre: '',
    unidadMedida: '',
    descripcion: ''
  });
}

  truncateText(text: string, length: number = 60): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES').format(new Date(date));
  }

  // Getters
  get nombreControl(): AbstractControl | null {
    return this.piezaForm.get('nombre');
  }
  get unidadMedidaControl(): AbstractControl | null {
    return this.piezaForm.get('unidadMedida');
  }
  get descripcionControl(): AbstractControl | null {
    return this.piezaForm.get('descripcion');
  }
}
