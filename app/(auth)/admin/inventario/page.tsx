'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StockItem {
  id: string;
  producto: {
    id: string;
    nombre: string;
    codigo: string;
    tipo?: string;
  };
  location: {
    id: string;
    nombre: string;
    tipo: string;
  };
  cantidad: number;
  reservado: number;
  disponible: number;
  umbralBajo: number | null;
}

interface Evento {
  id: string;
  nombre: string;
}

export default function InventarioAdminPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // CONTROL DE STOCK DESHABILITADO
  const STOCK_DESHABILITADO = true;
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroAlerta, setFiltroAlerta] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  
  // Modal para ajustar stock
  const [mostrarModalAjuste, setMostrarModalAjuste] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<StockItem | null>(null);
  const [tipoAjuste, setTipoAjuste] = useState<'entrada' | 'salida'>('entrada');
  const [cantidadAjuste, setCantidadAjuste] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  
  // Modal para umbral
  const [mostrarModalUmbral, setMostrarModalUmbral] = useState(false);
  const [nuevoUmbral, setNuevoUmbral] = useState('');

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarStock();
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

  const cargarStock = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const res = await fetch(`/api/inventario/stock?eventoId=${eventoSeleccionado}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setStock(data.data);
      } else {
        mostrarMensaje('error', data.error || 'Error al cargar stock');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (tipo: string, texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const abrirModalAjuste = (item: StockItem) => {
    setItemSeleccionado(item);
    setTipoAjuste('entrada');
    setCantidadAjuste('');
    setMotivoAjuste('');
    setMostrarModalAjuste(true);
  };

  const abrirModalUmbral = (item: StockItem) => {
    setItemSeleccionado(item);
    setNuevoUmbral((item.umbralBajo ?? '').toString());
    setMostrarModalUmbral(true);
  };

  const ajustarStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemSeleccionado || !cantidadAjuste || !motivoAjuste) {
      mostrarMensaje('error', 'Completa todos los campos');
      return;
    }

    const cantidad = parseInt(cantidadAjuste);
    if (isNaN(cantidad) || cantidad <= 0) {
      mostrarMensaje('error', 'La cantidad debe ser un número positivo');
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const res = await fetch('/api/inventario/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productoId: itemSeleccionado.producto.id,
          locationId: itemSeleccionado.location.id,
          cantidad: tipoAjuste === 'entrada' ? cantidad : -cantidad,
          tipo: tipoAjuste,
          motivo: motivoAjuste,
        }),
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', 'Stock ajustado correctamente');
        setMostrarModalAjuste(false);
        cargarStock();
      } else {
        mostrarMensaje('error', data.error || 'Error al ajustar stock');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const actualizarUmbral = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemSeleccionado) return;

    const umbral = nuevoUmbral === '' ? null : parseInt(nuevoUmbral);
    if (nuevoUmbral !== '' && (isNaN(umbral!) || umbral! < 0)) {
      mostrarMensaje('error', 'El umbral debe ser un número positivo o vacío');
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const res = await fetch('/api/inventario/stock', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stockId: itemSeleccionado.id,
          umbralBajo: umbral,
        }),
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', 'Umbral actualizado');
        setMostrarModalUmbral(false);
        cargarStock();
      } else {
        mostrarMensaje('error', data.error || 'Error al actualizar umbral');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const stockFiltrado = stock.filter((item) => {
    const coincideBusqueda = 
      item.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.location.nombre.toLowerCase().includes(busqueda.toLowerCase());
    
    let coincideAlerta = true;
    if (filtroAlerta === 'bajo') {
      coincideAlerta = item.umbralBajo !== null && item.disponible <= item.umbralBajo;
    } else if (filtroAlerta === 'agotado') {
      coincideAlerta = item.disponible === 0;
    }
    
    let coincideTipo = true;
    if (filtroTipo !== 'todos') {
      coincideTipo = item.producto.tipo === filtroTipo;
    }
    
    return coincideBusqueda && coincideAlerta && coincideTipo;
  });

  const estadisticas = {
    total: stock.length,
    bajo: stock.filter(s => s.umbralBajo !== null && s.disponible <= s.umbralBajo).length,
    agotado: stock.filter(s => s.disponible === 0).length,
    valorTotal: stock.reduce((sum, s) => sum + (s.cantidad * 100), 0), // Aproximado
  };

  const getEstadoColor = (item: StockItem) => {
    if (item.disponible === 0) return 'border-red-500 bg-red-500/10';
    if (item.umbralBajo !== null && item.disponible <= item.umbralBajo) return 'border-yellow-500 bg-yellow-500/10';
    return 'border-gray-700 bg-[#0f1419]';
  };

  const getEstadoBadge = (item: StockItem) => {
    if (item.disponible === 0) {
      return <span className="bg-red-500/20 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/30 font-semibold">Agotado</span>;
    }
    if (item.umbralBajo !== null && item.disponible <= item.umbralBajo) {
      return <span className="bg-yellow-500/20 text-yellow-400 text-xs px-3 py-1 rounded-full border border-yellow-500/30 font-semibold">Stock Bajo</span>;
    }
    return <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30 font-semibold">OK</span>;
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 flex items-center gap-3 mb-2">
              📦 Gestión de Inventario
            </h1>
            <p className="text-gray-400 text-sm">Administra el stock de todos tus productos</p>
          </div>
          <button
            onClick={cargarStock}
            disabled={!eventoSeleccionado || loading}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
            title="Recargar inventario"
          >
            🔄 Recargar
          </button>
        </div>
      </div>

      {/* Aviso de Stock Deshabilitado */}
      {STOCK_DESHABILITADO && (
        <div className="mb-4 p-6 rounded-xl border-2 bg-yellow-500/10 border-yellow-500/50">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚠️</span>
            <h2 className="text-xl font-bold text-yellow-400">Control de Stock DESHABILITADO</h2>
          </div>
          <p className="text-yellow-300 text-sm ml-11">
            El sistema de control de inventario está temporalmente deshabilitado. Los pedidos no validarán ni actualizarán stock.
            Esta página muestra datos históricos solamente.
          </p>
        </div>
      )}

      {/* Mensaje */}
      {mensaje.texto && (
        <div
          className={`mb-4 p-4 rounded-xl border-2 ${
            mensaje.tipo === 'success'
              ? 'bg-green-500/10 border-green-500/50 text-green-400'
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Selector de Evento */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 mb-4">
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
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-blue-300 uppercase">Total Items</div>
            <div className="text-2xl">📦</div>
          </div>
          <div className="text-4xl font-bold text-white">{estadisticas.total}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-yellow-300 uppercase">Stock Bajo</div>
            <div className="text-2xl">⚠️</div>
          </div>
          <div className="text-4xl font-bold text-yellow-400">{estadisticas.bajo}</div>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 border-2 border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-red-300 uppercase">Agotados</div>
            <div className="text-2xl">🚨</div>
          </div>
          <div className="text-4xl font-bold text-red-400">{estadisticas.agotado}</div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-green-300 uppercase">En Stock</div>
            <div className="text-2xl">✅</div>
          </div>
          <div className="text-4xl font-bold text-green-400">
            {estadisticas.total - estadisticas.agotado}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="🔍 Buscar por producto o ubicación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">📦 Todos los tipos</option>
              <option value="BASE">📦 BASE (Insumos)</option>
              <option value="SIMPLE">🛒 SIMPLE (Individuales)</option>
            </select>
          </div>
          <div>
            <select
              value={filtroAlerta}
              onChange={(e) => setFiltroAlerta(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">✅ Todos</option>
              <option value="bajo">⚠️ Stock bajo</option>
              <option value="agotado">🚨 Agotados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Stock */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Stock Disponible ({stockFiltrado.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">⏳</div>
            Cargando inventario...
          </div>
        ) : stockFiltrado.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <p>No hay productos que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stockFiltrado.map((item) => (
              <div
                key={item.id}
                className={`border-2 rounded-xl p-4 transition-all ${getEstadoColor(item)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white text-lg">
                        {item.producto.nombre}
                      </h4>
                      {item.producto.tipo && (
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          item.producto.tipo === 'BASE'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {item.producto.tipo === 'BASE' ? '📦 BASE' : '🛒 SIMPLE'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {item.producto.codigo} • {item.location.nombre}
                    </p>
                  </div>
                  {getEstadoBadge(item)}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0f1419] rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Total</div>
                    <div className="text-2xl font-bold text-white">{item.cantidad}</div>
                  </div>

                  <div className="bg-[#0f1419] rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Reservado</div>
                    <div className="text-2xl font-bold text-yellow-400">{item.reservado}</div>
                  </div>

                  <div className="bg-[#0f1419] rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Disponible</div>
                    <div className={`text-2xl font-bold ${
                      item.disponible === 0 ? 'text-red-400' : 
                      item.umbralBajo !== null && item.disponible <= item.umbralBajo ? 'text-yellow-400' : 
                      'text-green-400'
                    }`}>
                      {item.disponible}
                    </div>
                  </div>

                  <div className="bg-[#0f1419] rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Umbral</div>
                    <div className="text-2xl font-bold text-gray-400">
                      {item.umbralBajo ?? '-'}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => abrirModalAjuste(item)}
                    disabled={STOCK_DESHABILITADO}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:transform-none text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    📝 Ajustar Stock
                  </button>
                  <button
                    onClick={() => abrirModalUmbral(item)}
                    disabled={STOCK_DESHABILITADO}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:transform-none text-sm shadow-md"
                    title="Cambiar umbral de alerta"
                  >
                    ⚙️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajustar Stock */}
      {mostrarModalAjuste && itemSeleccionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] border-2 border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              📝 Ajustar Stock
            </h2>
            
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-white font-semibold">{itemSeleccionado.producto.nombre}</p>
              <p className="text-sm text-gray-400">{itemSeleccionado.producto.codigo}</p>
              <p className="text-sm text-gray-400 mt-1">
                📍 {itemSeleccionado.location.nombre}
              </p>
              <div className="mt-2 text-sm">
                <span className="text-gray-400">Stock actual: </span>
                <span className="text-white font-bold">{itemSeleccionado.cantidad}</span>
                <span className="text-gray-400"> (Disponible: </span>
                <span className="text-green-400 font-bold">{itemSeleccionado.disponible}</span>
                <span className="text-gray-400">)</span>
              </div>
            </div>

            <form onSubmit={ajustarStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Ajuste *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoAjuste('entrada')}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      tipoAjuste === 'entrada'
                        ? 'bg-green-600 text-white border-2 border-green-400'
                        : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    ➕ Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoAjuste('salida')}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      tipoAjuste === 'salida'
                        ? 'bg-red-600 text-white border-2 border-red-400'
                        : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    ➖ Salida
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  value={cantidadAjuste}
                  onChange={(e) => setCantidadAjuste(e.target.value)}
                  placeholder="Ej: 10"
                  min="1"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Motivo *
                </label>
                <input
                  type="text"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  placeholder="Ej: Compra de mercadería, rotura, ajuste de inventario"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400">
                  Stock {tipoAjuste === 'entrada' ? 'nuevo' : 'resultante'}:
                  <span className={`ml-2 font-bold ${
                    tipoAjuste === 'entrada' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {tipoAjuste === 'entrada' 
                      ? itemSeleccionado.cantidad + parseInt(cantidadAjuste || '0')
                      : itemSeleccionado.cantidad - parseInt(cantidadAjuste || '0')
                    }
                  </span>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 font-bold py-3 px-6 rounded-lg transition-all ${
                    tipoAjuste === 'entrada'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500'
                  } disabled:from-gray-700 disabled:to-gray-700 text-white`}
                >
                  {loading ? 'Ajustando...' : tipoAjuste === 'entrada' ? '✓ Agregar Stock' : '✓ Restar Stock'}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModalAjuste(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Umbral */}
      {mostrarModalUmbral && itemSeleccionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] border-2 border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              ⚙️ Configurar Umbral de Alerta
            </h2>
            
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-white font-semibold">{itemSeleccionado.producto.nombre}</p>
              <p className="text-sm text-gray-400">{itemSeleccionado.producto.codigo}</p>
              <p className="text-sm text-gray-400 mt-1">
                Umbral actual: <span className="text-white font-semibold">{itemSeleccionado.umbralBajo ?? 'No definido'}</span>
              </p>
            </div>

            <form onSubmit={actualizarUmbral} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nuevo Umbral (dejar vacío para desactivar alertas)
                </label>
                <input
                  type="number"
                  value={nuevoUmbral}
                  onChange={(e) => setNuevoUmbral(e.target.value)}
                  placeholder="Ej: 10"
                  min="0"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Recibirás una alerta cuando el stock disponible sea menor o igual a este valor
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  {loading ? 'Actualizando...' : '✓ Actualizar'}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModalUmbral(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
