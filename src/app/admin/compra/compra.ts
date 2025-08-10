import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { ApiService } from '../../core/services/api';
import { ToastrService } from 'ngx-toastr';

interface Proveedor {
  id: number;
  nombreEmpresa: string;
}

interface Pieza {
  id: number;
  nombre: string;
  unidadMedida: string;
}

interface DetalleCompraForm {
  piezaId: number;
  presentacion: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

interface Compra {
  id?: number;
  fecha: Date;
  proveedorId: number;
  proveedor?: Proveedor;
  detalles: DetalleCompra[];
}

interface DetalleCompra {
  id?: number;
  compraId?: number;
  movimientosPiezaId?: number;
  movimientosPieza?: {
    pieza?: Pieza;
    costoUnitario?: number;
  };
  presentacion: string;
  cantidad: number;
  precioTotal: number;
  piezaId?: number;
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './compra.html',
  styleUrls: ['./compra.scss'],
})
export class ComprasComponent implements OnInit {
  compras: Compra[] = [];
  filteredCompras: Compra[] = [];
  proveedores: Proveedor[] = [];
  piezas: Pieza[] = [];
  selectedCompra: Compra | null = null;

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
  deleteDialogVisible = false;
  viewDialogVisible = false;
  submitted = false;
  isEditMode = false;
  compraToDelete: Compra | null = null;

  // Form
  compraForm: FormGroup;
  itemsPerPageOptions = [10, 20, 50];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.compraForm = this.fb.group({
      id: [null],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      proveedorId: [null, Validators.required],
      detalles: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadCompras();
    this.loadProveedores();
    this.loadPiezas();
  }

  get detalles(): FormArray {
    return this.compraForm.get('detalles') as FormArray;
  }

  loadCompras(): void {
     this.loading = true;
     this.apiService.getCompras().subscribe({
       next: (data) => {
         this.compras = data.map(compra => {
           const proveedor = this.proveedores.find(p => p.id === compra.proveedorId);
           return {
             ...compra,
             proveedor: proveedor || null // Asocia el proveedor a la compra
           };
         });
         this.applyFiltersAndPagination();
         this.loading = false;
         this.cdr.detectChanges();
       },
       error: (error) => {
         console.error('Error cargando compras:', error);
         this.loading = false;
         this.toastr.error('Error al cargar compras', 'Error');
       },
     });
   }

  loadProveedores(): void {
    this.apiService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: (error) => {
        console.error('Error cargando proveedores:', error);
        this.toastr.error('Error al cargar proveedores', 'Error');
      },
    });
  }

  loadPiezas(): void {
    this.apiService.getPiezas().subscribe({
      next: (data) => {
        this.piezas = data;
      },
      error: (error) => {
        console.error('Error cargando piezas:', error);
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
    let filtered = [...this.compras];

    // Filtrar por fechas
    if (this.fechaDesde) {
      const desde = new Date(this.fechaDesde);
      filtered = filtered.filter(c => new Date(c.fecha) >= desde);
    }
    if (this.fechaHasta) {
      const hasta = new Date(this.fechaHasta);
      filtered = filtered.filter(c => new Date(c.fecha) <= hasta);
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(
        (compra) =>
          compra.proveedor?.nombreEmpresa.toLowerCase().includes(this.searchTerm) ||
          compra.detalles.some(d => 
            d.movimientosPieza?.pieza?.nombre.toLowerCase().includes(this.searchTerm) ||
            d.presentacion.toLowerCase().includes(this.searchTerm)
          )
      );
    }

    // Ordenamiento
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (this.sortField === 'total') {
          aValue = this.getTotalCompra(a);
          bValue = this.getTotalCompra(b);
        } else {
          aValue = a[this.sortField as keyof Compra];
          bValue = b[this.sortField as keyof Compra];
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

    this.filteredCompras = filtered.slice(startIndex, endIndex);
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
    return `Mostrando ${start} a ${end} de ${this.totalItems} compras`;
  }

  // Métodos para el formulario de detalles
  createDetalle(detalle?: DetalleCompraForm): FormGroup {
    return this.fb.group({
      piezaId: [detalle?.piezaId || null, Validators.required],
      presentacion: [detalle?.presentacion || '', Validators.required],
      cantidad: [detalle?.cantidad || 1, [Validators.required, Validators.min(1)]],
      precioUnitario: [detalle?.precioUnitario || 0, [Validators.required, Validators.min(0.01)]],
      precioTotal: [detalle?.precioTotal || 0],
    });
  }

  addDetalle(): void {
    this.detalles.push(this.createDetalle());
  }

  removeDetalle(index: number): void {
    this.detalles.removeAt(index);
    this.calcularTotalCompra();
  }

  calcularTotalDetalle(index: number): void {
    const detalle = this.detalles.at(index);
    const cantidad = detalle.get('cantidad')?.value || 0;
    const precioUnitario = detalle.get('precioUnitario')?.value || 0;
    const total = cantidad * precioUnitario;
    detalle.get('precioTotal')?.setValue(total);
    this.calcularTotalCompra();
  }

  calcularTotalCompra(): number {
    return this.detalles.controls.reduce((sum, detalle) => {
      return sum + (detalle.get('precioTotal')?.value || 0);
    }, 0);
  }

  getTotalCompra(compra: Compra): number {
    return compra.detalles.reduce((sum, detalle) => sum + detalle.precioTotal, 0);
  }

  // CRUD Operations
  openNew(): void {
    this.isEditMode = false;
    this.compraForm.reset({
      fecha: new Date().toISOString().substring(0, 10),
      proveedorId: null,
      detalles: []
    });
    this.detalles.clear();
    this.addDetalle(); // Agregar un detalle por defecto
    this.submitted = false;
    this.dialogVisible = true;
  }


  viewCompra(compra: Compra): void {
    this.selectedCompra = compra;
    this.viewDialogVisible = true;
  }


  saveCompra(): void {
    this.submitted = true;

    if (this.compraForm.valid && this.detalles.length > 0) {
      const formData = this.compraForm.value;
      const compraData = {
        id: formData.id,
        fecha: formData.fecha,
        proveedorId: formData.proveedorId,
        detalles: formData.detalles.map((d: any) => ({
          id: d.id,
          presentacion: d.presentacion,
          cantidad: d.cantidad,
          precioTotal: d.precioTotal,
          piezaId: d.piezaId
        }))
      };
        this.apiService.createCompra(compraData).subscribe({
          next: (newCompra) => {
            this.compras.unshift(newCompra);
            this.applyFiltersAndPagination();
            this.toastr.success('Compra creada correctamente');
            this.hideDialog();
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error creando compra:', error);
            this.toastr.error('Error al crear compra');
          },
        });
    }
  }

  hideDialog(): void {
    this.dialogVisible = false;
    this.submitted = false;
  }

  // Getters para controles del formulario
  get fechaControl(): AbstractControl | null {
    return this.compraForm.get('fecha');
  }

  get proveedorControl(): AbstractControl | null {
    return this.compraForm.get('proveedorId');
  }

  getPiezaControl(index: number): AbstractControl | null {
    return this.detalles.at(index).get('piezaId');
  }

  getPresentacionControl(index: number): AbstractControl | null {
    return this.detalles.at(index).get('presentacion');
  }

  getCantidadControl(index: number): AbstractControl | null {
    return this.detalles.at(index).get('cantidad');
  }

  getPrecioUnitarioControl(index: number): AbstractControl | null {
    return this.detalles.at(index).get('precioUnitario');
  }
}