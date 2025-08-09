import { Component, Input, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ToastrService } from 'ngx-toastr';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  component?: string;
  children?: NavItem[];
  badge?: string;
  permission?: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <!-- Brand -->
        <a
          class="navbar-brand d-flex align-items-center"
          [routerLink]="homeRoute"
        >
          <img
            src="assets/logo-pecuadex.webp"
            alt="Pecuadex"
            height="35"
            class="me-2"
          />
          <span class="brand-text">{{ brandText }}</span>
        </a>

        <!-- Mobile toggle -->
        <button
          class="navbar-toggler"
          type="button"
          (click)="toggleMobileMenu()"
          [class.collapsed]="!isMobileMenuOpen"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navbar content -->
        <div class="collapse navbar-collapse" [class.show]="isMobileMenuOpen">
          <!-- Navigation items -->
          <ul class="navbar-nav me-auto">
            <li class="nav-item" *ngFor="let item of navItems">
              <!-- Dropdown menu -->
              <div
                class="nav-item dropdown"
                *ngIf="item.children && item.children.length > 0"
              >
                <button
                  class="nav-link dropdown-toggle btn btn-link"
                  type="button"
                  [id]="'dropdown-' + item.label"
                  (click)="toggleDropdown(item); $event.preventDefault()"
                  [class.active]="isDropdownActive(item)"
                >
                  <i [class]="item.icon" class="me-2"></i>
                  {{ item.label }}
                  <span class="badge bg-danger ms-2" *ngIf="item.badge">{{
                    item.badge
                  }}</span>
                </button>

                <ul class="dropdown-menu" [class.show]="item.isOpen">
                  <li *ngFor="let child of item.children">
                    <button
                      class="dropdown-item btn btn-link text-start"
                      type="button"
                      (click)="selectNavItem(child); $event.preventDefault()"
                      [class.active]="activeComponent === child.component"
                    >
                      <i [class]="child.icon" class="me-2"></i>
                      {{ child.label }}
                      <span class="badge bg-danger ms-2" *ngIf="child.badge">{{
                        child.badge
                      }}</span>
                    </button>
                  </li>
                </ul>
              </div>

              <!-- Single nav item -->
              <button
                *ngIf="!item.children || item.children.length === 0"
                class="nav-link btn btn-link"
                type="button"
                (click)="selectNavItem(item); $event.preventDefault()"
                [class.active]="
                  activeComponent === item.component ||
                  currentRoute === item.route
                "
              >
                <i [class]="item.icon" class="me-2"></i>
                {{ item.label }}
                <span class="badge bg-danger ms-2" *ngIf="item.badge">{{
                  item.badge
                }}</span>
              </button>
            </li>
          </ul>

          <!-- User menu -->
          <div class="navbar-nav">
            <div class="nav-item dropdown">
              <button
                class="nav-link dropdown-toggle d-flex align-items-center btn btn-link"
                type="button"
                id="userDropdown"
                (click)="toggleUserMenu(); $event.preventDefault()"
              >
                <img
                  [src]="userAvatar"
                  alt="Usuario"
                  width="32"
                  height="32"
                  class="rounded-circle me-2"
                />
                <span class="d-none d-md-inline">{{ userName }}</span>
              </button>

              <ul
                class="dropdown-menu dropdown-menu-end"
                [class.show]="isUserMenuOpen"
              >
                <li>
                  <h6 class="dropdown-header">
                    <i class="fas fa-user me-2"></i>{{ userName }}
                  </h6>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <button
                    class="dropdown-item btn btn-link text-start"
                    type="button"
                    (click)="goToProfile(); $event.preventDefault()"
                  >
                    <i class="fas fa-user-edit me-2"></i>Mi Perfil
                  </button>
                </li>
                <li>
                  <button
                    class="dropdown-item btn btn-link text-start"
                    type="button"
                    (click)="goToSettings(); $event.preventDefault()"
                  >
                    <i class="fas fa-cog me-2"></i>Configuración
                  </button>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <button
                    class="dropdown-item text-danger btn btn-link text-start"
                    type="button"
                    (click)="logout(); $event.preventDefault()"
                  >
                    <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        background: linear-gradient(
          135deg,
          var(--primary-color) 0%,
          var(--dark-color) 100%
        ) !important;
        border-bottom: 3px solid var(--accent-color);
      }

      .navbar-brand {
        font-weight: 700;
        font-size: 1.4rem;

        .brand-text {
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }

      .nav-link {
        color: rgba(255, 255, 255, 0.9) !important;
        font-weight: 500;
        padding: 0.75rem 1rem !important;
        border-radius: 8px;
        transition: all 0.3s ease;
        margin: 0 0.25rem;
        border: none;
        background: none;
        text-decoration: none;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white !important;
          transform: translateY(-1px);
        }

        &.active {
          background: rgba(255, 255, 255, 0.2);
          color: white !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        i {
          width: 20px;
          text-align: center;
        }
      }

      .dropdown-menu {
        background: white;
        border: none;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        margin-top: 0.5rem;
        overflow: hidden;

        .dropdown-item {
          padding: 0.75rem 1.25rem;
          transition: all 0.3s ease;
          color: var(--text-dark);
          border: none;
          background: none;
          width: 100%;
          text-decoration: none;

          &:hover {
            background: var(--light-color);
            color: var(--primary-color);
            transform: translateX(5px);
          }

          &.active {
            background: var(--primary-color);
            color: white;
          }

          i {
            width: 20px;
            text-align: center;
          }
        }

        .dropdown-header {
          background: var(--light-color);
          font-weight: 600;
          color: var(--primary-color);
        }
      }

      .badge {
        font-size: 0.7rem;
        padding: 0.25em 0.5em;
      }

      .navbar-toggler {
        border: none;
        padding: 0.25rem 0.5rem;

        &:focus {
          box-shadow: none;
        }

        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.75%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
        }
      }

      @media (max-width: 991px) {
        .navbar-nav {
          margin-top: 1rem;

          .nav-link {
            margin: 0.25rem 0;
          }
        }

        .dropdown-menu {
          position: static;
          float: none;
          box-shadow: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          margin: 0.5rem 0;

          .dropdown-item {
            color: rgba(255, 255, 255, 0.9);

            &:hover {
              background: rgba(255, 255, 255, 0.1);
              color: white;
            }
          }
        }
      }
    `,
  ],
})
export class Navbar implements OnInit {
  @Input() navItems: NavItem[] = [];
  @Input() brandText: string = 'Panel';
  @Input() homeRoute: string = '/';
  @Input() userType: 'admin' | 'client' = 'admin';

  isMobileMenuOpen = false;
  isUserMenuOpen = false;
  activeComponent: string = '';
  currentRoute: string = '';
  userName: string = '';
  userAvatar: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.trackRouteChanges();

    // Cerrar menús al hacer click fuera
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.navbar')) {
        this.closeAllMenus();
      }
    });
  }

  private loadUserData(): void {
    // Cargar datos del usuario logueado
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.fullName || 'Usuario';
        this.userAvatar = this.generateAvatar(user.fullName);
      }
    });

    // Si no hay datos en el observable, intentar cargar
    if (!this.userName) {
      this.authService.loadUserDetails();
      // Fallback con datos del token
      const token = this.authService.getToken();
      if (token) {
        try {
          const decoded: any = JSON.parse(atob(token.split('.')[1]));
          this.userName = decoded.name || decoded.Name || 'Usuario';
          this.userAvatar = this.generateAvatar(this.userName);
        } catch (error) {
          this.userName = 'Usuario';
          this.userAvatar = this.generateAvatar('Usuario');
        }
      }
    }
  }

  private generateAvatar(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&size=32&background=2E7D32&color=fff&rounded=true`;
  }

  private trackRouteChanges(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isUserMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.isMobileMenuOpen = false;
  }

  toggleDropdown(item: NavItem): void {
    // Cerrar otros dropdowns
    this.navItems.forEach((navItem) => {
      if (navItem !== item) {
        navItem.isOpen = false;
      }
    });

    item.isOpen = !item.isOpen;
    this.isUserMenuOpen = false;
  }

  selectNavItem(item: NavItem): void {
    if (item.route) {
      // Navegar a una ruta
      this.router.navigate([item.route]);
    } else if (item.component) {
      // Activar componente específico
      this.activeComponent = item.component;
      // Emitir evento para que el layout lo maneje
      this.onComponentSelected(item.component);
    }

    this.closeAllMenus();
  }

  private onComponentSelected(component: string): void {
    // Dispatch custom event para que el layout lo escuche
    window.dispatchEvent(
      new CustomEvent('navbar-component-selected', {
        detail: { component },
      })
    );
  }

  isDropdownActive(item: NavItem): boolean {
    return (
      item.children?.some(
        (child) =>
          child.component === this.activeComponent ||
          child.route === this.currentRoute
      ) || false
    );
  }

  goToProfile(): void {
    // En lugar de navegar a una ruta, activar el componente perfil
    this.activeComponent = 'perfil';
    this.onComponentSelected('perfil');
    this.closeAllMenus();
  }

  goToSettings(): void {
    // Mantener navegación a settings para funcionalidad futura
    this.router.navigate([`/${this.userType}/settings`]);
    this.closeAllMenus();
  }

  logout(): void {
    this.authService.logout();
    this.toastr.success('Sesión cerrada correctamente', 'Hasta pronto');
    this.closeAllMenus();
  }

  private closeAllMenus(): void {
    this.isMobileMenuOpen = false;
    this.isUserMenuOpen = false;
    this.navItems.forEach((item) => (item.isOpen = false));
  }
}
