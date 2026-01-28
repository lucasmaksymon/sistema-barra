'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Evento {
  id: string;
  nombre: string;
}

interface Pedido {
  id: string;
  codigo: string;
  total: number;
  metodoPago: string;
  estadoPago: string;
  createdAt: string;
  fechaPago: string | null;
  caja: { nombre: string };
  cajero: { nombre: string };
}

export default function TransaccionesAdminPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarPedidos();
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

  const cargarPedidos = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const res = await fetch(`/api/pedidos?eventoId=${eventoSeleccionado}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setPedidos(data.data.pedidos);
      }
    } catch (error) {
      console.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const coincideBusqueda = 
      pedido.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.cajero.nombre.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideMetodo = filtroMetodo === 'Todos' || pedido.metodoPago === filtroMetodo;
    const coincideEstado = filtroEstado === 'Todos' || pedido.estadoPago === filtroEstado;
    
    return coincideBusqueda && coincideMetodo && coincideEstado;
  });

  const estadisticas = {
    total: pedidos.filter(p => p.estadoPago === 'PAID').reduce((sum, p) => sum + Number(p.total), 0),
    pagados: pedidos.filter(p => p.estadoPago === 'PAID').length,
    pendientes: pedidos.filter(p => p.estadoPago === 'PENDING_PAYMENT').length,
    rechazados: pedidos.filter(p => p.estadoPago === 'PAYMENT_REJECTED').length,
  };

  const getMetodoColor = (metodo: string) => {
    switch (metodo) {
      case 'CASH': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'TRANSFER': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'QR_CONSUMO': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PAID': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING_PAYMENT': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'PAYMENT_REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getMetodoNombre = (metodo: string) => {
    switch (metodo) {
      case 'CASH': return '💵 Efectivo';
      case 'TRANSFER': return '🏦 Transferencia';
      case 'QR_CONSUMO': return '🎫 QR Consumo';
      default: return metodo;
    }
  };

  const getEstadoNombre = (estado: string) => {
    switch (estado) {
      case 'PAID': return 'Pagado';
      case 'PENDING_PAYMENT': return 'Pendiente';
      case 'PAYMENT_REJECTED': return 'Rechazado';
      default: return estado;
    }
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
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 flex items-center gap-3">
          💳 Historial de Transacciones
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-green-300 uppercase">Total Cobrado</div>
            <div className="text-2xl">💰</div>
          </div>
          <div className="text-4xl font-bold text-green-400">${estadisticas.total.toFixed(0)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-blue-300 uppercase">Pagados</div>
            <div className="text-2xl">✅</div>
          </div>
          <div className="text-4xl font-bold text-white">{estadisticas.pagados}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-yellow-300 uppercase">Pendientes</div>
            <div className="text-2xl">⏳</div>
          </div>
          <div className="text-4xl font-bold text-yellow-400">{estadisticas.pendientes}</div>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 border-2 border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-red-300 uppercase">Rechazados</div>
            <div className="text-2xl">❌</div>
          </div>
          <div className="text-4xl font-bold text-red-400">{estadisticas.rechazados}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="🔍 Buscar por código o cajero..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos los métodos</option>
              <option value="CASH">💵 Efectivo</option>
              <option value="TRANSFER">🏦 Transferencia</option>
              <option value="QR_CONSUMO">🎫 QR Consumo</option>
            </select>
          </div>
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos los estados</option>
              <option value="PAID">✅ Pagados</option>
              <option value="PENDING_PAYMENT">⏳ Pendientes</option>
              <option value="PAYMENT_REJECTED">❌ Rechazados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Transacciones */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Transacciones ({pedidosFiltrados.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">⏳</div>
            Cargando transacciones...
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">💳</div>
            <p>No hay transacciones que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidosFiltrados.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border-2 border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-white text-lg">{pedido.codigo}</h4>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(pedido.estadoPago)}`}>
                        {getEstadoNombre(pedido.estadoPago)}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getMetodoColor(pedido.metodoPago)}`}>
                        {getMetodoNombre(pedido.metodoPago)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {pedido.caja.nombre} • {pedido.cajero.nombre}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Creado: {new Date(pedido.createdAt).toLocaleString()}
                      {pedido.fechaPago && (
                        <> • Pagado: {new Date(pedido.fechaPago).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-400">
                      ${Number(pedido.total).toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
