'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface PedidoItem {
  id: string;
  producto: {
    nombre: string;
  };
  cantidad: number;
  cantidadEntregada: number;
  estadoItem: string;
}

interface PedidoDetalle {
  id: string;
  codigo: string;
  estadoPago: string;
  estadoPedido: string;
  items: PedidoItem[];
}

export default function BarraPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [barras, setBarras] = useState<any[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [barraSeleccionada, setBarraSeleccionada] = useState('');
  const [codigoQR, setCodigoQR] = useState('');
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [itemsEntrega, setItemsEntrega] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [escaneando, setEscaneando] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarBarras(eventoSeleccionado);
    }
  }, [eventoSeleccionado]);

  useEffect(() => {
    if (escaneando) {
      // Esperar a que el video se renderice
      setTimeout(() => {
        iniciarEscanerReal();
      }, 100);
    }
  }, [escaneando]);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    setLoadingInicial(true);
    
    if (!token) {
      mostrarMensaje('error', 'No hay sesión activa. Redirigiendo al login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    try {
      // Optimización: cargar eventos y barras en paralelo
      const [resEventos, resBarras] = await Promise.all([
        fetch('/api/eventos?activo=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/barras', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      if (resEventos.status === 401 || resEventos.status === 403) {
        mostrarMensaje('error', 'Sesión expirada. Por favor, inicia sesión nuevamente.');
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      const [dataEventos, dataBarras] = await Promise.all([
        resEventos.json(),
        resBarras.json(),
      ]);
      
      if (dataEventos.success && dataEventos.data.length > 0) {
        setEventos(dataEventos.data);
        setEventoSeleccionado(dataEventos.data[0].id);
      } else if (dataEventos.data.length === 0) {
        mostrarMensaje('error', 'No hay eventos activos disponibles');
      }

      if (dataBarras.success) {
        setBarras(dataBarras.data);
        if (dataBarras.data.length > 0) {
          setBarraSeleccionada(dataBarras.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarMensaje('error', 'Error al cargar eventos. Intenta recargar la página.');
    } finally {
      setLoadingInicial(false);
    }
  };

  const cargarBarras = async (eventoId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      mostrarMensaje('error', 'No hay sesión activa');
      return;
    }
    
    try {
      const res = await fetch(`/api/eventos/${eventoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.status === 401 || res.status === 403) {
        mostrarMensaje('error', 'Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      if (data.success && data.data.barras && data.data.barras.length > 0) {
        setBarras(data.data.barras);
        setBarraSeleccionada(data.data.barras[0].id);
      } else {
        mostrarMensaje('error', 'No hay barras disponibles para este evento');
        setBarras([]);
        setBarraSeleccionada('');
      }
    } catch (error) {
      console.error('Error al cargar barras:', error);
      mostrarMensaje('error', 'Error al cargar barras');
      setBarras([]);
      setBarraSeleccionada('');
    }
  };

  const buscarPedido = async () => {
    if (!codigoQR.trim()) {
      mostrarMensaje('error', 'Ingresa un código QR');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/qr/${codigoQR.trim()}`);
      const data = await res.json();

      if (data.success) {
        setPedido(data.data);
        
        // Inicializar cantidades de entrega
        const cantidades: { [key: string]: number } = {};
        data.data.items.forEach((item: PedidoItem) => {
          const restante = item.cantidad - item.cantidadEntregada;
          cantidades[item.id] = restante > 0 ? 1 : 0;
        });
        setItemsEntrega(cantidades);
        
        setMensaje({ tipo: '', texto: '' });
      } else {
        mostrarMensaje('error', data.error || 'Pedido no encontrado');
        setPedido(null);
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
      setPedido(null);
    } finally {
      setLoading(false);
    }
  };

  const cambiarCantidad = (itemId: string, delta: number) => {
    const item = pedido?.items.find((i) => i.id === itemId);
    if (!item) return;

    const max = item.cantidad - item.cantidadEntregada;
    const nueva = Math.max(0, Math.min(max, (itemsEntrega[itemId] || 0) + delta));
    
    setItemsEntrega({ ...itemsEntrega, [itemId]: nueva });
  };

  const confirmarEntrega = async () => {
    if (!pedido) {
      mostrarMensaje('error', 'No hay pedido cargado');
      return;
    }
    
    if (!barraSeleccionada) {
      mostrarMensaje('error', '⚠️ No hay barra seleccionada. Verifica que haya un evento activo con barras disponibles. Si el problema persiste, cierra sesión e inicia sesión nuevamente.');
      return;
    }

    // Validar que haya al menos un item para entregar
    const itemsParaEntregar = Object.entries(itemsEntrega)
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([itemId, cantidad]) => ({
        pedidoItemId: itemId,
        cantidadEntregada: cantidad,
      }));

    if (itemsParaEntregar.length === 0) {
      mostrarMensaje('error', '⚠️ Debes seleccionar cantidades para entregar. Usa el botón "⚡ ENTREGAR TODO EL PEDIDO" o ajusta las cantidades manualmente con +/-');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/entregas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qrToken: codigoQR,
          barraId: barraSeleccionada,
          items: itemsParaEntregar,
        }),
      });

      const data = await res.json();

      if (data.success) {
        mostrarMensaje('success', 'Entrega registrada exitosamente');
        
        // Limpiar y volver a buscar el pedido actualizado
        setTimeout(() => {
          buscarPedido();
        }, 1000);
      } else {
        mostrarMensaje('error', data.error || 'Error al registrar entrega');
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

  const limpiar = () => {
    setCodigoQR('');
    setPedido(null);
    setItemsEntrega({});
    setMensaje({ tipo: '', texto: '' });
    detenerEscaner();
  };

  const iniciarEscaner = () => {
    // Solo cambiar el estado, el useEffect se encargará del resto
    setEscaneando(true);
    setMensaje({ tipo: '', texto: '' });
  };

  const iniciarEscanerReal = async () => {
    try {
      console.log('Iniciando escáner...');

      // Verificar si el navegador soporta mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        mostrarMensaje('error', 'Tu navegador no soporta acceso a la cámara');
        setEscaneando(false);
        return;
      }

      const videoElement = videoRef.current;
      if (!videoElement) {
        console.error('No se encontró el elemento video');
        mostrarMensaje('error', 'Error al cargar el video');
        setEscaneando(false);
        return;
      }

      // Solicitar acceso a la cámara con configuración optimizada para móviles
      console.log('Solicitando acceso a la cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        }
      });
      
      console.log('Acceso a cámara concedido');
      videoElement.srcObject = stream;
      
      // Esperar a que el video esté listo
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve(null);
        };
      });

      // Esperar a que el video tenga dimensiones válidas
      await new Promise((resolve) => {
        const checkDimensions = () => {
          if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            console.log(`✅ Video listo: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
            resolve(null);
          } else {
            setTimeout(checkDimensions, 100);
          }
        };
        checkDimensions();
      });

      console.log('📷 Video iniciado, comenzando lectura de QR...');
      console.log('💡 Enfoca el QR dentro del cuadro verde');

      // Crear un nuevo reader cada vez para evitar problemas
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      console.log('Reader creado');

      // Variable para controlar si ya detectamos un QR
      let qrDetectado = false;

      // Usar el método decodeFromVideoDevice que es más confiable
      try {
        console.log('🔍 Buscando códigos QR...');
        
        // Obtener el ID del dispositivo de video
        const videoTrack = stream.getVideoTracks()[0];
        const deviceId = videoTrack.getSettings().deviceId;
        
        await reader.decodeFromVideoDevice(
          deviceId,
          videoElement,
          async (result, error) => {
            if (result && !qrDetectado) {
              qrDetectado = true; // Evitar procesar múltiples veces
              console.log('✅ QR detectado:', result.getText());
              const texto = result.getText();
              
              // Extraer solo el token del QR (última parte de la URL)
              const token = texto.includes('/') ? texto.split('/').pop() || texto : texto;
              console.log('Token extraído:', token);
              
              setCodigoQR(token);
              detenerEscaner();
              
              // Buscar automáticamente después de escanear
              try {
                const res = await fetch(`/api/qr/${token}`);
                const data = await res.json();

                if (data.success) {
                  setPedido(data.data);
                  
                  // Inicializar cantidades de entrega
                  const cantidades: { [key: string]: number } = {};
                  data.data.items.forEach((item: PedidoItem) => {
                    const restante = item.cantidad - item.cantidadEntregada;
                    cantidades[item.id] = restante > 0 ? 1 : 0;
                  });
                  setItemsEntrega(cantidades);
                  
                  mostrarMensaje('success', 'Pedido cargado exitosamente');
                } else {
                  mostrarMensaje('error', data.error || 'Pedido no encontrado');
                }
              } catch (err) {
                console.error('Error al buscar pedido:', err);
                mostrarMensaje('error', 'Error al buscar el pedido');
              }
            }
            
            // Log de búsqueda activa (menos frecuente)
            if (error && error.name === 'NotFoundException') {
              // Es normal, sigue buscando (log reducido)
              if (Math.random() < 0.005) { // 0.5% de las veces
                console.log('🔍 Escaneando...');
              }
            } else if (error && error.name !== 'ChecksumException' && error.name !== 'FormatException') {
              // Solo loguear errores relevantes
              if (Math.random() < 0.01) {
                console.warn('⚠️ Error:', error.name);
              }
            }
          }
        );
      } catch (decodeError) {
        console.error('Error al iniciar decodificación:', decodeError);
        mostrarMensaje('error', 'Error al iniciar el escáner');
        setEscaneando(false);
      }
    } catch (error: any) {
      console.error('Error al iniciar escáner:', error);
      let mensaje = 'Error al acceder a la cámara';
      
      if (error.name === 'NotAllowedError') {
        mensaje = 'Debes permitir el acceso a la cámara en el navegador';
      } else if (error.name === 'NotFoundError') {
        mensaje = 'No se encontró ninguna cámara en tu dispositivo';
      } else if (error.name === 'NotReadableError') {
        mensaje = 'La cámara está siendo usada por otra aplicación';
      }
      
      mostrarMensaje('error', mensaje);
      setEscaneando(false);
    }
  };

  const detenerEscaner = () => {
    console.log('Deteniendo escáner...');
    
    // Resetear y detener el reader primero
    if (readerRef.current) {
      try {
        readerRef.current.reset();
        readerRef.current = null;
      } catch (e) {
        console.log('Error al resetear reader:', e);
      }
    }
    
    // Detener el stream de video
    const videoElement = videoRef.current;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track detenido:', track.kind);
      });
      videoElement.srcObject = null;
    }
    
    setEscaneando(false);
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      detenerEscaner();
    };
  }, []);

  // Mostrar loader mientras carga
  if (loadingInicial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-400 text-lg font-semibold">Cargando sistema de barra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 max-w-4xl mx-auto">
      {/* Configuración de Evento y Barra */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-bold text-white mb-3">📍 Configuración</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Evento
            </label>
            <select
              value={eventoSeleccionado}
              onChange={(e) => setEventoSeleccionado(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {eventos.length === 0 && (
                <option value="">No hay eventos disponibles</option>
              )}
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Barra
            </label>
            <select
              value={barraSeleccionada}
              onChange={(e) => setBarraSeleccionada(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {barras.length === 0 && (
                <option value="">No hay barras disponibles</option>
              )}
              {barras.map((barra) => (
                <option key={barra.id} value={barra.id}>
                  {barra.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Indicador de estado */}
        {barraSeleccionada && (
          <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-xs sm:text-sm text-green-400">
              ✓ Barra seleccionada correctamente
            </p>
          </div>
        )}
        {!barraSeleccionada && barras.length === 0 && eventos.length > 0 && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs sm:text-sm text-red-400">
              ⚠️ No hay barras disponibles. Contacta al administrador.
            </p>
          </div>
        )}
      </div>

      {/* Mensaje */}
      {mensaje.texto && (
        <div
          className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border text-sm sm:text-base ${
            mensaje.tipo === 'success'
              ? 'bg-green-500/10 border-green-500/50 text-green-400'
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Escáner QR */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-3 sm:p-6 mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Escanear Pedido</h2>
        
        {!escaneando ? (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={codigoQR}
                onChange={(e) => setCodigoQR(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarPedido()}
                placeholder="Código QR..."
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={buscarPedido}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                >
                  {loading ? '...' : 'Buscar'}
                </button>
                {pedido && (
                  <button
                    onClick={limpiar}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={iniciarEscaner}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              📷 Activar Cámara para Escanear QR
            </button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
              <div className="absolute inset-0 border-2 sm:border-4 border-green-500 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 border-2 sm:border-4 border-green-500">
                  <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-black px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-base font-bold animate-pulse whitespace-nowrap">
                    🔍 QR...
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={detenerEscaner}
              className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
            >
              ✕ Detener Escáner
            </button>
            <div className="bg-green-600/20 border-2 border-green-600/50 rounded-lg p-3 sm:p-4">
              <p className="text-center text-green-400 font-bold text-sm sm:text-base mb-2">
                💡 CONSEJOS PARA ESCANEAR
              </p>
              <ul className="text-left text-gray-300 text-xs sm:text-sm space-y-1">
                <li>• Mantén el celular quieto y estable</li>
                <li>• Acerca o aleja el QR hasta que enfoque</li>
                <li>• Asegúrate de tener buena luz</li>
                <li>• El QR debe estar dentro del cuadro verde</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Detalle del Pedido */}
      {pedido && (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-3 sm:p-6">
          {/* Header del pedido */}
          <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {pedido.codigo}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-block px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${
                  pedido.estadoPago === 'PAID'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}
              >
                {pedido.estadoPago === 'PAID' ? '✓ PAGADO' : '⏳ PAGO PENDIENTE'}
              </span>
              <span
                className={`inline-block px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${
                  pedido.estadoPedido === 'DELIVERED'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : pedido.estadoPedido === 'PARTIAL_DELIVERY'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}
              >
                {pedido.estadoPedido === 'DELIVERED'
                  ? '✓ ENTREGADO'
                  : pedido.estadoPedido === 'PARTIAL_DELIVERY'
                  ? 'EN PROCESO'
                  : 'PENDIENTE'}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <h4 className="text-base sm:text-lg font-bold text-white">Items del Pedido</h4>
            
            {pedido.items.map((item) => {
              const restante = item.cantidad - item.cantidadEntregada;
              const estaCompleto = restante === 0;

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 sm:p-4 ${
                    estaCompleto ? 'bg-green-500/10 border-green-500/30' : 'bg-[#0f1419] border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-base sm:text-lg font-semibold text-white break-words">
                        {item.producto.nombre}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Entregado: {item.cantidadEntregada} / {item.cantidad}
                        {estaCompleto && ' ✓'}
                      </p>
                    </div>
                    {!estaCompleto && (
                      <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap">
                        Faltan {restante}
                      </span>
                    )}
                  </div>

                  {!estaCompleto && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-[#0f1419] border border-gray-800 p-2 sm:p-3 rounded-lg">
                        <span className="text-xs sm:text-sm font-medium text-gray-300">
                          Entregar:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => cambiarCantidad(item.id, -1)}
                            className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg sm:text-xl"
                          >
                            −
                          </button>
                          <span className="text-xl sm:text-2xl font-bold w-10 sm:w-12 text-center text-white">
                            {itemsEntrega[item.id] || 0}
                          </span>
                          <button
                            onClick={() => cambiarCantidad(item.id, 1)}
                            className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg sm:text-xl"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => setItemsEntrega({ ...itemsEntrega, [item.id]: restante })}
                        className="w-full px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg"
                      >
                        Entregar todo ({restante})
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Información de cantidades seleccionadas */}
          {pedido.estadoPedido !== 'DELIVERED' && pedido.estadoPago === 'PAID' && (
            <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                📋 Cantidades seleccionadas: {
                  Object.values(itemsEntrega).reduce((sum, cant) => sum + cant, 0) === 0
                    ? '⚠️ Ninguna (usa el botón de abajo para entregar todo)'
                    : `${Object.values(itemsEntrega).reduce((sum, cant) => sum + cant, 0)} items listos para entregar`
                }
              </p>
            </div>
          )}

          {/* Botón entregar todo rápido */}
          {pedido.estadoPedido !== 'DELIVERED' && pedido.estadoPago === 'PAID' && (
            <button
              onClick={() => {
                const nuevosItems: { [key: string]: number } = {};
                pedido.items.forEach((item) => {
                  const restante = item.cantidad - item.cantidadEntregada;
                  if (restante > 0) {
                    nuevosItems[item.id] = restante;
                  }
                });
                setItemsEntrega(nuevosItems);
                // Auto-scroll al botón de confirmar
                setTimeout(() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 100);
              }}
              className="w-full mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all text-base sm:text-lg shadow-lg"
            >
              ⚡ SELECCIONAR TODO EL PEDIDO
            </button>
          )}

          {/* Botón confirmar */}
          {pedido.estadoPedido !== 'DELIVERED' && (
            <button
              onClick={confirmarEntrega}
              disabled={loading || pedido.estadoPago !== 'PAID'}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-base sm:text-lg"
            >
              {loading
                ? 'PROCESANDO...'
                : pedido.estadoPago !== 'PAID'
                ? '⏳ ESPERANDO PAGO'
                : '✓ CONFIRMAR ENTREGA'}
            </button>
          )}

          {pedido.estadoPedido === 'DELIVERED' && (
            <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-3 sm:p-4 text-center">
              <p className="text-green-400 font-bold text-base sm:text-lg">
                ✓ Pedido completamente entregado
              </p>
            </div>
          )}
        </div>
      )}

      {/* Placeholder cuando no hay pedido */}
      {!pedido && !loading && (
        <div className="bg-[#1a1f2e] border-2 border-dashed border-gray-700 rounded-xl p-6 sm:p-12 text-center">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📱</div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            Escanea un código QR
          </h3>
          <p className="text-sm sm:text-base text-gray-400">
            Ingresa o escanea el código QR del pedido para comenzar la entrega
          </p>
        </div>
      )}
    </div>
  );
}
