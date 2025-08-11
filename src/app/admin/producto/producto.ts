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

export interface ProductoData {
  id?: number;
  nombre: string;
  descripcion: string;
  precioSugerido: number;
  imagen: string;
  fechaRegistro?: Date;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './producto.html',
  styleUrls: ['./producto.scss'],
})
export class Producto implements OnInit {
  productos: ProductoData[] = [];
  filteredProductos: ProductoData[] = [];
  selectedProductos: ProductoData[] = [];

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
  productoForm: FormGroup;
  submitted = false;
  isEditMode = false;
  productToDelete: ProductoData | null = null;

  // Opciones de items por página
  itemsPerPageOptions = [10, 20, 50];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.productoForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precioSugerido: [0.0, [Validators.required, Validators.min(0.01)]],
      imagen: ['', Validators.required],
      tituloManual: [''], // Agrega este campo
    });
  }

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos(): void {
    this.loading = true;
    this.apiService.getProductos().subscribe({
      next: (data) => {
        this.productos = data.map((producto) => ({
          ...producto,
          fechaRegistro: producto.fechaRegistro
            ? new Date(producto.fechaRegistro)
            : new Date(),
        }));
        this.applyFiltersAndPagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.loading = false;
        this.toastr.error('Error al cargar productos', 'Error');
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
        let aValue = a[this.sortField as keyof ProductoData];
        let bValue = b[this.sortField as keyof ProductoData];

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

    this.filteredProductos = filtered.slice(startIndex, endIndex);
  }

  // Ordenamiento
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
    return `Mostrando ${start} a ${end} de ${this.totalItems} productos`;
  }

  // Selección
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedProductos = [];
    } else {
      this.selectedProductos = [...this.filteredProductos];
    }
  }

  toggleSelect(producto: ProductoData): void {
    const index = this.selectedProductos.findIndex((p) => p.id === producto.id);
    if (index > -1) {
      this.selectedProductos.splice(index, 1);
    } else {
      this.selectedProductos.push(producto);
    }
  }

  isSelected(producto: ProductoData): boolean {
    return this.selectedProductos.some((p) => p.id === producto.id);
  }

  isAllSelected(): boolean {
    return (
      this.filteredProductos.length > 0 &&
      this.filteredProductos.every((p) => this.isSelected(p))
    );
  }

  // CRUD Operations
  openNew(): void {
    this.isEditMode = false;
    this.productoForm.reset();
    this.submitted = false;
    this.dialogVisible = true;
  }

  editProduct(producto: ProductoData): void {
    this.isEditMode = true;
    this.productoForm.patchValue(producto);
    this.dialogVisible = true;
  }

  deleteProduct(producto: ProductoData): void {
    this.productToDelete = producto;
    this.deleteDialogVisible = true;
  }

confirmDelete(): void {
  if (this.productToDelete) {
    this.apiService.deleteProductoConManual(this.productToDelete.id!).subscribe({
      next: () => {
        this.productos = this.productos.filter(
          (val) => val.id !== this.productToDelete!.id
        );
        this.applyFiltersAndPagination();
        this.deleteDialogVisible = false;
        this.productToDelete = null;
        this.toastr.success('Producto y manual asociado eliminados correctamente');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error eliminando producto:', error);
        this.toastr.error('Error al eliminar producto');
      },
    });
  }
}

deleteSelectedProducts(): void {
  if (this.selectedProductos.length === 0) return;

  const deletePromises = this.selectedProductos.map((producto) =>
    this.apiService.deleteProductoConManual(producto.id!).toPromise()
  );

  Promise.all(deletePromises)
    .then(() => {
      this.productos = this.productos.filter(
        (val) => !this.selectedProductos.some(p => p.id === val.id)
      );
      this.selectedProductos = [];
      this.applyFiltersAndPagination();
      this.toastr.success('Productos y manuales asociados eliminados correctamente');
      this.cdr.detectChanges();
    })
    .catch((error) => {
      console.error('Error eliminando productos:', error);
      this.toastr.error('Error al eliminar productos');
    });
}

  manualFile: File | null = null;

onManualUpload(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.manualFile = file;
    this.toastr.info(`Manual seleccionado: ${file.name}`, 'Información');
  }
}


  saveProduct(): void {
  this.submitted = true;

  if (this.productoForm.valid) {
    const formData = new FormData();
    formData.append('nombre', this.productoForm.value.nombre);
    formData.append('descripcion', this.productoForm.value.descripcion);
    formData.append('precioSugerido', this.productoForm.value.precioSugerido);
    formData.append('imagen', this.productoForm.value.imagen);

    if (this.productoForm.value.tituloManual && this.manualFile) {
      formData.append('tituloManual', this.productoForm.value.tituloManual);
      formData.append('archivoManual', this.manualFile);
    }

    if (this.isEditMode && this.productoForm.value.id) {
      this.apiService.updateProductoConManual(this.productoForm.value.id, formData).subscribe({
        next: (updatedProduct) => {
          const index = this.productos.findIndex((p) => p.id === updatedProduct.id);
          if (index !== -1) {
            this.productos[index] = {
              ...updatedProduct,
              fechaRegistro: updatedProduct.fechaRegistro
                ? new Date(updatedProduct.fechaRegistro)
                : new Date(),
            };
          }
          this.applyFiltersAndPagination();
          this.toastr.success('Producto actualizado correctamente');
          this.hideDialog();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error actualizando producto:', error);
          this.toastr.error('Error al actualizar producto');
        },
      });
    } else {
      this.apiService.createProductoConManual(formData).subscribe({
        next: (newProduct) => {
          this.productos.push({
            ...newProduct,
            fechaRegistro: newProduct.fechaRegistro
              ? new Date(newProduct.fechaRegistro)
              : new Date(),
          });
          this.applyFiltersAndPagination();
          this.toastr.success('Producto creado correctamente');
          this.hideDialog();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creando producto:', error);
          this.toastr.error('Error al crear producto');
        },
      });
    }
  }
}


  hideDialog(): void {
    this.dialogVisible = false;
    this.submitted = false;
  }

  // Utilidades
  formatCurrency(value: number): string {
    if (!value && value !== 0) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  }

  truncateText(text: string, length: number = 60): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://via.placeholder.com/100x80?text=Sin+Imagen';
  }

  onImageUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Para assets, simplemente usamos el nombre del archivo
      // Asumiendo que las imágenes se guardan en assets/images/
      const fileName = file.name;
      const imageUrl = `assets/${fileName}`;

      this.productoForm.patchValue({ imagen: imageUrl });
      this.toastr.info(`Imagen seleccionada: ${fileName}`, 'Información');
      this.toastr.warning(
        'Recuerda copiar el archivo a assets/images/',
        'Nota'
      );
    }
  }

  // Método helper para validar si la URL es de assets
  isAssetsImage(url: string): boolean {
    return (
      url.startsWith('assets/') ||
      url.startsWith('./assets/') ||
      url.startsWith('/assets/')
    );
  }

  // Método para generar rutas de assets comunes
  getAssetImagePath(fileName: string): string {
    return `assets/images/${fileName}`;
  }

  // Lista de imágenes predeterminadas (puedes expandir esta lista)
  getDefaultImages(): string[] {
    return [
      'assets/images/producto-default.jpg',
      'assets/images/no-image.png',
      'assets/images/placeholder.jpg',
    ];
  }

  exportExcel(): void {
    const csvContent = this.convertToCSV(this.productos);
    this.downloadCSV(csvContent, 'productos');
  }

  private convertToCSV(data: ProductoData[]): string {
    if (!data || data.length === 0) return '';

    const headers = [
      'ID',
      'Nombre',
      'Descripción',
      'Precio Sugerido',
      'Fecha Registro',
    ];
    const csvData = data.map((producto) => [
      producto.id || '',
      `"${producto.nombre || ''}"`,
      `"${producto.descripcion || ''}"`,
      producto.precioSugerido || 0,
      producto.fechaRegistro ? this.formatDate(producto.fechaRegistro) : '',
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

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES').format(new Date(date));
  }

  // Form getters
  get nombreControl(): AbstractControl | null {
    return this.productoForm.get('nombre');
  }

  get descripcionControl(): AbstractControl | null {
    return this.productoForm.get('descripcion');
  }

  get precioSugeridoControl(): AbstractControl | null {
    return this.productoForm.get('precioSugerido');
  }

  get imagenControl(): AbstractControl | null {
    return this.productoForm.get('imagen');
  }

  get showImagePreview(): boolean {
    const control = this.imagenControl;
    return !!(control && control.value && control.value.trim());
  }
}
