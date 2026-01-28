'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PedidoPublico {
  codigo: string;
  evento: string;
  caja: string;
  total: number;
  estadoPago: string;
  estadoPedido: string;
  metodoPago: string;
  createdAt: string;
  items: Array<{
    id: string;
    producto: string;
    cantidad: number;
    cantidadEntregada: number;
    estadoItem: string;
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

export default function QRPublicPage() {
  const params = useParams();
  const token = params.token as string;
  const [pedido, setPedido] = useState<PedidoPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPedido();
    const interval = setInterval(cargarPedido, 5000); // Refresh cada 5s
    return () => clearInterval(interval);
  }, [token]);

  const cargarPedido = async () => {
    try {
      const res = await fetch(`/api/qr/${token}`);
      const data = await res.json();

      if (data.success) {
        setPedido(data.data);
        setError('');
      } else {
        setError(data.error || 'Pedido no encontrado');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm sm:text-base">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 sm:p-8 text-center max-w-md w-full">
          <div className="text-red-500 text-4xl sm:text-5xl mb-4">✗</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!pedido) return null;

  const estadoPagoColor =
    pedido.estadoPago === 'PAID'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : pedido.estadoPago === 'PENDING_PAYMENT'
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';

  const estadoPedidoColor =
    pedido.estadoPedido === 'DELIVERED'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : pedido.estadoPedido === 'PARTIAL_DELIVERY'
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      : pedido.estadoPedido === 'PENDING_DELIVERY'
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <div className="min-h-screen bg-[#0f1419] py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-4 sm:p-6 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Tu Pedido</h1>
            <p className="text-4xl sm:text-5xl font-bold mb-1 break-all">{pedido.codigo}</p>
            <p className="text-blue-100 text-xs sm:text-sm">{pedido.evento}</p>
          </div>

          {/* Estados */}
          <div className="p-4 sm:p-6 border-b border-gray-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Estado de Pago</p>
                <span
                  className={`inline-block px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm border ${estadoPagoColor}`}
                >
                  {pedido.estadoPago === 'PAID'
                    ? '✓ PAGADO'
                    : pedido.estadoPago === 'PENDING_PAYMENT'
                    ? '⏳ PENDIENTE'
                    : 'RECHAZADO'}
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Estado de Entrega</p>
                <span
                  className={`inline-block px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm border ${estadoPedidoColor}`}
                >
                  {pedido.estadoPedido === 'DELIVERED'
                    ? '✓ ENTREGADO'
                    : pedido.estadoPedido === 'PARTIAL_DELIVERY'
                    ? '🕐 EN PROCESO'
                    : pedido.estadoPedido === 'PENDING_DELIVERY'
                    ? '⏳ PENDIENTE'
                    : 'CANCELADO'}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-4 sm:p-6 border-b border-gray-800">
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Items del Pedido</h3>
            <div className="space-y-3">
              {pedido.items.map((item) => (
                <div key={item.id} className="bg-[#0f1419] border border-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-semibold text-white text-sm sm:text-base break-words">
                        {item.cantidad}x {item.producto}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        ${item.precioUnitario.toFixed(2)} c/u
                      </p>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
                      ${(item.cantidad * item.precioUnitario).toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Progreso de entrega */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-gray-400">Entregado:</span>
                      <span className={`font-semibold ${item.estadoItem === 'DELIVERED' ? 'text-green-400' : 'text-gray-400'}`}>
                        {item.cantidadEntregada} / {item.cantidad}
                        {item.estadoItem === 'DELIVERED' && ' ✓'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${item.estadoItem === 'DELIVERED' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{
                          width: `${(item.cantidadEntregada / item.cantidad) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entregas */}
          {pedido.entregas.length > 0 && (
            <div className="p-4 sm:p-6 border-b border-gray-800">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                Historial de Entregas
              </h3>
              <div className="space-y-3">
                {pedido.entregas.map((entrega) => (
                  <div key={entrega.id} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm sm:text-base break-words">{entrega.barra}</p>
                        <p className="text-xs sm:text-sm text-gray-400">{entrega.bartender}</p>
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(entrega.fecha).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="mt-2 space-y-1">
                      {entrega.detalles.map((detalle, idx) => (
                        <p key={idx} className="text-xs sm:text-sm text-blue-400 break-words">
                          ✓ {detalle.cantidadEntregada}x {detalle.producto}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="p-4 sm:p-6 bg-[#0f1419]">
            <div className="flex justify-between items-center">
              <span className="text-lg sm:text-xl font-bold text-white">TOTAL</span>
              <span className="text-2xl sm:text-3xl font-bold text-blue-500">
                ${pedido.total.toFixed(2)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Método: {pedido.metodoPago === 'CASH' ? 'Efectivo' : 'Transferencia'}
            </p>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 bg-[#0f1419] border-t border-gray-800 text-center">
            <button
              onClick={() => window.location.reload()}
              className="text-blue-500 hover:text-blue-400 active:text-blue-600 font-semibold text-sm py-2 px-4 rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              🔄 Actualizar estado
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Se actualiza automáticamente cada 5 segundos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
