'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientDate } from '@/app/components/ClientDate';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'CAJA' | 'BARRA';
  activo: boolean;
  createdAt: string;
}

export default function UsuariosAdminPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Form
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'ADMIN' | 'CAJA' | 'BARRA'>('CAJA');
  const [activo, setActivo] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const res = await fetch('/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setUsuarios(data.data);
      } else {
        mostrarMensaje('error', data.error || 'Error al cargar usuarios');
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
    setEmail('');
    setPassword('');
    setRol('CAJA');
    setActivo(true);
    setMostrarForm(true);
  };

  const abrirFormEditar = (usuario: Usuario) => {
    setEditando(usuario.id);
    setNombre(usuario.nombre);
    setEmail(usuario.email);
    setPassword('');
    setRol(usuario.rol);
    setActivo(usuario.activo);
    setMostrarForm(true);
  };

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !email || (!editando && !password)) {
      mostrarMensaje('error', 'Completa todos los campos requeridos');
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const url = editando ? `/api/usuarios/${editando}` : '/api/usuarios';
      const method = editando ? 'PUT' : 'POST';

      const body: any = { nombre, email, rol, activo };
      if (password) body.password = password;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', editando ? 'Usuario actualizado' : 'Usuario creado');
        setMostrarForm(false);
        cargarUsuarios();
      } else {
        mostrarMensaje('error', data.error || 'Error al guardar usuario');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el usuario "${nombre}"?`)) return;

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', 'Usuario eliminado');
        cargarUsuarios();
      } else {
        mostrarMensaje('error', data.error || 'Error al eliminar usuario');
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

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const coincideBusqueda = 
      usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideRol = filtroRol === 'Todos' || usuario.rol === filtroRol;
    
    return coincideBusqueda && coincideRol;
  });

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'ADMIN': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'CAJA': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'BARRA': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRolEmoji = (rol: string) => {
    switch (rol) {
      case 'ADMIN': return '👨‍💼';
      case 'CAJA': return '💰';
      case 'BARRA': return '🍹';
      default: return '👤';
    }
  };

  const estadisticas = {
    total: usuarios.length,
    admin: usuarios.filter(u => u.rol === 'ADMIN').length,
    caja: usuarios.filter(u => u.rol === 'CAJA').length,
    barra: usuarios.filter(u => u.rol === 'BARRA').length,
    activos: usuarios.filter(u => u.activo).length,
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-1 text-sm"
          >
            ← Volver al Dashboard
          </button>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400 flex items-center gap-3">
            👥 Gestión de Usuarios
          </h1>
        </div>
        <button
          onClick={abrirFormNuevo}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg"
        >
          + Nuevo Usuario
        </button>
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

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/30 rounded-xl p-4">
          <div className="text-xs text-purple-300 uppercase mb-1">Total</div>
          <div className="text-3xl font-bold text-white">{estadisticas.total}</div>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 border-2 border-red-500/30 rounded-xl p-4">
          <div className="text-xs text-red-300 uppercase mb-1">Admins</div>
          <div className="text-3xl font-bold text-white">{estadisticas.admin}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/30 rounded-xl p-4">
          <div className="text-xs text-blue-300 uppercase mb-1">Cajeros</div>
          <div className="text-3xl font-bold text-white">{estadisticas.caja}</div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/30 rounded-xl p-4">
          <div className="text-xs text-green-300 uppercase mb-1">Bartenders</div>
          <div className="text-3xl font-bold text-white">{estadisticas.barra}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/30 rounded-xl p-4">
          <div className="text-xs text-yellow-300 uppercase mb-1">Activos</div>
          <div className="text-3xl font-bold text-white">{estadisticas.activos}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="🔍 Buscar usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos los roles</option>
              <option value="ADMIN">👨‍💼 Admin</option>
              <option value="CAJA">💰 Caja</option>
              <option value="BARRA">🍹 Barra</option>
            </select>
          </div>
        </div>
      </div>

      {/* Formulario Modal */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] border-2 border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            
            <form onSubmit={guardarUsuario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña {editando ? '(dejar vacío para no cambiar)' : '*'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña segura"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required={!editando}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rol *
                </label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as 'ADMIN' | 'CAJA' | 'BARRA')}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ADMIN">👨‍💼 Admin - Acceso total</option>
                  <option value="CAJA">💰 Caja - Crear pedidos</option>
                  <option value="BARRA">🍹 Barra - Entregar pedidos</option>
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
                  Usuario activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Usuario'}
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

      {/* Lista de Usuarios */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Usuarios ({usuariosFiltrados.length})
          </h3>
        </div>

        {loading && !mostrarForm ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">⏳</div>
            Cargando usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>No hay usuarios que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuariosFiltrados.map((usuario) => (
              <div
                key={usuario.id}
                className={`bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border-2 ${
                  usuario.activo ? 'border-gray-700' : 'border-red-500/50'
                } rounded-xl p-4 hover:border-blue-500/50 transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl">{getRolEmoji(usuario.rol)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-lg truncate">
                        {usuario.nombre}
                      </h4>
                      <p className="text-sm text-gray-400 truncate">{usuario.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRolColor(usuario.rol)}`}>
                    {usuario.rol}
                  </span>
                  {!usuario.activo && (
                    <span className="ml-2 inline-block bg-red-500/20 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/30">
                      Inactivo
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  Creado: <ClientDate date={usuario.createdAt} format="short" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => abrirFormEditar(usuario)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => eliminarUsuario(usuario.id, usuario.nombre)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
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
