export interface Compra {
  id?: number;
  proveedorId: number;
  fecha: Date;
  detalles: DetalleCompra[];
}

export interface DetalleCompra {
  id?: number;
  compraId?: number;
  movimientosPiezaId?: number;
  presentacion: string;
  cantidad: number;
  precioTotal: number;
  piezaId: number;
}
