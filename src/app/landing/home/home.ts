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

@Component({
  selector: 'app-home',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, CarouselModule],
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
      0: {
        items: 1,
      },
      768: {
        items: 2,
      },
      1024: {
        items: 3,
      },
    },
    nav: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
  };

  testimonials = [
    {
      text: 'Pecuadex revolucionó completamente la forma en que manejo mi rancho. Ahora puedo monitorear mis 300 cabezas de ganado desde mi celular. ¡Increíble!',
      name: 'Juan Carlos Rodríguez',
      role: 'Ganadero',
      location: 'Jalisco',
      avatar: 'assets/testimonials/avatar1.webp',
    },
    {
      text: 'Redujimos las pérdidas por robo en un 100%. La inversión se pagó sola en los primeros 3 meses. El soporte técnico es excepcional.',
      name: 'María González',
      role: 'Propietaria',
      location: 'Chihuahua',
      avatar: 'assets/testimonials/avatar2.png',
    },
    {
      text: 'La tecnología es muy fácil de usar. Mis vaqueros aprendieron a usar la app en minutos. Ahorramos horas de trabajo diario.',
      name: 'Roberto Méndez',
      role: 'Administrador',
      location: 'Sonora',
      avatar: 'assets/testimonials/avatar3.jpg',
    },
    {
      text: 'El sistema de alertas me salvó cuando una tormenta dispersó el ganado. Pude localizar a todos los animales en menos de 2 horas.',
      name: 'Ana Martínez',
      role: 'Ganadera',
      location: 'Veracruz',
      avatar: 'assets/testimonials/avatar4.jpeg',
    },
    {
      text: 'Excelente relación calidad-precio. Las funcionalidades de analytics me ayudan a tomar mejores decisiones sobre rotación de pastizales.',
      name: 'Pedro Sánchez',
      role: 'Ingeniero Agrónomo',
      location: 'Guanajuato',
      avatar: 'assets/testimonials/avatar5.jpg',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private cotizacionService: CotizacionService
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

    // Calcular estimación cuando cambian los valores
    this.cotizacionForm.valueChanges.subscribe((values) => {
      if (values.cantidadDispositivos > 0) {
        this.cotizacionEstimada = this.cotizacionService.calcularPrecio({
          ...values,
          fecha: new Date(),
        });
      }
    });
  }

  ngOnInit(): void {
    // Inicializar AOS
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });

    // Iniciar contador de estadísticas
    this.startCounters();
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

  openDemoModal(): void {
    Swal.fire({
      title: 'Demo de Pecuadex GPS',
      html: `
        <div class="demo-modal">
          <p>Accede a nuestra demo interactiva y descubre todas las funcionalidades</p>
          <div class="demo-options">
            <button class="btn btn-primary btn-sm m-1" onclick="window.open('https://demo.pecuadex.com', '_blank')">
              <i class="fas fa-desktop"></i> Demo Web
            </button>
            <button class="btn btn-success btn-sm m-1" onclick="window.open('https://play.google.com/store/apps/pecuadex', '_blank')">
              <i class="fab fa-google-play"></i> App Android
            </button>
            <button class="btn btn-dark btn-sm m-1" onclick="window.open('https://apps.apple.com/pecuadex', '_blank')">
              <i class="fab fa-apple"></i> App iOS
            </button>
          </div>
          <hr>
          <p class="small text-muted">
            <strong>Credenciales de prueba:</strong><br>
            Usuario: demo@pecuadex.com<br>
            Contraseña: Demo2024
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Solicitar Demo Personalizada',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#2E7D32',
    }).then((result) => {
      if (result.isConfirmed) {
        this.scrollToSection('cotizacion');
      }
    });
  }

  downloadDatasheet(): void {
    // Simular descarga de ficha técnica
    this.toastr.info('Descargando ficha técnica...', 'Descarga');

    // Aquí iría la lógica real de descarga
    setTimeout(() => {
      this.toastr.success(
        'Ficha técnica descargada exitosamente',
        'Completado'
      );
    }, 2000);
  }

  contactSales(): void {
    Swal.fire({
      title: 'Contactar al Equipo de Ventas',
      html: `
        <form id="salesForm">
          <div class="form-group mb-3">
            <input type="text" class="form-control" placeholder="Nombre de la empresa" required>
          </div>
          <div class="form-group mb-3">
            <input type="email" class="form-control" placeholder="Email corporativo" required>
          </div>
          <div class="form-group mb-3">
            <input type="tel" class="form-control" placeholder="Teléfono" required>
          </div>
          <div class="form-group mb-3">
            <textarea class="form-control" rows="3" placeholder="Cuéntanos sobre tu proyecto"></textarea>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2E7D32',
      preConfirm: () => {
        // Validar y enviar formulario
        return true;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.toastr.success(
          'Un ejecutivo te contactará en las próximas 24 horas',
          'Solicitud Enviada'
        );
      }
    });
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
      return;
    }

    this.submitting = true;

    this.cotizacionService.saveCotizacion(this.cotizacionForm.value).subscribe({
      next: () => {
        this.submitting = false;

        Swal.fire({
          icon: 'success',
          title: '¡Cotización Enviada!',
          html: `
            <p>Hemos recibido tu solicitud exitosamente.</p>
            <p><strong>Estimación preliminar:</strong> $${this.cotizacionEstimada.toFixed(
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
      },
      error: () => {
        this.submitting = false;
        this.toastr.error(
          'Hubo un error al enviar la cotización. Por favor intenta nuevamente.',
          'Error'
        );
      },
    });
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

      // Iniciar contador cuando el elemento sea visible
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
