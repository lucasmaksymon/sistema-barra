'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ClientDate } from '@/app/components/ClientDate';

interface QRConsumo {
  id: string;
  codigo: string;
  qrToken: string;
  montoInicial: number;
  saldoActual: number;
  estado: string;
  nombreCliente: string | null;
  notas: string | null;
  createdAt: string;
  evento: {
    nombre: string;
  };
  creadoPor: {
    nombre: string;
  };
}

interface Evento {
  id: string;
  nombre: string;
}

export default function AdminQRConsumoPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [qrConsumos, setQrConsumos] = useState<QRConsumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Form para crear nuevo QR
  const [mostrarForm, setMostrarForm] = useState(false);
  const [montoInicial, setMontoInicial] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [notas, setNotas] = useState('');
  const [qrCreado, setQrCreado] = useState<any>(null);
  
  // Para visualizar QR existente
  const [qrSeleccionado, setQrSeleccionado] = useState<QRConsumo | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarQRConsumos();
    }
  }, [eventoSeleccionado]);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const resEventos = await fetch('/api/eventos?activo=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataEventos = await resEventos.json();
      if (dataEventos.success && dataEventos.data.length > 0) {
        setEventos(dataEventos.data);
        setEventoSeleccionado(dataEventos.data[0].id);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const cargarQRConsumos = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const res = await fetch(`/api/qr-consumo?eventoId=${eventoSeleccionado}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setQrConsumos(data.data.qrConsumos);
      } else {
        mostrarMensaje('error', data.error || 'Error al cargar QR de consumo');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const crearQRConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!montoInicial || Number(montoInicial) <= 0) {
      mostrarMensaje('error', 'Ingresa un monto válido');
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const res = await fetch('/api/qr-consumo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: eventoSeleccionado,
          montoInicial: Number(montoInicial),
          nombreCliente: nombreCliente || undefined,
          notas: notas || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setQrCreado(data.data);
        mostrarMensaje('success', 'QR de consumo creado exitosamente');
        
        // Limpiar form
        setMontoInicial('');
        setNombreCliente('');
        setNotas('');
        setMostrarForm(false);
        
        // Recargar lista
        cargarQRConsumos();
      } else {
        mostrarMensaje('error', data.error || 'Error al crear QR de consumo');
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

  const getEstadoBadge = (estado: string) => {
    const colores = {
      ACTIVO: 'bg-green-500/20 text-green-400 border-green-500/30',
      AGOTADO: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      BLOQUEADO: 'bg-red-500/20 text-red-400 border-red-500/30',
      EXPIRADO: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colores[estado as keyof typeof colores] || colores.ACTIVO;
  };

  // Modal para mostrar QR (creado o seleccionado)
  const qrParaMostrar = qrCreado || qrSeleccionado;
  const esNuevoQR = !!qrCreado;
  
  if (qrParaMostrar) {
    // Construir la URL del QR
    const qrUrl = qrCreado?.qrUrl || `${window.location.origin}/consumo/${qrParaMostrar.qrToken}`;
    
    return (
      <div className="min-h-screen p-4 max-w-2xl mx-auto flex items-center justify-center">
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 sm:p-8 text-center w-full">
          {esNuevoQR && (
            <div className="text-green-500 text-4xl sm:text-5xl mb-4">✓</div>
          )}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {esNuevoQR ? 'QR de Consumo Creado' : 'QR de Consumo'}
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-green-500 mb-2">
            {qrParaMostrar.codigo}
          </p>
          {qrParaMostrar.nombreCliente && (
            <p className="text-lg text-gray-300 mb-6">
              {qrParaMostrar.nombreCliente}
            </p>
          )}

          {/* QR Code */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg border-2 border-gray-700 mb-6 mx-auto max-w-md">
            <div className="w-full aspect-square flex items-center justify-center">
              <QRCodeSVG 
                value={qrUrl}
                size={256}
                level="H"
                includeMargin={true}
                className="w-full h-full max-w-[280px] max-h-[280px]" 
              />
            </div>
            <p className="text-xs text-gray-700 mt-3 font-medium">
              Escanea este código para usar el consumo
            </p>
          </div>

          {/* Información */}
          <div className="space-y-2 mb-6 text-left bg-[#0f1419] border border-gray-800 rounded-lg p-4">
            <div className="flex justify-between text-base sm:text-lg">
              <span className="text-gray-400">Monto Inicial:</span>
              <span className="font-bold text-white">${qrParaMostrar.montoInicial.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-400">Saldo Actual:</span>
              <span className={`font-bold ${qrParaMostrar.saldoActual > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                ${qrParaMostrar.saldoActual.toFixed(2)}
              </span>
            </div>
            {!esNuevoQR && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estado:</span>
                  <span className={`font-semibold ${
                    qrParaMostrar.estado === 'ACTIVO' ? 'text-green-400' :
                    qrParaMostrar.estado === 'AGOTADO' ? 'text-gray-400' :
                    qrParaMostrar.estado === 'BLOQUEADO' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {qrParaMostrar.estado}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Evento:</span>
                  <span className="text-white">{qrParaMostrar.evento.nombre}</span>
                </div>
              </>
            )}
          </div>

          {qrParaMostrar.notas && (
            <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-left">
              <p className="text-xs text-gray-400 mb-1">Notas:</p>
              <p className="text-sm text-blue-300">{qrParaMostrar.notas}</p>
            </div>
          )}

          <button
            onClick={() => {
              setQrCreado(null);
              setQrSeleccionado(null);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 rounded-lg transition-colors text-base sm:text-lg"
          >
            CERRAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">
        QR de Consumo
      </h1>

      {/* Mensaje */}
      {mensaje.texto && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            mensaje.tipo === 'success'
              ? 'bg-green-500/10 border-green-500/50 text-green-400'
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Header con selector de evento y botón crear */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Evento
            </label>
            <select
              value={eventoSeleccionado}
              onChange={(e) => setEventoSeleccionado(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="w-full sm:w-auto sm:mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            + Crear Nuevo QR
          </button>
        </div>

        {/* Formulario para crear QR */}
        {mostrarForm && (
          <form onSubmit={crearQRConsumo} className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Nuevo QR de Consumo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Monto Inicial *
                </label>
                <input
                  type="number"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  placeholder="100000"
                  className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Información adicional..."
                  rows={2}
                  className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Creando...' : 'Crear QR de Consumo'}
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
        )}
      </div>

      {/* Lista de QR de consumo */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <h3 className="text-lg font-bold text-white mb-4">
          QR de Consumo Creados ({qrConsumos.length})
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500 mb-3"></div>
            <p className="text-gray-400 font-semibold">Cargando...</p>
          </div>
        ) : qrConsumos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay QR de consumo creados para este evento
          </div>
        ) : (
          <div className="space-y-3">
            {qrConsumos.map((qr) => (
              <div
                key={qr.id}
                className="bg-[#0f1419] border border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-lg">
                      {qr.codigo}
                    </p>
                    {qr.nombreCliente && (
                      <p className="text-gray-300">
                        {qr.nombreCliente}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Creado por {qr.creadoPor.nombre} • <ClientDate date={qr.createdAt} format="short" />
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${getEstadoBadge(qr.estado)}`}
                  >
                    {qr.estado}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-400">Monto Inicial</p>
                    <p className="text-lg font-bold text-white">
                      ${qr.montoInicial.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Saldo Actual</p>
                    <p className={`text-lg font-bold ${qr.saldoActual > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                      ${qr.saldoActual.toFixed(2)}
                    </p>
                  </div>
                </div>

                {qr.notas && (
                  <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                    {qr.notas}
                  </div>
                )}

                {/* Botón para ver QR */}
                <button
                  onClick={() => setQrSeleccionado(qr)}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Ver QR
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
