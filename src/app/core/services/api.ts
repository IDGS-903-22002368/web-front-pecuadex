import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ========== COTIZACIONES ==========
  solicitarCotizacion(cotizacion: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/cotizacion/solicitar`,
      cotizacion
    );
  }

  listarCotizaciones(
    estado?: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<any>(`${this.baseUrl}/cotizacion/listar`, { params });
  }

  obtenerCotizacion(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cotizacion/${id}`);
  }

  enviarCotizacion(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cotizacion/enviar`, data);
  }

  aceptarCotizacion(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cotizacion/${id}/aceptar`, {});
  }

  crearClienteDesdeCotizacion(id: number, password?: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/cotizacion/${id}/crear-cliente`,
      {
        cotizacionId: id,
        password,
      }
    );
  }

  actualizarEstadoCotizacion(
    id: number,
    estado: string,
    notas: string
  ): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/cotizacion/${id}/actualizar-estado`,
      {
        estado,
        notas,
      }
    );
  }

  obtenerEstadisticasCotizaciones(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cotizacion/estadisticas`);
  }

  // ========== PRODUCTOS ==========
  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/producto/ListaProductos`);
  }

  createProductoConManual(producto: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/producto/AgregarProductoConManual`,
      producto
    );
  }

  updateProductoConManual(id: number, formData: FormData): Observable<any> {
  return this.http.put<any>(
    `${this.baseUrl}/producto/ModificarProductoConManual/${id}`,
    formData
  );
}

  deleteProductoConManual(id: number): Observable<any> {
  return this.http.delete<any>(
    `${this.baseUrl}/producto/EliminarProductoConManual/${id}`
  );
}

  // ========== PROVEEDORES ==========
  getProveedores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/proveedores/ListaProveedores`);
  }

  createProveedor(proveedor: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/proveedores/AgregarProveedores`,
      proveedor
    );
  }

  updateProveedor(id: number, proveedor: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/proveedores/ModificarProveedor/${id}`,
      proveedor
    );
  }

  deleteProveedor(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/proveedores/EliminarProveedor/${id}`
    );
  }

  // ========== PIEZAS/INVENTARIO ==========
  getPiezas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pieza/ListaPiezas`);
  }

  createPieza(pieza: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/pieza/AgregarPiezas`, pieza);
  }

  updatePieza(id: number, pieza: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/pieza/ModificarPieza/${id}`,
      pieza
    );
  }

  deletePieza(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/pieza/EliminarPieza/${id}`);
  }

  // ========== COMPRAS ==========
  getCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/compras/ListaCompras`);
  }

  createCompra(compra: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/compras/AgregarCompra`, compra);
  }

  // ========== VENTAS ==========
  getVentas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ventas/ListaVentas`);
  }

  createVenta(venta: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/ventas/AgregarVenta`, venta);
  }

  // ========== COMENTARIOS ==========
  getComentarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/comentarios/ListaComentarios`);
  }

  getComentariosByProducto(productoId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/comentarios/ObtenerPorProducto/${productoId}`
    );
  }

  getComentariosByVenta(ventaId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/comentarios/ObtenerPorVenta/${ventaId}`
    );
  }

  getMisComentarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/comentarios/MisComentarios`);
  }

  createComentario(comentario: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/comentarios/AgregarComentario`,
      comentario
    );
  }

  updateComentario(id: number, comentario: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/comentarios/ModificarComentario/${id}`,
      comentario
    );
  }

  deleteComentario(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/comentarios/EliminarComentario/${id}`
    );
  }

  // ========== MANUALES ==========
  getManuales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/manual/ListaManuales`);
  }

  getManualesByProducto(productoId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/manual/ObtenerManualPorProducto/${productoId}`
    );
  }

  createManual(manual: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/manual/AgregarManual`, manual);
  }

  updateManual(id: number, manual: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/manual/ModificarManual/${id}`,
      manual
    );
  }
  uploadManual(formData: FormData) {
  return this.http.post<any>(`${this.baseUrl}/manual/SubirManual`, formData);
  }


  deleteManual(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/manual/EliminarManual/${id}`);
  }

  // ========== MOVIMIENTOS ==========
  getMovimientos(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/movimientospieza/ListaMovimientosPieza`
    );
  }

  createMovimiento(movimiento: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/movimientospieza/AgregarMovimentoPieza`,
      movimiento
    );
  }

  // ========== COMPONENTES PRODUCTO ==========
  getComponentesProducto(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/componentesproducto/ListaComponentesProductos`
    );
  }

  createComponenteProducto(componente: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/componentesproducto/AgregarComponentesProducto`,
      componente
    );
  }

  updateComponenteProducto(id: number, componente: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/componentesproducto/ModificarComponentesProducto/${id}`,
      componente
    );
  }

  deleteComponenteProducto(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/componentesproducto/EliminarComponentesProducto/${id}`
    );
  }

  // ========== COMPRAS CLIENTE ==========
  getComprasCliente(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/comprascliente/ListaComprasCliente`
    );
  }

  getManualesCliente(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/comprascliente/ClienteManualProductos`
    );
  }

  createComentarioCliente(comentario: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/comprascliente/comment`,
      comentario
    );
  }

  // ========== USUARIOS ==========
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/account`);
  }

  getUserDetail(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/account/detail`);
  }

  // ========== ROLES ==========
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/roles`);
  }

  createRole(roleName: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/roles`, { roleName });
  }

  deleteRole(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/roles/${id}`);
  }

  assignRole(userId: string, roleId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/roles/assign`, {
      userId,
      roleId,
    });
  }
}
