export interface Venta {
  id?: number;
  fecha: Date;
  total: number;
  estado: string;
  detalles: DetalleVenta[];
  usuarioId?: string;
}

export interface DetalleVenta {
  id?: number;
  ventaId?: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
