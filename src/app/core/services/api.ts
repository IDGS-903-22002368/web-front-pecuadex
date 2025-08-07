import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Productos
  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/producto/ListaProductos`);
  }

  createProducto(producto: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/producto/AgregarProducto`,
      producto
    );
  }

  updateProducto(id: number, producto: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/producto/ModificarProducto/${id}`,
      producto
    );
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/producto/EliminarProducto/${id}`
    );
  }

  // Proveedores
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

  // Piezas
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

  // Compras
  getCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/compras/ListaCompras`);
  }

  createCompra(compra: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/compras/AgregarCompra`, compra);
  }

  // Ventas
  getVentas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ventas/ListaVentas`);
  }

  createVenta(venta: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/ventas/AgregarVenta`, venta);
  }

  // Comentarios
  getComentarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/comentarios/ListaComentarios`);
  }

  getComentariosByProducto(productoId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/comentarios/ObtenerPorProducto/${productoId}`
    );
  }

  createComentario(comentario: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/comentarios/AgregarComentario`,
      comentario
    );
  }

  // Manuales
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

  // Movimientos
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

  // Componentes Producto
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

  // Compras Cliente
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

  // Usuarios
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/account`);
  }

  // Roles
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/roles`);
  }

  createRole(roleName: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/roles`, { roleName });
  }

  assignRole(userId: string, roleId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/roles/assign`, {
      userId,
      roleId,
    });
  }
}
