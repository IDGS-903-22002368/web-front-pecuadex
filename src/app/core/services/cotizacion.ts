import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Cotizacion } from '../models/cotizacion.model';

@Injectable({
  providedIn: 'root',
})
export class CotizacionService {
  private cotizaciones: Cotizacion[] = [];

  constructor() {
    // Cargar cotizaciones del localStorage si existen
    const saved = localStorage.getItem('cotizaciones');
    if (saved) {
      this.cotizaciones = JSON.parse(saved);
    }
  }

  saveCotizacion(cotizacion: Cotizacion): Observable<boolean> {
    cotizacion.fecha = new Date();
    this.cotizaciones.push(cotizacion);
    localStorage.setItem('cotizaciones', JSON.stringify(this.cotizaciones));

    // Aquí podrías enviar un email o guardar en base de datos
    console.log('Nueva cotización:', cotizacion);

    return of(true);
  }

  getCotizaciones(): Observable<Cotizacion[]> {
    return of(this.cotizaciones);
  }

  calcularPrecio(cotizacion: Cotizacion): number {
    let precioBase = 2500; // Precio base por dispositivo
    let total = precioBase * cotizacion.cantidadDispositivos;

    // Descuentos por volumen
    if (cotizacion.cantidadDispositivos > 10) {
      total *= 0.9; // 10% descuento
    } else if (cotizacion.cantidadDispositivos > 20) {
      total *= 0.85; // 15% descuento
    } else if (cotizacion.cantidadDispositivos > 50) {
      total *= 0.8; // 20% descuento
    }

    // Costo adicional por funcionalidades premium
    if (cotizacion.funcionalidadesRequeridas.includes('alertas-avanzadas')) {
      total += 500 * cotizacion.cantidadDispositivos;
    }
    if (cotizacion.funcionalidadesRequeridas.includes('analytics')) {
      total += 800 * cotizacion.cantidadDispositivos;
    }
    if (cotizacion.funcionalidadesRequeridas.includes('integracion-erp')) {
      total += 1500;
    }

    return total;
  }
}
