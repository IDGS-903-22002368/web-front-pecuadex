// src/app/client/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api';
import { AuthService } from '../../core/services/auth';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-dashboard',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // UI Control
  activeTab = 'dashboard';
  mobileMenuOpen = false;
  userMenuOpen = false;
  notifications = 0;
  loading = false;

  // User Data
  currentUser: any = null;
  userStats = {
    totalDevices: 0,
    activeDevices: 0,
    totalAnimals: 0,
    alerts: 0,
  };

  // Data Collections
  userPurchases: any[] = [];
  userManuals: any[] = [];
  userDevices: any[] = [];
  userTickets: any[] = [];
  recentAlerts: any[] = [];
  userAnimals: any[] = [];
  userZones: any[] = [];
  productosComprados: any[] = [];

  // Forms
  deviceForm!: FormGroup;
  commentForm!: FormGroup;
  ticketForm!: FormGroup;

  // Modals
  showDeviceModal = false;
  showCommentModal = false;
  showTicketModal = false;
  editingDevice: any = null;
  selectedPurchase: any = null;

  // Filters
  deviceSearch = '';
  deviceFilter = 'all';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
    this.setupRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms(): void {
    // Formulario de dispositivo
    this.deviceForm = this.fb.group({
      name: ['', Validators.required],
      deviceId: ['', Validators.required],
      animalId: [''],
      zoneId: [''],
      alertOutOfZone: [true],
      alertLowBattery: [true],
      alertNoMovement: [false],
    });

    // Formulario de comentario
    this.commentForm = this.fb.group({
      productoId: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      calificacion: [
        5,
        [Validators.required, Validators.min(1), Validators.max(5)],
      ],
    });

    // Formulario de ticket
    this.ticketForm = this.fb.group({
      asunto: ['', Validators.required],
      categoria: ['', Validators.required],
      prioridad: ['media', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
    });
  }

  loadUserData(): void {
    // Cargar información del usuario actual
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadUserSpecificData();
        }
      });
  }

  loadUserSpecificData(): void {
    // Cargar compras del cliente
    this.apiService.getComprasCliente().subscribe({
      next: (data) => {
        this.userPurchases = data;
        this.calculateUserStats();
        this.extractProductosComprados();
      },
      error: (error) => {
        console.error('Error cargando compras:', error);
      },
    });

    // Cargar manuales disponibles
    this.apiService.getManualesCliente().subscribe({
      next: (manuales) => {
        this.userManuals = manuales;
      },
      error: (error) => {
        console.error('Error cargando manuales:', error);
      },
    });

    // Simular dispositivos (en producción vendría de una API real)
    this.loadSimulatedDevices();

    // Cargar tickets de soporte
    this.loadSupportTickets();
  }

  loadDashboardData(): void {
    this.loading = true;

    switch (this.activeTab) {
      case 'dashboard':
        this.loadDashboardStats();
        break;
      case 'dispositivos':
        this.loadDevices();
        break;
      case 'compras':
        this.loadPurchases();
        break;
      case 'manuales':
        this.loadManuals();
        break;
      case 'soporte':
        this.loadSupport();
        break;
    }

    this.loading = false;
  }

  loadDashboardStats(): void {
    // Cargar alertas recientes
    this.loadRecentAlerts();

    // Actualizar estadísticas
    this.updateStats();
  }

  loadDevices(): void {
    // En producción, esto vendría de una API real de dispositivos IoT
    // Por ahora simulamos datos
    this.userDevices = this.generateSimulatedDevices();
  }

  loadPurchases(): void {
    // Las compras ya se cargan en loadUserSpecificData
    // Aquí podríamos aplicar filtros adicionales si es necesario
  }

  loadManuals(): void {
    // Los manuales ya se cargan en loadUserSpecificData
    // Aquí podríamos categorizar o filtrar
  }

  loadSupport(): void {
    this.loadSupportTickets();
  }

  loadSupportTickets(): void {
    // Simular tickets (en producción vendría de la API)
    this.userTickets = [
      {
        id: 'TK-001',
        subject: 'Problema con batería del dispositivo',
        lastMessage: 'Estamos revisando su caso...',
        status: 'En Proceso',
        updatedAt: new Date(),
      },
      {
        id: 'TK-002',
        subject: 'Consulta sobre funcionalidades',
        lastMessage: 'Gracias por su consulta, adjuntamos manual...',
        status: 'Resuelto',
        updatedAt: new Date(Date.now() - 86400000),
      },
    ];
  }

  calculateUserStats(): void {
    // Calcular estadísticas basadas en las compras
    if (this.userPurchases.length > 0) {
      const totalDevices = this.userPurchases.reduce((sum, purchase) => {
        const deviceItems =
          purchase.productos?.filter(
            (p: any) =>
              p.nombre?.toLowerCase().includes('gps') ||
              p.nombre?.toLowerCase().includes('dispositivo')
          ) || [];
        return (
          sum +
          deviceItems.reduce(
            (s: number, item: any) => s + (item.cantidad || 0),
            0
          )
        );
      }, 0);

      this.userStats.totalDevices = totalDevices;
      this.userStats.activeDevices = Math.floor(totalDevices * 0.9); // 90% activos
      this.userStats.totalAnimals = totalDevices; // 1:1 ratio por defecto
      this.userStats.alerts = Math.floor(Math.random() * 5); // Alertas aleatorias para demo
    }
  }

  extractProductosComprados(): void {
    // Extraer lista única de productos comprados
    const productosMap = new Map();

    this.userPurchases.forEach((purchase) => {
      if (purchase.productos) {
        purchase.productos.forEach((producto: any) => {
          if (!productosMap.has(producto.nombre)) {
            productosMap.set(producto.nombre, {
              id: productosMap.size + 1,
              nombre: producto.nombre,
              cantidadTotal: 0,
            });
          }
          const existing = productosMap.get(producto.nombre);
          existing.cantidadTotal += producto.cantidad || 0;
        });
      }
    });

    this.productosComprados = Array.from(productosMap.values());
  }

  loadRecentAlerts(): void {
    // Simular alertas recientes
    this.recentAlerts = [
      {
        type: 'warning',
        icon: 'fas fa-battery-quarter',
        title: 'Batería Baja',
        description: 'El dispositivo GPS-001 tiene menos del 20% de batería',
        time: 'Hace 10 minutos',
        device: 'GPS-001',
      },
      {
        type: 'danger',
        icon: 'fas fa-map-marker-alt',
        title: 'Fuera de Zona',
        description: 'El animal #A-025 salió de la zona asignada',
        time: 'Hace 1 hora',
        device: 'GPS-025',
      },
      {
        type: 'info',
        icon: 'fas fa-sync',
        title: 'Actualización Disponible',
        description: 'Nuevo firmware disponible para sus dispositivos',
        time: 'Hace 2 horas',
        device: 'Todos',
      },
    ];

    this.notifications = this.recentAlerts.length;
  }

  generateSimulatedDevices(): any[] {
    const devices = [];
    const deviceCount = this.userStats.totalDevices || 5;

    for (let i = 1; i <= deviceCount; i++) {
      devices.push({
        id: `GPS-${String(i).padStart(3, '0')}`,
        name: `Dispositivo ${i}`,
        animalName: `Vaca #${String(i).padStart(3, '0')}`,
        animalTag: `TAG-${String(i).padStart(4, '0')}`,
        battery: Math.floor(Math.random() * 100),
        isActive: Math.random() > 0.1,
        lastUpdate: new Date(Date.now() - Math.random() * 3600000),
        location: `Zona ${Math.ceil(Math.random() * 5)}`,
        latitude: 21.1619 + (Math.random() - 0.5) * 0.1,
        longitude: -86.8515 + (Math.random() - 0.5) * 0.1,
        temperature: 36 + Math.random() * 3,
        heartRate: 60 + Math.floor(Math.random() * 20),
      });
    }

    return devices;
  }

  loadSimulatedDevices(): void {
    this.userDevices = this.generateSimulatedDevices();

    // Simular animales
    this.userAnimals = this.userDevices.map((device) => ({
      id: device.animalTag,
      name: device.animalName,
      tag: device.animalTag,
      type: 'Bovino',
      age: Math.floor(Math.random() * 10) + 1,
      weight: 400 + Math.floor(Math.random() * 200),
    }));

    // Simular zonas
    this.userZones = [
      { id: 1, name: 'Zona Norte', hectares: 50 },
      { id: 2, name: 'Zona Sur', hectares: 45 },
      { id: 3, name: 'Zona Este', hectares: 60 },
      { id: 4, name: 'Zona Oeste', hectares: 55 },
      { id: 5, name: 'Zona Central', hectares: 40 },
    ];
  }

  setupRealtimeUpdates(): void {
    // Simular actualizaciones en tiempo real cada 30 segundos
    setInterval(() => {
      if (this.activeTab === 'dashboard' || this.activeTab === 'dispositivos') {
        this.updateDeviceStatus();
      }
    }, 30000);
  }

  updateDeviceStatus(): void {
    // Actualizar estado de dispositivos aleatoriamente
    this.userDevices = this.userDevices.map((device) => ({
      ...device,
      battery: Math.max(0, device.battery - Math.random() * 2),
      lastUpdate: new Date(),
      latitude: device.latitude + (Math.random() - 0.5) * 0.001,
      longitude: device.longitude + (Math.random() - 0.5) * 0.001,
      temperature: 36 + Math.random() * 3,
      heartRate: 60 + Math.floor(Math.random() * 20),
    }));
  }

  updateStats(): void {
    // Actualizar estadísticas del dashboard
    this.userStats.alerts = this.recentAlerts.filter(
      (a) => a.type === 'warning' || a.type === 'danger'
    ).length;
  }

  // ========== GESTIÓN DE DISPOSITIVOS ==========

  get filteredDevices(): any[] {
    let devices = this.userDevices;

    // Filtrar por búsqueda
    if (this.deviceSearch) {
      devices = devices.filter(
        (d) =>
          d.name.toLowerCase().includes(this.deviceSearch.toLowerCase()) ||
          d.id.toLowerCase().includes(this.deviceSearch.toLowerCase()) ||
          d.animalName.toLowerCase().includes(this.deviceSearch.toLowerCase())
      );
    }

    // Filtrar por estado
    if (this.deviceFilter !== 'all') {
      devices = devices.filter((d) => {
        switch (this.deviceFilter) {
          case 'active':
            return d.isActive;
          case 'inactive':
            return !d.isActive;
          case 'maintenance':
            return d.battery < 20;
          default:
            return true;
        }
      });
    }

    return devices;
  }

  openDeviceModal(device?: any): void {
    this.editingDevice = device;
    if (device) {
      this.deviceForm.patchValue({
        name: device.name,
        deviceId: device.id,
        animalId: device.animalTag,
        zoneId: device.zoneId || '',
        alertOutOfZone: true,
        alertLowBattery: true,
        alertNoMovement: false,
      });
    } else {
      this.deviceForm.reset({
        alertOutOfZone: true,
        alertLowBattery: true,
        alertNoMovement: false,
      });
    }
    this.showDeviceModal = true;
  }

  closeDeviceModal(): void {
    this.showDeviceModal = false;
    this.editingDevice = null;
    this.deviceForm.reset();
  }

  saveDevice(): void {
    if (this.deviceForm.invalid) {
      Object.keys(this.deviceForm.controls).forEach((key) => {
        const control = this.deviceForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const deviceData = this.deviceForm.value;

    if (this.editingDevice) {
      // Actualizar dispositivo
      const index = this.userDevices.findIndex(
        (d) => d.id === this.editingDevice.id
      );
      if (index !== -1) {
        this.userDevices[index] = {
          ...this.userDevices[index],
          ...deviceData,
        };
        this.toastr.success('Dispositivo actualizado exitosamente', 'Éxito');
      }
    } else {
      // Agregar nuevo dispositivo
      const newDevice = {
        ...deviceData,
        id: deviceData.deviceId,
        battery: 100,
        isActive: true,
        lastUpdate: new Date(),
        location: 'Zona 1',
        latitude: 21.1619,
        longitude: -86.8515,
      };
      this.userDevices.push(newDevice);
      this.toastr.success('Dispositivo agregado exitosamente', 'Éxito');
    }

    this.closeDeviceModal();
  }

  viewDeviceDetails(device: any): void {
    Swal.fire({
      title: device.name,
      html: `
        <div class="device-details">
          <p><strong>ID:</strong> ${device.id}</p>
          <p><strong>Animal:</strong> ${device.animalName}</p>
          <p><strong>Ubicación:</strong> ${device.location}</p>
          <p><strong>Coordenadas:</strong> ${device.latitude.toFixed(
            6
          )}, ${device.longitude.toFixed(6)}</p>
          <p><strong>Batería:</strong> ${device.battery}%</p>
          <p><strong>Temperatura:</strong> ${
            device.temperature?.toFixed(1) || 'N/A'
          }°C</p>
          <p><strong>Ritmo Cardíaco:</strong> ${
            device.heartRate || 'N/A'
          } bpm</p>
          <p><strong>Última Actualización:</strong> ${new Date(
            device.lastUpdate
          ).toLocaleString()}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
    });
  }

  configureDevice(device: any): void {
    this.openDeviceModal(device);
  }

  // ========== GESTIÓN DE COMPRAS Y COMENTARIOS ==========

  getStatusColor(estado: string): string {
    const colors: any = {
      Pendiente: 'warning',
      Procesando: 'info',
      Enviado: 'primary',
      Completada: 'success',
      Cancelada: 'danger',
    };
    return colors[estado] || 'secondary';
  }

  viewInvoice(purchase: any): void {
    Swal.fire({
      title: `Factura #${purchase.id}`,
      html: `
        <div class="invoice-details">
          <p><strong>Fecha:</strong> ${new Date(
            purchase.fecha
          ).toLocaleDateString()}</p>
          <p><strong>Total:</strong> $${
            purchase.total?.toFixed(2) || '0.00'
          } MXN</p>
          <hr>
          <h5>Productos:</h5>
          ${
            purchase.productos
              ?.map(
                (p: any) => `
            <p>${p.nombre} - Cantidad: ${p.cantidad} - $${
                  p.precio?.toFixed(2) || '0.00'
                }</p>
          `
              )
              .join('') || '<p>Sin productos</p>'
          }
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Descargar PDF',
      cancelButtonText: 'Cerrar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.toastr.info('Descargando factura...', 'Descarga');
        // Aquí iría la lógica de descarga del PDF
      }
    });
  }

  leaveReview(purchase: any): void {
    this.selectedPurchase = purchase;

    Swal.fire({
      title: 'Dejar Reseña',
      html: `
        <div class="review-form">
          <div class="form-group">
            <label>Producto:</label>
            <select id="swal-product" class="swal2-select">
              ${this.productosComprados
                .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Calificación:</label>
            <div class="star-rating">
              <input type="radio" name="rating" value="5" id="star5" checked>
              <label for="star5">⭐⭐⭐⭐⭐</label><br>
              <input type="radio" name="rating" value="4" id="star4">
              <label for="star4">⭐⭐⭐⭐</label><br>
              <input type="radio" name="rating" value="3" id="star3">
              <label for="star3">⭐⭐⭐</label><br>
              <input type="radio" name="rating" value="2" id="star2">
              <label for="star2">⭐⭐</label><br>
              <input type="radio" name="rating" value="1" id="star1">
              <label for="star1">⭐</label>
            </div>
          </div>
          <div class="form-group">
            <label>Comentario:</label>
            <textarea id="swal-comment" class="swal2-textarea" 
                      placeholder="Comparte tu experiencia..." rows="4"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar Reseña',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const productoId = (
          document.getElementById('swal-product') as HTMLSelectElement
        ).value;
        const calificacion = (
          document.querySelector(
            'input[name="rating"]:checked'
          ) as HTMLInputElement
        )?.value;
        const descripcion = (
          document.getElementById('swal-comment') as HTMLTextAreaElement
        ).value;

        if (!descripcion || descripcion.length < 10) {
          Swal.showValidationMessage(
            'El comentario debe tener al menos 10 caracteres'
          );
          return false;
        }

        return {
          productoId,
          calificacion: parseInt(calificacion),
          descripcion,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const comentario = {
          productoId: parseInt(result.value.productoId),
          descripcion: result.value.descripcion,
          calificacion: result.value.calificacion,
        };

        this.apiService.createComentarioCliente(comentario).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Gracias por tu reseña!',
              text: 'Tu opinión nos ayuda a mejorar',
              confirmButtonText: 'De nada',
            });
          },
          error: (error) => {
            this.toastr.error('Error al enviar la reseña', 'Error');
          },
        });
      }
    });
  }

  // ========== GESTIÓN DE MANUALES ==========

  getManualIcon(tipo: string): string {
    const icons: any = {
      pdf: 'fas fa-file-pdf',
      video: 'fas fa-video',
      guia: 'fas fa-book',
      faq: 'fas fa-question-circle',
    };
    return icons[tipo] || 'fas fa-file';
  }

  downloadManual(manual: any): void {
    this.toastr.info('Descargando manual...', 'Descarga');

    // Simular descarga
    setTimeout(() => {
      this.toastr.success('Manual descargado exitosamente', 'Completado');

      // En producción, aquí se haría la descarga real
      if (manual.urlDocumento) {
        const link = document.createElement('a');
        link.href = manual.urlDocumento;
        link.download = manual.titulo + '.pdf';
        link.click();
      }
    }, 2000);
  }

  // ========== GESTIÓN DE SOPORTE ==========

  openChat(): void {
    Swal.fire({
      title: 'Chat en Vivo',
      html: `
        <div class="chat-container">
          <div class="chat-messages">
            <div class="message support">
              <p>¡Hola! Soy tu asistente de Pecuadex. ¿En qué puedo ayudarte hoy?</p>
            </div>
          </div>
          <div class="chat-input">
            <input type="text" id="chat-message" class="swal2-input" 
                   placeholder="Escribe tu mensaje..." autofocus>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cerrar Chat',
      didOpen: () => {
        const input = document.getElementById(
          'chat-message'
        ) as HTMLInputElement;
        input?.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            Swal.clickConfirm();
          }
        });
      },
    });
  }

  createTicket(): void {
    Swal.fire({
      title: 'Crear Ticket de Soporte',
      html: `
        <form id="ticket-form">
          <div class="form-group">
            <label>Asunto:</label>
            <input type="text" id="ticket-subject" class="swal2-input" 
                   placeholder="Resumen del problema">
          </div>
          <div class="form-group">
            <label>Categoría:</label>
            <select id="ticket-category" class="swal2-select">
              <option value="tecnico">Problema Técnico</option>
              <option value="facturacion">Facturación</option>
              <option value="dispositivo">Dispositivo</option>
              <option value="app">Aplicación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prioridad:</label>
            <select id="ticket-priority" class="swal2-select">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div class="form-group">
            <label>Descripción:</label>
            <textarea id="ticket-description" class="swal2-textarea" 
                      rows="4" placeholder="Describe el problema en detalle..."></textarea>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear Ticket',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const subject = (
          document.getElementById('ticket-subject') as HTMLInputElement
        ).value;
        const category = (
          document.getElementById('ticket-category') as HTMLSelectElement
        ).value;
        const priority = (
          document.getElementById('ticket-priority') as HTMLSelectElement
        ).value;
        const description = (
          document.getElementById('ticket-description') as HTMLTextAreaElement
        ).value;

        if (!subject || !description || description.length < 20) {
          Swal.showValidationMessage(
            'Por favor completa todos los campos (mínimo 20 caracteres en descripción)'
          );
          return false;
        }

        return { subject, category, priority, description };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // Simular creación de ticket
        const ticketId =
          'TK-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');

        Swal.fire({
          icon: 'success',
          title: 'Ticket Creado',
          html: `
            <p>Tu ticket ha sido creado exitosamente</p>
            <p><strong>ID del Ticket:</strong> ${ticketId}</p>
            <p class="text-muted">Recibirás una respuesta en las próximas 24 horas</p>
          `,
          confirmButtonText: 'Entendido',
        });

        // Agregar a la lista de tickets
        this.userTickets.unshift({
          id: ticketId,
          subject: result.value.subject,
          lastMessage: 'Ticket creado, esperando respuesta...',
          status: 'Abierto',
          updatedAt: new Date(),
        });
      }
    });
  }

  getTicketStatusColor(status: string): string {
    const colors: any = {
      Abierto: 'warning',
      'En Proceso': 'info',
      'Esperando Respuesta': 'secondary',
      Resuelto: 'success',
      Cerrado: 'dark',
    };
    return colors[status] || 'secondary';
  }

  // ========== NAVEGACIÓN Y UI ==========

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.mobileMenuOpen = false;
    this.loadDashboardData();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: 'Se cerrará tu sesión actual',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Cerrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.router.navigate(['/']);
      }
    });
  }
}
