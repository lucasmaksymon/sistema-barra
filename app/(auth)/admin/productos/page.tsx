'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Producto {
  id: string;
  nombre: string;
  codigo: string;
  precio: number;
  categoria: string | null;
  activo: boolean;
  createdAt: string;
  tipo?: 'SIMPLE' | 'BASE' | 'COMPUESTO';
  recetaInfo?: {
    componentesObligatorios: Array<{
      componenteId: string;
      codigo: string;
      nombre: string;
      cantidad: number;
    }>;
    gruposOpcionales: Record<string, Array<{
      componenteId: string;
      codigo: string;
      nombre: string;
      cantidad: number;
    }>>;
  };
}

export default function ProductosAdminPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Form
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Tragos');
  const [activo, setActivo] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState<string>('Todos');

  const categorias = ['Todas', 'Tragos', 'Botellas', 'Bebidas sin alcohol', 'Combos Botellas', 'Vodkas', 'Gin', 'Fernet', 'Licores', 'Whisky', 'Espumantes', 'Energizantes', 'Jugos', 'Gaseosas'];
  const tipos = ['Todos', 'SIMPLE', 'BASE', 'COMBO'];

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      // Incluir información de recetas para combos
      const res = await fetch('/api/productos?incluirReceta=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setProductos(data.data);
      } else {
        mostrarMensaje('error', data.error || 'Error al cargar productos');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const abrirFormNuevo = () => {
    setEditando(null);
    setNombre('');
    setCodigo('');
    setPrecio('');
    setCategoria('Tragos');
    setActivo(true);
    setMostrarForm(true);
  };

  const abrirFormEditar = (producto: Producto) => {
    setEditando(producto.id);
    setNombre(producto.nombre);
    setCodigo(producto.codigo);
    setPrecio(producto.precio.toString());
    setCategoria(producto.categoria || 'Tragos');
    setActivo(producto.activo);
    setMostrarForm(true);
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !codigo || !precio || Number(precio) <= 0) {
      mostrarMensaje('error', 'Completa todos los campos correctamente');
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const url = editando ? `/api/productos/${editando}` : '/api/productos';
      const method = editando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre,
          codigo,
          precio: Number(precio),
          categoria,
          activo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', editando ? 'Producto actualizado' : 'Producto creado');
        setMostrarForm(false);
        cargarProductos();
      } else {
        mostrarMensaje('error', data.error || 'Error al guardar producto');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el producto "${nombre}"?`)) return;

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', 'Producto eliminado');
        cargarProductos();
      } else {
        mostrarMensaje('error', data.error || 'Error al eliminar producto');
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

  const productosFiltrados = productos.filter((producto) => {
    const coincideBusqueda = 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideCategoria = 
      filtroCategoria === 'Todas' || 
      producto.categoria === filtroCategoria;
    
    const coincideTipo = 
      filtroTipo === 'Todos' || 
      producto.tipo === filtroTipo;
    
    return coincideBusqueda && coincideCategoria && coincideTipo;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center gap-3 mb-2">
              🍹 Gestión de Productos
            </h1>
            <p className="text-gray-400 text-sm">Administra tu catálogo de productos, combos e insumos</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={cargarProductos}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
              title="Recargar lista"
            >
              🔄 Recargar
            </button>
            <button
              onClick={abrirFormNuevo}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
            >
              + Nuevo Producto
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-3">
            <div className="text-sm text-blue-300 mb-1">Total Productos</div>
            <div className="text-2xl font-bold text-white">{productos.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-3">
            <div className="text-sm text-green-300 mb-1">🛒 Simples</div>
            <div className="text-2xl font-bold text-white">{productos.filter(p => p.tipo === 'SIMPLE' || !p.tipo).length}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-lg p-3">
            <div className="text-sm text-orange-300 mb-1">📦 Insumos</div>
            <div className="text-2xl font-bold text-white">{productos.filter(p => p.tipo === 'BASE').length}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-3">
            <div className="text-sm text-purple-300 mb-1">🎁 Combos</div>
            <div className="text-2xl font-bold text-white">{productos.filter(p => p.tipo === 'COMPUESTO').length}</div>
          </div>
        </div>
      </div>

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

      {/* Filtros */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="🔍 Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo === 'COMBO' ? 'COMPUESTO' : tipo}>
                  {tipo === 'Todos' && '📦 Todos los tipos'}
                  {tipo === 'SIMPLE' && '🛒 SIMPLE (Venta directa)'}
                  {tipo === 'BASE' && '📦 BASE (Insumos)'}
                  {tipo === 'COMBO' && '🎁 COMBO (Botellas)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formulario Modal */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] border-2 border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editando ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            
            <form onSubmit={guardarProducto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Fernet con Coca"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej: FERNET-001"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Precio *
                </label>
                <input
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="5000"
                  step="0.01"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Tragos">🍸 Tragos</option>
                  <option value="Botellas">🍾 Botellas</option>
                  <option value="Bebidas sin alcohol">🥤 Bebidas sin alcohol</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="activo" className="text-white font-medium">
                  Producto activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Producto'}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Productos */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Productos ({productosFiltrados.length})
          </h3>
        </div>

        {loading && !mostrarForm ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-gray-400 font-semibold">Cargando productos...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <p>No hay productos que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                className={`bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border-2 ${
                  producto.activo ? 'border-gray-700' : 'border-red-500/50'
                } rounded-xl p-4 hover:border-blue-500/50 transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white text-lg truncate">
                        {producto.nombre}
                      </h4>
                      {producto.tipo && (
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          producto.tipo === 'COMPUESTO' 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : producto.tipo === 'BASE'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {producto.tipo === 'COMPUESTO' && '🎁'}
                          {producto.tipo === 'BASE' && '📦'}
                          {producto.tipo === 'SIMPLE' && '🛒'}
                          {producto.tipo || 'SIMPLE'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{producto.codigo}</p>
                  </div>
                  {!producto.activo && (
                    <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-lg border border-red-500/30">
                      Inactivo
                    </span>
                  )}
                </div>

                {/* Mostrar receta si es COMPUESTO */}
                {producto.tipo === 'COMPUESTO' && producto.recetaInfo && (
                  <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p className="text-xs font-semibold text-purple-300 mb-2">📋 Receta:</p>
                    
                    {/* Componentes obligatorios */}
                    {producto.recetaInfo.componentesObligatorios.length > 0 && (
                      <div className="mb-2">
                        {producto.recetaInfo.componentesObligatorios.map((comp) => (
                          <div key={comp.componenteId} className="text-xs text-gray-300">
                            • {comp.cantidad}x {comp.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Grupos opcionales */}
                    {Object.keys(producto.recetaInfo.gruposOpcionales).length > 0 && (
                      <div>
                        {Object.entries(producto.recetaInfo.gruposOpcionales).map(([grupo, opciones]) => (
                          <div key={grupo} className="text-xs text-blue-300 mt-1">
                            + {opciones.map(o => `${o.cantidad}x ${o.nombre}`).join(' O ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Indicador para productos BASE */}
                {producto.tipo === 'BASE' && (
                  <div className="mb-3 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-xs text-orange-300">
                      ℹ️ Insumo para combos (no se vende solo)
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    ${producto.precio.toFixed(0)}
                  </div>
                  {producto.categoria && (
                    <div className="inline-block bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/30">
                      {producto.categoria}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => abrirFormEditar(producto)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 text-sm shadow-md flex items-center justify-center gap-2"
                    title="Editar producto"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => eliminarProducto(producto.id, producto.nombre)}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 text-sm shadow-md"
                    title="Eliminar producto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
