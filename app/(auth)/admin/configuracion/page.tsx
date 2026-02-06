'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientDate } from '@/app/components/ClientDate';

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  activo: boolean;
  createdAt: string;
}

interface Caja {
  id: string;
  nombre: string;
  eventoId: string;
  evento: { nombre: string };
  activa: boolean;
}

interface Barra {
  id: string;
  nombre: string;
  eventoId: string;
  evento: { nombre: string };
  activa: boolean;
}

type SeccionActiva = 'eventos' | 'cajas' | 'barras' | 'app';

export default function ConfiguracionAdminPage() {
  const router = useRouter();
  const [seccionActiva, setSeccionActiva] = useState<SeccionActiva>('eventos');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const mostrarMensaje = (tipo: string, texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  useEffect(() => {
    // Verificar si es iOS
    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(checkIOS);

    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar el evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Verificar si ya está instalado (iOS)
    if ((navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // En iOS, mostrar instrucciones
      if (isIOSDevice) {
        mostrarMensaje('success', 'Para instalar en iOS:\n1. Toca el botón Compartir ⬆️\n2. Selecciona "Agregar a pantalla de inicio"');
        return;
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      mostrarMensaje('success', '¡App instalada correctamente!');
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3 mb-2">
              ⚙️ Configuración del Sistema
            </h1>
            <p className="text-gray-400 text-sm">Gestiona eventos, cajas y barras</p>
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

      {/* Tabs */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-2 mb-4 flex gap-2">
        <button
          onClick={() => setSeccionActiva('eventos')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            seccionActiva === 'eventos'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-[#0f1419]'
          }`}
        >
          🎪 Eventos
        </button>
        <button
          onClick={() => setSeccionActiva('cajas')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            seccionActiva === 'cajas'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-[#0f1419]'
          }`}
        >
          💰 Cajas
        </button>
        <button
          onClick={() => setSeccionActiva('barras')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            seccionActiva === 'barras'
              ? 'bg-green-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-[#0f1419]'
          }`}
        >
          🍹 Barras
        </button>
        <button
          onClick={() => setSeccionActiva('app')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            seccionActiva === 'app'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-[#0f1419]'
          }`}
        >
          📱 App
        </button>
      </div>

      {/* Contenido */}
      {seccionActiva === 'eventos' && <EventosSeccion mostrarMensaje={mostrarMensaje} />}
      {seccionActiva === 'cajas' && <CajasSeccion mostrarMensaje={mostrarMensaje} />}
      {seccionActiva === 'barras' && <BarrasSeccion mostrarMensaje={mostrarMensaje} />}
      {seccionActiva === 'app' && (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Configuración de la App</h2>
          
          <div className="space-y-6">
            {/* Información de la PWA */}
            <div className="bg-[#0f1419] border border-gray-700 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-5xl">📱</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Instalar como App</h3>
                  <p className="text-gray-400 mb-4">
                    Instala el Sistema de Barra en tu dispositivo para un acceso más rápido y una mejor experiencia.
                  </p>
                  
                  {isInstalled ? (
                    <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                      <p className="text-green-400 font-medium flex items-center gap-2">
                        <span className="text-2xl">✓</span>
                        <span>App instalada correctamente</span>
                      </p>
                    </div>
                  ) : (
                    <>
                      {deferredPrompt || isIOSDevice ? (
                        <button
                          onClick={handleInstall}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2"
                        >
                          <span className="text-xl">⬇️</span>
                          <span>Instalar App</span>
                        </button>
                      ) : (
                        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                          <p className="text-blue-400 text-sm">
                            La aplicación ya está disponible como PWA. Para instalarla, busca la opción "Instalar" o "Agregar a pantalla de inicio" en el menú de tu navegador.
                          </p>
                        </div>
                      )}
                      
                      {isIOSDevice && (
                        <div className="mt-4 bg-purple-900/20 border border-purple-600 rounded-lg p-4">
                          <p className="text-purple-400 font-medium mb-2">Instrucciones para iOS:</p>
                          <ol className="text-gray-300 text-sm space-y-1 ml-4 list-decimal">
                            <li>Toca el botón de compartir (⬆️)</li>
                            <li>Selecciona "Agregar a pantalla de inicio"</li>
                            <li>Toca "Agregar"</li>
                          </ol>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Beneficios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0f1419] border border-gray-700 rounded-lg p-4">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-bold text-white mb-1">Acceso Rápido</h4>
                <p className="text-gray-400 text-sm">
                  Abre la app directamente desde tu pantalla de inicio
                </p>
              </div>
              
              <div className="bg-[#0f1419] border border-gray-700 rounded-lg p-4">
                <div className="text-3xl mb-2">📴</div>
                <h4 className="font-bold text-white mb-1">Funciona Sin Internet</h4>
                <p className="text-gray-400 text-sm">
                  Algunas funciones disponibles offline
                </p>
              </div>
              
              <div className="bg-[#0f1419] border border-gray-700 rounded-lg p-4">
                <div className="text-3xl mb-2">🎨</div>
                <h4 className="font-bold text-white mb-1">Experiencia Nativa</h4>
                <p className="text-gray-400 text-sm">
                  Pantalla completa sin la barra del navegador
                </p>
              </div>
              
              <div className="bg-[#0f1419] border border-gray-700 rounded-lg p-4">
                <div className="text-3xl mb-2">🔔</div>
                <h4 className="font-bold text-white mb-1">Notificaciones</h4>
                <p className="text-gray-400 text-sm">
                  Recibe actualizaciones importantes (próximamente)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para Eventos
function EventosSeccion({ mostrarMensaje }: { mostrarMensaje: (tipo: string, texto: string) => void }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const res = await fetch('/api/eventos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setEventos(data.data);
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setEditando(null);
    setNombre('');
    setFecha(new Date().toISOString().split('T')[0]);
    setActivo(true);
    setMostrarModal(true);
  };

  const abrirModalEditar = (evento: Evento) => {
    setEditando(evento.id);
    setNombre(evento.nombre);
    setFecha(evento.fecha.split('T')[0]);
    setActivo(evento.activo);
    setMostrarModal(true);
  };

  const guardarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const url = editando ? `/api/eventos/${editando}` : '/api/eventos';
      const method = editando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre,
          fecha: new Date(fecha).toISOString(),
          activo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', editando ? 'Evento actualizado' : 'Evento creado');
        setMostrarModal(false);
        cargarEventos();
      } else {
        mostrarMensaje('error', data.error || 'Error al guardar evento');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (id: string, nuevoEstado: boolean) => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activo: nuevoEstado }),
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', `Evento ${nuevoEstado ? 'activado' : 'desactivado'}`);
        cargarEventos();
      } else {
        mostrarMensaje('error', data.error || 'Error al cambiar estado');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    }
  };

  return (
    <>
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Eventos</h2>
          <button
            onClick={abrirModalNuevo}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105"
          >
            + Nuevo Evento
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block rounded-full h-10 w-10 border-b-4 border-blue-500 mb-3"></div>
            <p className="text-gray-400 font-semibold">Cargando...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🎪</div>
            <p>No hay eventos creados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventos.map((evento) => (
              <div key={evento.id} className="bg-[#0f1419] border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">{evento.nombre}</h3>
                  <p className="text-sm text-gray-400">
                    📅 <ClientDate date={evento.fecha} format="full" />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    evento.activo 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {evento.activo ? '✓ Activo' : '○ Inactivo'}
                  </span>
                  <button
                    onClick={() => abrirModalEditar(evento)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => toggleActivo(evento.id, !evento.activo)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      evento.activo
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {evento.activo ? '⏸️ Desactivar' : '▶️ Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] border-2 border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editando ? '✏️ Editar Evento' : '+ Nuevo Evento'}
            </h2>
            
            <form onSubmit={guardarEvento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Fiesta de Verano 2026"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo-evento"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="activo-evento" className="text-white font-medium">
                  Evento activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Evento'}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Componente para Cajas (similar estructura, implementación en próximo mensaje si es necesario)
function CajasSeccion({ mostrarMensaje }: { mostrarMensaje: (tipo: string, texto: string) => void }) {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCajas();
  }, []);

  const cargarCajas = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const res = await fetch('/api/cajas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setCajas(data.data);
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar cajas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Cajas</h2>
        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105">
          + Nueva Caja
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500 mb-3"></div>
          <p className="text-gray-400 font-semibold">Cargando...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cajas.map((caja) => (
            <div key={caja.id} className="bg-[#0f1419] border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">{caja.nombre}</h3>
                <p className="text-sm text-gray-400">
                  🎪 {caja.evento.nombre} • {caja.activa ? '✓ Activa' : '○ Inactiva'}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  caja.activa 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {caja.activa ? '✓ Activa' : '○ Inactiva'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 Las cajas se crean automáticamente con los eventos desde el seed inicial
        </p>
      </div>
    </div>
  );
}

// Componente para Barras
function BarrasSeccion({ mostrarMensaje }: { mostrarMensaje: (tipo: string, texto: string) => void }) {
  const [barras, setBarras] = useState<Barra[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarBarras();
  }, []);

  const cargarBarras = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const res = await fetch('/api/barras', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setBarras(data.data);
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar barras');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Barras</h2>
        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105">
          + Nueva Barra
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500 mb-3"></div>
          <p className="text-gray-400 font-semibold">Cargando...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {barras.map((barra) => (
            <div key={barra.id} className="bg-[#0f1419] border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">{barra.nombre}</h3>
                <p className="text-sm text-gray-400">
                  🎪 {barra.evento.nombre} • {barra.activa ? '✓ Activa' : '○ Inactiva'}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  barra.activa 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {barra.activa ? '✓ Activa' : '○ Inactiva'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 Las barras se crean automáticamente con los eventos desde el seed inicial
        </p>
      </div>
    </div>
  );
}
