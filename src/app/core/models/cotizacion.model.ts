export interface Cotizacion {
  nombreCliente: string;
  emailCliente: string;
  telefono: string;
  empresa?: string;
  cantidadDispositivos: number;
  cantidadAnimales: number;
  tipoGanado: string;
  hectareas: number;
  funcionalidadesRequeridas: string[];
  comentarios?: string;
  fecha: Date;
}
