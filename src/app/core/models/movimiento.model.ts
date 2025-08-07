export interface MovimientosPieza {
  id?: number;
  piezaId: number;
  fecha: Date;
  tipoMovimiento: 'Entrada' | 'Salida';
  cantidad: number;
  costoUnitario?: number;
  costoPromedio: number;
  valorDebe: number;
  valorHaber: number;
  saldoValor: number;
  existencias: number;
}
