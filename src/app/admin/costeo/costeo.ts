import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-costeo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,DatePipe],
  templateUrl: './costeo.html',
  styleUrls: ['./costeo.scss']
})
export class Costeo implements OnInit {
  movimientos: any[] = [];
  filteredMovimientos: any[] = [];
  loading = false;

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  itemsPerPageOptions = [10, 20, 50];

  // Búsqueda y ordenamiento
  searchTerm = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMovimientos();
  }

 loadMovimientos(): void {
  this.loading = true;
  console.log('Cargando movimientos...');

  this.apiService.getMovimientos().subscribe({
    next: (data) => {
      console.log('Datos recibidos:', data);
      this.movimientos = data || [];
      this.applyFiltersAndPagination();
      this.loading = false;
    },
    error: (err) => {
      console.error('Error cargando movimientos:', err);
      this.loading = false; 
    },
    complete: () => {
      console.log('Carga completada');
    }
  });
}


  onSearch(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }
  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'sort';
    return this.sortDirection === 'asc' ? 'sort-up' : 'sort-down';
  }

  applyFiltersAndPagination(): void {
    let filtered = [...this.movimientos];

    if (this.searchTerm) {
      filtered = filtered.filter(mov =>
        mov.pieza?.nombre?.toLowerCase().includes(this.searchTerm) ||
        mov.tipoMovimiento?.toLowerCase().includes(this.searchTerm)
      );
    }

    // Ordenamiento
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue = a[this.sortField];
        let bValue = b[this.sortField];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.filteredMovimientos = filtered.slice(start, end);
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
    return `Mostrando ${start} a ${end} de ${this.totalItems} movimientos`;
  }
}
