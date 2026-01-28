'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Componente {
  recetaId?: string;
  componenteId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  opcional?: boolean;
  grupoOpcion?: string;
}

interface Combo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  activo: boolean;
  componentesObligatorios: Componente[];
  gruposOpcionales: Record<string, Componente[]>;
}

interface ProductoBase {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
}

export default function CombosAdminPage() {
  const router = useRouter();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [productosBase, setProductosBase] = useState<ProductoBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Form modal
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Combos Botellas');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  
  // Componentes del combo
  const [componentesObligatorios, setComponentesObligatorios] = useState<Componente[]>([]);
  const [gruposOpcionales, setGruposOpcionales] = useState<Record<string, Componente[]>>({});
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      // Cargar combos
      const resCombos = await fetch('/api/combos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataCombos = await resCombos.json();
      if (dataCombos.success) {
        setCombos(dataCombos.data);
      }

      // Cargar productos BASE para usar como componentes
      const resProductos = await fetch('/api/productos?tipo=BASE', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataProductos = await resProductos.json();
      if (dataProductos.success) {
        setProductosBase(dataProductos.data);
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const abrirFormNuevo = () => {
    setEditando(null);
    setNombre('');
    setCodigo('');
    setPrecio('');
    setCategoria('Combos Botellas');
    setDescripcion('');
    setActivo(true);
    setComponentesObligatorios([]);
    setGruposOpcionales({});
    setMostrarForm(true);
  };

  const abrirFormEditar = (combo: Combo) => {
    setEditando(combo.id);
    setNombre(combo.nombre);
    setCodigo(combo.codigo);
    setPrecio(combo.precio.toString());
    setCategoria(combo.categoria || 'Combos Botellas');
    setDescripcion(combo.descripcion || '');
    setActivo(combo.activo);
    setComponentesObligatorios(combo.componentesObligatorios);
    setGruposOpcionales(combo.gruposOpcionales);
    setMostrarForm(true);
  };

  const agregarComponenteObligatorio = () => {
    if (productosBase.length === 0) return;
    const primerProducto = productosBase[0];
    setComponentesObligatorios([
      ...componentesObligatorios,
      {
        componenteId: primerProducto.id,
        codigo: primerProducto.codigo,
        nombre: primerProducto.nombre,
        cantidad: 1,
      },
    ]);
  };

  const eliminarComponenteObligatorio = (index: number) => {
    setComponentesObligatorios(componentesObligatorios.filter((_, i) => i !== index));
  };

  const actualizarComponenteObligatorio = (index: number, field: string, value: any) => {
    const nuevos = [...componentesObligatorios];
    if (field === 'componenteId') {
      const producto = productosBase.find(p => p.id === value);
      if (producto) {
        nuevos[index] = {
          ...nuevos[index],
          componenteId: value,
          codigo: producto.codigo,
          nombre: producto.nombre,
        };
      }
    } else {
      nuevos[index] = { ...nuevos[index], [field]: value };
    }
    setComponentesObligatorios(nuevos);
  };

  const agregarGrupoOpcional = () => {
    if (!nuevoGrupoNombre.trim()) {
      alert('Ingresa un nombre para el grupo');
      return;
    }
    if (gruposOpcionales[nuevoGrupoNombre]) {
      alert('Ya existe un grupo con ese nombre');
      return;
    }
    setGruposOpcionales({
      ...gruposOpcionales,
      [nuevoGrupoNombre]: [],
    });
    setNuevoGrupoNombre('');
  };

  const eliminarGrupoOpcional = (nombreGrupo: string) => {
    const nuevos = { ...gruposOpcionales };
    delete nuevos[nombreGrupo];
    setGruposOpcionales(nuevos);
  };

  const agregarComponenteAGrupo = (nombreGrupo: string) => {
    if (productosBase.length === 0) return;
    const primerProducto = productosBase[0];
    setGruposOpcionales({
      ...gruposOpcionales,
      [nombreGrupo]: [
        ...(gruposOpcionales[nombreGrupo] || []),
        {
          componenteId: primerProducto.id,
          codigo: primerProducto.codigo,
          nombre: primerProducto.nombre,
          cantidad: 1,
        },
      ],
    });
  };

  const eliminarComponenteDeGrupo = (nombreGrupo: string, index: number) => {
    setGruposOpcionales({
      ...gruposOpcionales,
      [nombreGrupo]: gruposOpcionales[nombreGrupo].filter((_, i) => i !== index),
    });
  };

  const actualizarComponenteDeGrupo = (nombreGrupo: string, index: number, field: string, value: any) => {
    const nuevosComponentes = [...gruposOpcionales[nombreGrupo]];
    if (field === 'componenteId') {
      const producto = productosBase.find(p => p.id === value);
      if (producto) {
        nuevosComponentes[index] = {
          ...nuevosComponentes[index],
          componenteId: value,
          codigo: producto.codigo,
          nombre: producto.nombre,
        };
      }
    } else {
      nuevosComponentes[index] = { ...nuevosComponentes[index], [field]: value };
    }
    setGruposOpcionales({
      ...gruposOpcionales,
      [nombreGrupo]: nuevosComponentes,
    });
  };

  const guardarCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !codigo || !precio || Number(precio) <= 0) {
      mostrarMensaje('error', 'Completa todos los campos correctamente');
      return;
    }

    if (componentesObligatorios.length === 0) {
      mostrarMensaje('error', 'Debes agregar al menos un componente obligatorio');
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const url = editando ? `/api/combos/${editando}` : '/api/combos';
      const method = editando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo,
          nombre,
          descripcion,
          precio: Number(precio),
          categoria,
          activo,
          componentesObligatorios,
          gruposOpcionales,
        }),
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', editando ? 'Combo actualizado' : 'Combo creado');
        setMostrarForm(false);
        cargarDatos();
      } else {
        mostrarMensaje('error', data.error || 'Error al guardar combo');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const eliminarCombo = async (id: string, nombre: string) => {
    if (!confirm(`¿Desactivar el combo "${nombre}"?`)) return;

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const res = await fetch(`/api/combos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', 'Combo desactivado');
        cargarDatos();
      } else {
        mostrarMensaje('error', data.error || 'Error al desactivar combo');
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 flex items-center gap-3 mb-2">
              🎁 Gestión de Combos
            </h1>
            <p className="text-gray-400 text-sm">Crea y edita combos con componentes y opciones</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={cargarDatos}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
              title="Recargar lista"
            >
              🔄 Recargar
            </button>
            <button
              onClick={abrirFormNuevo}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
            >
              + Nuevo Combo
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-lg p-3">
            <div className="text-sm text-pink-300 mb-1">Total Combos</div>
            <div className="text-2xl font-bold text-white">{combos.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-3">
            <div className="text-sm text-green-300 mb-1">Activos</div>
            <div className="text-2xl font-bold text-white">{combos.filter(c => c.activo).length}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-lg p-3">
            <div className="text-sm text-orange-300 mb-1">Productos BASE</div>
            <div className="text-2xl font-bold text-white">{productosBase.length}</div>
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

      {/* Lista de Combos */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <h3 className="text-lg font-bold text-white mb-4">
          Combos ({combos.length})
        </h3>

        {loading && !mostrarForm ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">⏳</div>
            Cargando combos...
          </div>
        ) : combos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🎁</div>
            <p>No hay combos creados</p>
            <button
              onClick={abrirFormNuevo}
              className="mt-4 text-pink-400 hover:text-pink-300 font-semibold"
            >
              + Crear tu primer combo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combos.map((combo) => (
              <div
                key={combo.id}
                className={`bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border-2 ${
                  combo.activo ? 'border-pink-500/30' : 'border-red-500/50'
                } rounded-xl p-4 hover:border-pink-500/50 transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white text-lg truncate">
                        {combo.nombre}
                      </h4>
                      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        🎁 COMBO
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{combo.codigo}</p>
                  </div>
                  {!combo.activo && (
                    <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-lg border border-red-500/30">
                      Inactivo
                    </span>
                  )}
                </div>

                {/* Receta */}
                <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-xs font-semibold text-purple-300 mb-2">📋 Receta:</p>
                  
                  {/* Obligatorios */}
                  {combo.componentesObligatorios.map((comp, idx) => (
                    <div key={idx} className="text-xs text-gray-300">
                      • {comp.cantidad}x {comp.nombre}
                    </div>
                  ))}
                  
                  {/* Opcionales */}
                  {Object.entries(combo.gruposOpcionales).map(([grupo, opciones]) => (
                    <div key={grupo} className="text-xs text-blue-300 mt-1">
                      + {opciones.map(o => `${o.cantidad}x ${o.nombre}`).join(' O ')}
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    ${combo.precio.toFixed(0)}
                  </div>
                  {combo.categoria && (
                    <div className="inline-block bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/30">
                      {combo.categoria}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => abrirFormEditar(combo)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => eliminarCombo(combo.id, combo.nombre)}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 text-sm shadow-md"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1a1f2e] border-2 border-gray-700 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editando ? 'Editar Combo' : 'Nuevo Combo'}
            </h2>
            
            <form onSubmit={guardarCombo} className="space-y-6">
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Smirnoff + 5 Speed/2 Jugos"
                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-pink-500"
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
                    placeholder="Ej: COMBO-SMI001"
                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-pink-500"
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
                    placeholder="50000"
                    step="1"
                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-pink-500"
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
                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="Combos Botellas">🎁 Combos Botellas</option>
                    <option value="Combos Tragos">🍸 Combos Tragos</option>
                    <option value="Combos Especiales">✨ Combos Especiales</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Incluye hielo y limón..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
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
                  Combo activo
                </label>
              </div>

              {/* Componentes Obligatorios */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">
                    Componentes Obligatorios
                  </h3>
                  <button
                    type="button"
                    onClick={agregarComponenteObligatorio}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                  >
                    + Agregar
                  </button>
                </div>

                {componentesObligatorios.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay componentes obligatorios</p>
                ) : (
                  <div className="space-y-2">
                    {componentesObligatorios.map((comp, index) => (
                      <div key={index} className="flex gap-2 items-center bg-[#0f1419] p-3 rounded-lg">
                        <select
                          value={comp.componenteId}
                          onChange={(e) => actualizarComponenteObligatorio(index, 'componenteId', e.target.value)}
                          className="flex-1 px-3 py-2 bg-[#1a1f2e] border border-gray-700 text-white rounded-lg text-sm"
                        >
                          {productosBase.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} ({p.codigo})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={comp.cantidad}
                          onChange={(e) => actualizarComponenteObligatorio(index, 'cantidad', Number(e.target.value))}
                          min="1"
                          className="w-20 px-3 py-2 bg-[#1a1f2e] border border-gray-700 text-white rounded-lg text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarComponenteObligatorio(index)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grupos Opcionales */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">
                    Grupos Opcionales (Cliente Elige)
                  </h3>
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={nuevoGrupoNombre}
                    onChange={(e) => setNuevoGrupoNombre(e.target.value)}
                    placeholder="Nombre del grupo (ej: acompañamiento)"
                    className="flex-1 px-4 py-2 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={agregarGrupoOpcional}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                  >
                    + Crear Grupo
                  </button>
                </div>

                {Object.keys(gruposOpcionales).length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay grupos opcionales</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(gruposOpcionales).map(([nombreGrupo, componentes]) => (
                      <div key={nombreGrupo} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-purple-300">
                            Grupo: {nombreGrupo}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => agregarComponenteAGrupo(nombreGrupo)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded text-xs"
                            >
                              + Opción
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminarGrupoOpcional(nombreGrupo)}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded text-xs"
                            >
                              Eliminar Grupo
                            </button>
                          </div>
                        </div>

                        {componentes.length === 0 ? (
                          <p className="text-gray-500 text-sm">No hay opciones en este grupo</p>
                        ) : (
                          <div className="space-y-2">
                            {componentes.map((comp, index) => (
                              <div key={index} className="flex gap-2 items-center bg-[#0f1419] p-2 rounded">
                                <select
                                  value={comp.componenteId}
                                  onChange={(e) => actualizarComponenteDeGrupo(nombreGrupo, index, 'componenteId', e.target.value)}
                                  className="flex-1 px-2 py-1 bg-[#1a1f2e] border border-gray-700 text-white rounded text-sm"
                                >
                                  {productosBase.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.nombre}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  value={comp.cantidad}
                                  onChange={(e) => actualizarComponenteDeGrupo(nombreGrupo, index, 'cantidad', Number(e.target.value))}
                                  min="1"
                                  className="w-16 px-2 py-1 bg-[#1a1f2e] border border-gray-700 text-white rounded text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => eliminarComponenteDeGrupo(nombreGrupo, index)}
                                  className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  {loading ? 'Guardando...' : editando ? 'Actualizar Combo' : 'Crear Combo'}
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
    </div>
  );
}
