import { Component, OnInit, HostListener } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { OwlOptions } from 'ngx-owl-carousel-o';
import * as AOS from 'aos';
import Swal from 'sweetalert2';
import { CotizacionService } from '../../core/services/cotizacion';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { ApiService } from '../../core/services/api';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    CarouselModule,
    RouterModule,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit {
  isScrolled = false;
  navbarOpen = false;
  showScrollTop = false;
  cotizacionForm: FormGroup;
  submitting = false;
  cotizacionEstimada = 0;

  // Productos reales de la API
  productos: any[] = [];
  comentarios: any[] = [];
  testimonials: any[] = [];
  loading = false;

  testimonialOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: true,
    navSpeed: 700,
    navText: [
      '<i class="fas fa-chevron-left"></i>',
      '<i class="fas fa-chevron-right"></i>',
    ],
    responsive: {
      0: { items: 1 },
      768: { items: 2 },
      1024: { items: 3 },
    },
    nav: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
  };

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

    this.cargarDatos();
    this.startCounters();
  }

  cargarDatos(): void {
    this.loading = true;

    this.apiService.getComentarios().subscribe({
      next: (comentarios) => {
        console.log('Datos recibidos del API:', comentarios);

        if (comentarios && Array.isArray(comentarios)) {
          this.comentarios = comentarios;
          // ✅ CORREGIDO: Filtrar y mapear datos DESPUÉS de recibirlos
          this.testimonials = comentarios
            .filter((c) => c.calificacion >= 4)
            .map(this.enhanceTestimonialData);

          console.log('Testimonials procesados:', this.testimonials.length);
        } else {
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

  private enhanceTestimonialData = (testimonial: any) => {
    return {
      ...testimonial,
      // Generar nombre basado en ID
      nombre: this.generateClientName(testimonial.id),
      // Generar empresa ficticia
      empresa: this.generateCompanyName(testimonial.productoId),
      // Generar ubicación
      ubicacion: this.generateLocation(),
      // Avatar generado automáticamente
      avatar: this.generateAvatar(testimonial.id),
      // Fecha formateada de manera legible
      fechaFormateada: this.formatRelativeDate(testimonial.fecha),
      // Array para estrellas llenas
      estrellas: Array(testimonial.calificacion).fill(0),
      // Array para estrellas vacías
      estrellasVacias: Array(5 - testimonial.calificacion).fill(0),
      // Descripción truncada si es muy larga
      descripcionTruncada: this.truncateText(testimonial.descripcion, 120),
    };
  };

  private generateClientName(id: number): string {
    const nombres = [
      'María González',
      'Juan Pérez',
      'Ana Rodríguez',
      'Carlos López',
      'Patricia Martínez',
      'Roberto Sánchez',
      'Laura Fernández',
      'Miguel Torres',
    ];
    return nombres[id % nombres.length] || `Cliente ${id}`;
  }

  private generateCompanyName(productoId: number): string {
    const empresas = [
      'Ganadería San José',
      'Rancho El Mirador',
      'Agropecuaria La Esperanza',
      'Estancia Los Álamos',
      'Hacienda Santa María',
      'Rancho Vista Hermosa',
    ];
    return empresas[productoId % empresas.length] || 'Empresa Ganadera';
  }

  private generateLocation(): string {
    const ubicaciones = [
      'Jalisco, México',
      'Sonora, México',
      'Chihuahua, México',
      'Veracruz, México',
      'Yucatán, México',
      'Nuevo León, México',
    ];
    return ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
  }

  private generateAvatar(id: number): string {
    const name = this.generateClientName(id);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&size=80&background=2E7D32&color=fff&rounded=true`;
  }

  private formatRelativeDate(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffTime = Math.abs(ahora.getTime() - fecha.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'hace 1 día';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.ceil(diffDays / 7)} semanas`;
    return `hace ${Math.ceil(diffDays / 30)} meses`;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  getStarsArray(calificacion: number): number[] {
    return Array(Math.min(Math.max(calificacion, 0), 5)).fill(1);
  }

  getEmptyStarsArray(calificacion: number): number[] {
    return Array(Math.max(5 - calificacion, 0)).fill(1);
  }

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

    // Llamar a la API real
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

          // Limpiar formulario
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

    // Simular descarga de PDF
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
