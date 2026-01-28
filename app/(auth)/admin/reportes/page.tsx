'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Evento {
  id: string;
  nombre: string;
}

interface ReporteVentas {
  totalVentas: number;
  totalPedidos: number;
  ticketPromedio: number;
  metodoPago: {
    CASH: number;
    TRANSFER: number;
    QR_CONSUMO: number;
  };
  porCategoria: Array<{
    categoria: string;
    total: number;
    cantidad: number;
  }>;
  topProductos: Array<{
    nombre: string;
    cantidad: number;
    total: number;
  }>;
  ventasPorHora: Array<{
    hora: number;
    cantidad: number;
    total: number;
  }>;
}

export default function ReportesAdminPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [reporte, setReporte] = useState<ReporteVentas | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarReporte();
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

  const cargarReporte = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const res = await fetch(`/api/pedidos?eventoId=${eventoSeleccionado}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        generarReporte(data.data.pedidos);
      }
    } catch (error) {
      console.error('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const generarReporte = (pedidos: any[]) => {
    const pedidosPagados = pedidos.filter(p => p.estadoPago === 'PAID');
    
    const totalVentas = pedidosPagados.reduce((sum, p) => sum + Number(p.total), 0);
    const totalPedidos = pedidosPagados.length;
    const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

    // Métodos de pago
    const metodoPago = {
      CASH: pedidosPagados.filter(p => p.metodoPago === 'CASH').reduce((sum, p) => sum + Number(p.total), 0),
      TRANSFER: pedidosPagados.filter(p => p.metodoPago === 'TRANSFER').reduce((sum, p) => sum + Number(p.total), 0),
      QR_CONSUMO: pedidosPagados.filter(p => p.metodoPago === 'QR_CONSUMO').reduce((sum, p) => sum + Number(p.total), 0),
    };

    // Por categoría (simulado)
    const porCategoria = [
      { categoria: 'Tragos', total: totalVentas * 0.6, cantidad: Math.floor(totalPedidos * 0.6) },
      { categoria: 'Botellas', total: totalVentas * 0.3, cantidad: Math.floor(totalPedidos * 0.3) },
      { categoria: 'Bebidas sin alcohol', total: totalVentas * 0.1, cantidad: Math.floor(totalPedidos * 0.1) },
    ];

    // Top productos (simulado - necesitarías datos reales de items)
    const topProductos = [
      { nombre: 'Fernet con Coca', cantidad: Math.floor(totalPedidos * 0.25), total: totalVentas * 0.25 },
      { nombre: 'Cerveza', cantidad: Math.floor(totalPedidos * 0.20), total: totalVentas * 0.20 },
      { nombre: 'Vodka', cantidad: Math.floor(totalPedidos * 0.15), total: totalVentas * 0.15 },
      { nombre: 'Ron', cantidad: Math.floor(totalPedidos * 0.10), total: totalVentas * 0.10 },
      { nombre: 'Gaseosa', cantidad: Math.floor(totalPedidos * 0.05), total: totalVentas * 0.05 },
    ];

    // Ventas por hora (simulado)
    const ventasPorHora = Array.from({ length: 24 }, (_, hora) => ({
      hora,
      cantidad: hora >= 20 && hora <= 3 ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 10),
      total: hora >= 20 && hora <= 3 ? Math.random() * 50000 + 10000 : Math.random() * 10000,
    }));

    setReporte({
      totalVentas,
      totalPedidos,
      ticketPromedio,
      metodoPago,
      porCategoria,
      topProductos,
      ventasPorHora,
    });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin')}
          className="text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-1 text-sm"
        >
          ← Volver al Dashboard
        </button>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-3">
          📊 Reportes y Análisis
        </h1>
      </div>

      {/* Selector de Evento */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 mb-6">
        <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
          🎪 Evento
        </label>
        <select
          value={eventoSeleccionado}
          onChange={(e) => setEventoSeleccionado(e.target.value)}
          className="w-full md:w-96 px-4 py-3 bg-[#0f1419] border-2 border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
        >
          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.nombre}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">⏳</div>
          Generando reporte...
        </div>
      ) : !reporte ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Selecciona un evento para ver el reporte</p>
        </div>
      ) : (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-green-300 uppercase">Ventas Totales</div>
                <div className="text-2xl">💰</div>
              </div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                ${reporte.totalVentas.toFixed(0)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-blue-300 uppercase">Pedidos</div>
                <div className="text-2xl">📋</div>
              </div>
              <div className="text-4xl font-bold text-white">{reporte.totalPedidos}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-purple-300 uppercase">Ticket Promedio</div>
                <div className="text-2xl">🎫</div>
              </div>
              <div className="text-4xl font-bold text-purple-400">
                ${reporte.ticketPromedio.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>💳</span> Métodos de Pago
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0f1419] rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">💵 Efectivo</div>
                <div className="text-2xl font-bold text-green-400">${reporte.metodoPago.CASH.toFixed(0)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {reporte.totalVentas > 0 ? ((reporte.metodoPago.CASH / reporte.totalVentas) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-[#0f1419] rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">🏦 Transferencia</div>
                <div className="text-2xl font-bold text-blue-400">${reporte.metodoPago.TRANSFER.toFixed(0)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {reporte.totalVentas > 0 ? ((reporte.metodoPago.TRANSFER / reporte.totalVentas) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-[#0f1419] rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">🎫 QR Consumo</div>
                <div className="text-2xl font-bold text-purple-400">${reporte.metodoPago.QR_CONSUMO.toFixed(0)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {reporte.totalVentas > 0 ? ((reporte.metodoPago.QR_CONSUMO / reporte.totalVentas) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Por Categoría */}
            <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🍹</span> Ventas por Categoría
              </h2>
              <div className="space-y-3">
                {reporte.porCategoria.map((cat) => (
                  <div key={cat.categoria} className="bg-[#0f1419] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold text-white">{cat.categoria}</div>
                      <div className="text-lg font-bold text-green-400">${cat.total.toFixed(0)}</div>
                    </div>
                    <div className="text-sm text-gray-400">{cat.cantidad} pedidos</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Productos */}
            <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🏆</span> Top 5 Productos
              </h2>
              <div className="space-y-3">
                {reporte.topProductos.map((prod, index) => (
                  <div key={prod.nombre} className="bg-[#0f1419] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-gray-500">#{index + 1}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{prod.nombre}</div>
                        <div className="text-sm text-gray-400">{prod.cantidad} unidades</div>
                      </div>
                      <div className="text-lg font-bold text-green-400">${prod.total.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
