import { Component, OnInit, HostListener } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as AOS from 'aos';
import Swal from 'sweetalert2';
import { CotizacionService } from '../../core/services/cotizacion';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { ApiService } from '../../core/services/api';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { RatingModule } from 'primeng/rating';

@Component({
  selector: 'app-home',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    CarouselModule,
    RouterModule,
    RatingModule,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit {
  openFaq: number | null = null;
  isScrolled = false;
  navbarOpen = false;
  showScrollTop = false;
  cotizacionForm: FormGroup;
  submitting = false;
  cotizacionEstimada = 0;

  responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 3,
      numScroll: 3,
    },
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 3,
    },
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 2,
    },
    {
      breakpoint: '576px',
      numVisible: 1,
      numScroll: 1,
    },
  ];

  // Propiedades para testimonios
  comentarios: any[] = [];
  testimonials: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private apiService: ApiService
  ) {
    this.cotizacionForm = this.fb.group({
      nombreCliente: ['', [Validators.required, Validators.minLength(3)]],
      emailCliente: ['', [Validators.required, Validators.email]],
      telefono: [
        '',
        [Validators.required, Validators.pattern(/^[\d\s\+\-\(\)]+$/)],
      ],
      empresa: [''],
      cantidadDispositivos: [1, [Validators.required, Validators.min(1)]],
      cantidadAnimales: [1, [Validators.required, Validators.min(1)]],
      tipoGanado: ['', Validators.required],
      hectareas: [1, [Validators.required, Validators.min(1)]],
      funcionalidadesRequeridas: [[]],
      comentarios: [''],
    });

    // Calcular estimación en tiempo real
    this.cotizacionForm.valueChanges.subscribe((values) => {
      this.calcularEstimacion(values);
    });
  }

  ngOnInit(): void {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });

    this.cargarTestimonios();
    this.startCounters();
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  // Método para cargar testimonios usando solo datos del API
  cargarTestimonios(): void {
    this.loading = true;
    console.log('Cargando testimonios desde API...');

    this.apiService.getComentarios().subscribe({
      next: (response) => {
        console.log('Respuesta del API:', response);

        if (response && Array.isArray(response)) {
          this.comentarios = response;

          // Filtrar comentarios con calificación >= 4 y que tengan descripción
          const comentariosFiltrados = this.comentarios.filter(
            (comentario) =>
              comentario.calificacion >= 4 &&
              comentario.descripcion &&
              comentario.descripcion.trim().length > 0 &&
              comentario.nombreCliente // Asegurar que tenga nombre de cliente
          );

          console.log(
            `Comentarios filtrados: ${comentariosFiltrados.length} de ${this.comentarios.length}`
          );

          // Procesar testimonios usando solo datos reales
          this.testimonials = comentariosFiltrados.map(
            this.procesarTestimonialReal
          );

          console.log('Testimonials procesados:', this.testimonials);
        } else {
          console.warn('La respuesta no es un array válido:', response);
          this.testimonials = [];
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando comentarios:', error);
        this.testimonials = [];
        this.loading = false;
      },
    });
  }

  // Método para procesar testimonial usando solo datos reales del API
  private procesarTestimonialReal = (comentario: any) => {
    return {
      // Datos originales del API
      id: comentario.id,
      ventaId: comentario.ventaId,
      productoId: comentario.productoId,
      calificacion: comentario.calificacion,
      descripcion: comentario.descripcion,
      fecha: comentario.fecha,
      nombreCliente: comentario.nombreCliente,
      nombreProducto: comentario.nombreProducto,

      // Procesamiento de datos para la UI
      nombre: comentario.nombreCliente,
      producto: comentario.nombreProducto,
      role: `Cliente verificado`, // Rol genérico para todos
      avatar: this.generarAvatar(comentario.nombreCliente),
      fechaFormateada: this.formatearFechaRelativa(comentario.fecha),
      descripcionLimpia: this.limpiarDescripcion(comentario.descripcion),
      estrellasArray: Array(
        Math.min(Math.max(comentario.calificacion || 5, 1), 5)
      ).fill(1),

      // Datos calculados
      iniciales: this.obtenerIniciales(comentario.nombreCliente),
      fechaOriginal: comentario.fecha,
    };
  };

  // Método para generar avatar basado en el nombre real
  private generarAvatar(nombreCliente: string): string {
    if (!nombreCliente)
      return 'https://ui-avatars.com/api/?name=Cliente&size=80&background=2E7D32&color=fff&rounded=true';

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      nombreCliente
    )}&size=80&background=2E7D32&color=fff&rounded=true`;
  }

  // Método para obtener iniciales del nombre real
  private obtenerIniciales(nombreCliente: string): string {
    if (!nombreCliente) return 'C';

    return nombreCliente
      .split(' ')
      .map((palabra) => palabra.charAt(0).toUpperCase())
      .slice(0, 2) // Máximo 2 iniciales
      .join('');
  }

  // Método para limpiar y mejorar la descripción
  private limpiarDescripcion(descripcion: string): string {
    if (!descripcion) return '';

    // Limpiar la descripción
    let descripcionLimpia = descripcion.trim();

    // Limitar longitud si es muy larga
    if (descripcionLimpia.length > 200) {
      descripcionLimpia = descripcionLimpia.substring(0, 197) + '...';
    }

    // Asegurar que termina con punto si no tiene puntuación
    if (!descripcionLimpia.match(/[.!?]$/)) {
      descripcionLimpia += '.';
    }

    return descripcionLimpia;
  }

  // Método para formatear fecha relativa usando la fecha real del API
  private formatearFechaRelativa(fechaISO: string): string {
    if (!fechaISO) return 'Recientemente';

    try {
      const fecha = new Date(fechaISO);
      const ahora = new Date();
      const diffTime = Math.abs(ahora.getTime() - fecha.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

      if (diffHours < 1) return 'Hace unos minutos';
      if (diffHours < 24) return `Hace ${diffHours} horas`;
      if (diffDays === 1) return 'Hace 1 día';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
      if (diffDays < 365) return `Hace ${Math.ceil(diffDays / 30)} meses`;
      return `Hace ${Math.ceil(diffDays / 365)} años`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Recientemente';
    }
  }

  // Método para obtener estrellas vacías
  getEmptyStarsArray(calificacion: number): number[] {
    const estrellasVacias = Math.max(5 - (calificacion || 0), 0);
    return Array(estrellasVacias).fill(1);
  }

  // Método para calcular promedio de calificaciones reales
  getPromedioCalificaciones(): number {
    if (!this.testimonials || this.testimonials.length === 0) return 0;

    const suma = this.testimonials.reduce(
      (acc, testimonial) => acc + (testimonial.calificacion || 0),
      0
    );
    return Math.round((suma / this.testimonials.length) * 10) / 10; // Redondear a 1 decimal
  }

  // Método para obtener total de testimonios reales
  getTotalTestimonios(): number {
    return this.testimonials ? this.testimonials.length : 0;
  }

  // Método para forzar recarga de testimonios
  recargarTestimonios(): void {
    this.testimonials = [];
    this.loading = true;
    setTimeout(() => {
      this.cargarTestimonios();
    }, 500);
  }

  // Resto de métodos existentes sin cambios...
  calcularEstimacion(values: any): void {
    if (values.cantidadDispositivos > 0) {
      let precioBase = 2500;
      let total = precioBase * values.cantidadDispositivos;

      // Descuentos por volumen
      if (values.cantidadDispositivos > 50) {
        total *= 0.8;
      } else if (values.cantidadDispositivos > 20) {
        total *= 0.85;
      } else if (values.cantidadDispositivos > 10) {
        total *= 0.9;
      }

      // Costos adicionales
      const funcionalidades = values.funcionalidadesRequeridas || [];
      if (funcionalidades.includes('alertas-avanzadas')) {
        total += 500 * values.cantidadDispositivos;
      }
      if (funcionalidades.includes('analytics')) {
        total += 800 * values.cantidadDispositivos;
      }
      if (funcionalidades.includes('integracion-erp')) {
        total += 1500;
      }
      if (funcionalidades.includes('multi-usuario')) {
        total += 1000;
      }

      this.cotizacionEstimada = Math.round(total * 100) / 100;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isScrolled = scrollTop > 50;
    this.showScrollTop = scrollTop > 300;
  }

  toggleNavbar(): void {
    this.navbarOpen = !this.navbarOpen;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFuncionalidadChange(event: any): void {
    const funcionalidades =
      this.cotizacionForm.get('funcionalidadesRequeridas')?.value || [];

    if (event.target.checked) {
      funcionalidades.push(event.target.value);
    } else {
      const index = funcionalidades.indexOf(event.target.value);
      if (index > -1) {
        funcionalidades.splice(index, 1);
      }
    }

    this.cotizacionForm.patchValue({
      funcionalidadesRequeridas: funcionalidades,
    });
  }

  submitCotizacion(): void {
    if (this.cotizacionForm.invalid) {
      Object.keys(this.cotizacionForm.controls).forEach((key) => {
        const control = this.cotizacionForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      this.toastr.error(
        'Por favor complete todos los campos requeridos',
        'Formulario Incompleto'
      );
      return;
    }

    this.submitting = true;

    this.apiService.solicitarCotizacion(this.cotizacionForm.value).subscribe({
      next: (response: any) => {
        this.submitting = false;

        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Cotización Enviada!',
            html: `
              <p>Hemos recibido tu solicitud exitosamente.</p>
              <p><strong>ID de Cotización:</strong> #${
                response.cotizacionId
              }</p>
              <p><strong>Estimación preliminar:</strong> $${response.precioEstimado.toFixed(
                2
              )} MXN</p>
              <hr>
              <p class="small">Un ejecutivo de ventas te contactará en las próximas 24 horas con una propuesta detallada.</p>
            `,
            confirmButtonText: 'Excelente',
            confirmButtonColor: '#2E7D32',
          });

          this.cotizacionForm.reset({
            cantidadDispositivos: 1,
            cantidadAnimales: 1,
            hectareas: 1,
            funcionalidadesRequeridas: [],
          });
          this.cotizacionEstimada = 0;
        } else {
          this.toastr.error(
            response.message || 'Error al enviar la cotización',
            'Error'
          );
        }
      },
      error: (error: any) => {
        this.submitting = false;
        console.error('Error:', error);
        this.toastr.error(
          'Error al conectar con el servidor. Por favor intente nuevamente.',
          'Error de Conexión'
        );
      },
    });
  }

  downloadDatasheet(): void {
    this.toastr.info('Descargando ficha técnica...', 'Descarga');
    const link = document.createElement('a');
    link.href = '/assets/documents/pecuadex-gps-datasheet.pdf';
    link.download = 'Pecuadex-GPS-Ficha-Tecnica.pdf';
    link.click();
  }

  contactSales(): void {
    this.scrollToSection('cotizacion');
  }

  getSectionTitle(): string {
    return 'Inicio';
  }

  startCounters(): void {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200;

    counters.forEach((counter) => {
      const target = +(counter.getAttribute('data-count') || 0);
      let count = 0;
      const increment = target / speed;

      const updateCount = () => {
        if (count < target) {
          count += increment;
          (counter as HTMLElement).innerText = Math.ceil(count).toString();
          setTimeout(updateCount, 10);
        } else {
          (counter as HTMLElement).innerText = target.toString();
        }
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            updateCount();
            observer.unobserve(entry.target);
          }
        });
      });

      observer.observe(counter);
    });
  }
}
