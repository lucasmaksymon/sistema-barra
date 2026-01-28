import { 
  Rol, 
  MetodoPago, 
  EstadoPago, 
  EstadoPedido, 
  EstadoItem,
  TipoLocation,
  TipoMovimiento,
  EstadoQRConsumo,
  TipoTransaccionQR
} from '@prisma/client';

export type {
  Rol,
  MetodoPago,
  EstadoPago,
  EstadoPedido,
  EstadoItem,
  TipoLocation,
  TipoMovimiento,
  EstadoQRConsumo,
  TipoTransaccionQR,
};

// API Responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: Rol;
  };
}

// Pedidos
export interface CrearPedidoRequest {
  eventoId: string;
  cajaId: string;
  metodoPago: MetodoPago;
  qrConsumoToken?: string; // Token del QR de consumo (si aplica)
  items: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
  }>;
}

export interface CrearPedidoResponse {
  id: string;
  codigo: string;
  qrToken: string;
  qrUrl: string;
  total: number;
  estadoPago: EstadoPago;
  estadoPedido: EstadoPedido;
  createdAt: string;
}

// Entregas
export interface CrearEntregaRequest {
  qrToken: string;
  barraId: string;
  items: Array<{
    pedidoItemId: string;
    cantidadEntregada: number;
  }>;
  notas?: string;
}

export interface CrearEntregaResponse {
  id: string;
  pedidoId: string;
  mensaje: string;
  pedidoEstado: EstadoPedido;
  itemsActualizados: number;
}

// Pagos
export interface AprobarPagoRequest {
  aprobado: boolean;
  notas?: string;
}

// Inventario
export interface CrearMovimientoRequest {
  tipo: TipoMovimiento;
  productoId: string;
  cantidad: number;
  origenId?: string;
  destinoId?: string;
  locationId?: string;
  motivo?: string;
  notas?: string;
}

export interface StockInfo {
  id: string;
  producto: {
    id: string;
    nombre: string;
    codigo: string;
    precio: number;
  };
  location: {
    id: string;
    nombre: string;
    tipo: TipoLocation;
  };
  cantidad: number;
  reservado: number;
  disponible: number;
  umbralBajo: number | null;
}

// QR de Consumo
export interface CrearQRConsumoRequest {
  eventoId: string;
  montoInicial: number;
  nombreCliente?: string;
  notas?: string;
  fechaExpiracion?: string;
}

export interface CrearQRConsumoResponse {
  id: string;
  codigo: string;
  qrToken: string;
  qrUrl: string;
  montoInicial: number;
  saldoActual: number;
  estado: EstadoQRConsumo;
  createdAt: string;
}

export interface QRConsumoInfo {
  id: string;
  codigo: string;
  qrToken: string;
  montoInicial: number;
  saldoActual: number;
  estado: EstadoQRConsumo;
  nombreCliente: string | null;
  notas: string | null;
  fechaExpiracion: string | null;
  createdAt: string;
  evento: {
    id: string;
    nombre: string;
  };
  transacciones: Array<{
    id: string;
    tipo: TipoTransaccionQR;
    monto: number;
    saldoAnterior: number;
    saldoNuevo: number;
    descripcion: string | null;
    createdAt: string;
  }>;
}

export interface ValidarQRConsumoResponse {
  valido: boolean;
  qrConsumo?: {
    id: string;
    codigo: string;
    saldoActual: number;
    nombreCliente: string | null;
  };
  error?: string;
}

// QR Público
export interface PedidoPublicoResponse {
  codigo: string;
  evento: string;
  caja: string;
  total: number;
  estadoPago: EstadoPago;
  estadoPedido: EstadoPedido;
  metodoPago: MetodoPago;
  createdAt: string;
  items: Array<{
    id: string;
    producto: string;
    cantidad: number;
    cantidadEntregada: number;
    estadoItem: EstadoItem;
    precioUnitario: number;
  }>;
  entregas: Array<{
    id: string;
    barra: string;
    bartender: string;
    fecha: string;
    detalles: Array<{
      producto: string;
      cantidadEntregada: number;
    }>;
  }>;
}
