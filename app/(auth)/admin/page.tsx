'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  totalPedidos: number;
  pedidosPendientes: number;
  pedidosEntregados: number;
  pagosPendientes: number;
  totalVentas: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalPedidos: 0,
    pedidosPendientes: 0,
    pedidosEntregados: 0,
    pagosPendientes: 0,
    totalVentas: 0,
  });
  const [pagosPendientes, setPagosPendientes] = useState<any[]>([]);
  const [stockBajo, setStockBajo] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarDashboard();
    }
  }, [eventoSeleccionado]);

  const cargarEventos = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('/api/eventos?activo=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setEventos(data.data);
        setEventoSeleccionado(data.data[0].id);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  const cargarDashboard = async () => {
    const token = localStorage.getItem('token');
    setLoadingDashboard(true);
    
    try {
      // Optimización: cargar todo en paralelo
      const [resPedidos, resPagos, resStock] = await Promise.all([
        fetch(`/api/pedidos?eventoId=${eventoSeleccionado}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/pagos/pendientes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/inventario/stock?eventoId=${eventoSeleccionado}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [dataPedidos, dataPagos, dataStock] = await Promise.all([
        resPedidos.json(),
        resPagos.json(),
        resStock.json(),
      ]);
      
      if (dataPedidos.success) {
        const pedidos = dataPedidos.data.pedidos;
        const newStats: Stats = {
          totalPedidos: pedidos.length,
          pedidosPendientes: pedidos.filter(
            (p: any) => p.estadoPedido === 'PENDING_DELIVERY' || p.estadoPedido === 'PARTIAL_DELIVERY'
          ).length,
          pedidosEntregados: pedidos.filter((p: any) => p.estadoPedido === 'DELIVERED').length,
          pagosPendientes: pedidos.filter(
            (p: any) => p.estadoPago === 'PENDING_PAYMENT'
          ).length,
          totalVentas: pedidos
            .filter((p: any) => p.estadoPago === 'PAID')
            .reduce((sum: number, p: any) => sum + Number(p.total), 0),
        };
        setStats(newStats);
      }

      if (dataPagos.success) {
        setPagosPendientes(dataPagos.data.filter((p: any) => p.eventoId === eventoSeleccionado));
      }

      if (dataStock.success) {
        const bajo = dataStock.data.filter(
          (s: any) => s.umbralBajo && s.disponible <= s.umbralBajo
        );
        setStockBajo(bajo);
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const aprobarPago = async (pedidoId: string, aprobado: boolean) => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/pagos/${pedidoId}/aprobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ aprobado }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        cargarDashboard();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-400">Panel de control y gestión del sistema</p>
          </div>
          <div className="hidden sm:block text-6xl">📊</div>
        </div>
        
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-4 shadow-lg">
          <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            🎪 Evento Activo
          </label>
          <select
            value={eventoSeleccionado}
            onChange={(e) => setEventoSeleccionado(e.target.value)}
            className="w-full md:w-96 px-4 py-3 bg-[#0f1419] border-2 border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-lg transition-all"
          >
            {eventos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative">
        {loadingDashboard && (
          <div className="absolute inset-0 bg-[#0f1419]/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-2"></div>
              <p className="text-gray-300 font-semibold">Actualizando...</p>
            </div>
          </div>
        )}
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Total Pedidos</div>
            <div className="text-2xl">📋</div>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats.totalPedidos}</div>
          <div className="text-xs text-gray-400">Pedidos registrados</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/30 rounded-xl p-6 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-yellow-300 uppercase tracking-wide">Pendientes</div>
            <div className="text-2xl">⏳</div>
          </div>
          <div className="text-4xl font-bold text-yellow-400 mb-1">{stats.pedidosPendientes}</div>
          <div className="text-xs text-gray-400">Por entregar</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/30 rounded-xl p-6 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-green-300 uppercase tracking-wide">Entregados</div>
            <div className="text-2xl">✅</div>
          </div>
          <div className="text-4xl font-bold text-green-400 mb-1">{stats.pedidosEntregados}</div>
          <div className="text-xs text-gray-400">Completados</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-purple-300 uppercase tracking-wide">Ventas Totales</div>
            <div className="text-2xl">💰</div>
          </div>
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1">
            ${stats.totalVentas.toFixed(0)}
          </div>
          <div className="text-xs text-gray-400">Ingresos generados</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pagos Pendientes */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-2 border-yellow-500/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">💳</span>
              Transferencias Pendientes
            </h2>
            <span className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-400 px-4 py-2 rounded-xl font-bold text-lg border-2 border-yellow-500/50 shadow-lg">
              {pagosPendientes.length}
            </span>
          </div>

          {pagosPendientes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-semibold">No hay pagos pendientes</p>
              <p className="text-xs mt-1">Todas las transferencias han sido procesadas</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
              {pagosPendientes.map((pedido) => (
                <div
                  key={pedido.id}
                  className="border-2 border-yellow-500/50 bg-gradient-to-br from-[#0f1419] to-yellow-900/10 rounded-xl p-4 hover:border-yellow-400/70 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-white text-lg">{pedido.codigo}</p>
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/50 font-semibold">
                          PENDIENTE
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold">Caja:</span> {pedido.caja.nombre}
                      </p>
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold">Cajero:</span> {pedido.cajero.nombre}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        📅 {new Date(pedido.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-400">
                        ${Number(pedido.total).toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">🏦 Transferencia</p>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-300">
                      <span className="font-semibold">ℹ️ Instrucción:</span> Verifica que el cliente haya realizado la transferencia y muestre el comprobante antes de aprobar.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => aprobarPago(pedido.id, true)}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:bg-gray-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95 transform"
                    >
                      ✓ Aprobar Pago
                    </button>
                    <button
                      onClick={() => aprobarPago(pedido.id, false)}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:bg-gray-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95 transform"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Bajo */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-2 border-red-500/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Stock Bajo
            </h2>
            {stockBajo.length > 0 && (
              <span className="bg-gradient-to-r from-red-500/30 to-orange-500/30 text-red-400 px-4 py-2 rounded-xl font-bold text-lg border-2 border-red-500/50 shadow-lg">
                {stockBajo.length}
              </span>
            )}
          </div>

          {stockBajo.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Stock en niveles normales
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
              {stockBajo.map((item) => (
                <div
                  key={item.id}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">
                        {item.producto.nombre}
                      </p>
                      <p className="text-sm text-gray-400">
                        {item.location.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-400">
                        {item.disponible}
                      </p>
                      <p className="text-xs text-gray-500">
                        Umbral: {item.umbralBajo}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <span className="font-semibold">Stock:</span> {item.cantidad} |{' '}
                    <span className="font-semibold">Reservado:</span> {item.reservado}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
