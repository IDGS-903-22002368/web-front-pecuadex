export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precioSugerido: number;
  imagen: string;
  fechaRegistro: Date;
  componentesProducto?: ComponentesProducto[];
  comentarios?: Comentario[];
  manuales?: Manual[];
}

export interface ComponentesProducto {
  productoId: number;
  piezaId: number;
  cantidadRequerida: number;
  pieza?: Pieza;
}

export interface Pieza {
  id: number;
  nombre: string;
  unidadMedida: string;
  descripcion: string;
  fechaRegistro: Date;
}

export interface Comentario {
  id?: number;
  productoId: number;
  descripcion: string;
  calificacion: number;
  fecha: Date;
}

export interface Manual {
  id?: number;
  productoId: number;
  titulo: string;
  urlDocumento: string;
}
