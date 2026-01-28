'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria?: string;
  codigo: string;
  tipo?: 'SIMPLE' | 'BASE' | 'COMPUESTO';
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  opcionesComponentes?: Record<string, string>; // { "acompañamiento": "S001" }
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
}

interface Caja {
  id: string;
  nombre: string;
}

export default function CajaPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [cajaSeleccionada, setCajaSeleccionada] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [metodoPago, setMetodoPago] = useState<'CASH' | 'TRANSFER' | 'QR_CONSUMO'>('CASH');
  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [pedidoCreado, setPedidoCreado] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas');
  
  // Estados para QR de consumo
  const [qrConsumoToken, setQrConsumoToken] = useState('');
  const [qrConsumoInfo, setQrConsumoInfo] = useState<any>(null);
  const [validandoQR, setValidandoQR] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [qrDetectado, setQrDetectado] = useState(false);
  
  // Estados para selección de componentes (combos)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [recetaProducto, setRecetaProducto] = useState<any>(null);
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState<Record<string, string>>({});
  const [mostrarModalOpciones, setMostrarModalOpciones] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Limpiar escáner al cambiar de método de pago
  useEffect(() => {
    if (metodoPago !== 'QR_CONSUMO' && escaneando) {
      detenerEscaner();
    }
  }, [metodoPago]);

  // Limpiar escáner al desmontar
  useEffect(() => {
    return () => {
      detenerEscaner();
    };
  }, []);

  // Iniciar escáner real cuando el estado cambia
  useEffect(() => {
    if (escaneando) {
      // Esperar a que el video se renderice
      setTimeout(() => {
        iniciarEscanerReal();
      }, 100);
    }
  }, [escaneando]);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarCajas(eventoSeleccionado);
    }
  }, [eventoSeleccionado]);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    setLoadingInicial(true);
    
    try {
      // Optimización: cargar eventos y productos en paralelo
      const [resEventos, resProductos] = await Promise.all([
        fetch('/api/eventos?activo=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/productos?activo=true&incluirReceta=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [dataEventos, dataProductos] = await Promise.all([
        resEventos.json(),
        resProductos.json(),
      ]);

      if (dataEventos.success) {
        setEventos(dataEventos.data);
        if (dataEventos.data.length > 0) {
          setEventoSeleccionado(dataEventos.data[0].id);
        }
      }

      if (dataProductos.success) {
        // Filtrar solo productos que se pueden vender (SIMPLE y COMPUESTO)
        const productosVendibles = dataProductos.data.filter(
          (p: Producto) => p.tipo !== 'BASE'
        );
        setProductos(productosVendibles);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoadingInicial(false);
    }
  };

  const cargarCajas = async (eventoId: string) => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`/api/eventos/${eventoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      console.log('Respuesta del servidor:', data);
      
      if (data.success) {
        console.log('Cajas encontradas:', data.data.cajas);
        setCajas(data.data.cajas);
        if (data.data.cajas.length > 0) {
          setCajaSeleccionada(data.data.cajas[0].id);
        } else {
          console.warn('No hay cajas disponibles para este evento');
        }
      } else {
        console.error('Error en la respuesta:', data.error);
      }
    } catch (error) {
      console.error('Error al cargar cajas:', error);
    }
  };

  const agregarAlCarrito = async (producto: Producto) => {
    // Si el producto es COMPUESTO, obtener su receta para ver si tiene opciones
    if (producto.tipo === 'COMPUESTO') {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/productos/${producto.id}/receta`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.success && data.data) {
            const receta = data.data;
            
            // Si tiene grupos opcionales, mostrar modal para elegir
            if (receta.gruposOpcionales && Object.keys(receta.gruposOpcionales).length > 0) {
              setProductoSeleccionado(producto);
              setRecetaProducto(receta);
              
              // Pre-seleccionar Speed por defecto para cada grupo
              const opcionesPorDefecto: Record<string, string> = {};
              for (const grupo in receta.gruposOpcionales) {
                const opciones = receta.gruposOpcionales[grupo];
                if (opciones && opciones.length > 0) {
                  const speedOption = opciones.find((o: any) => o.codigo === 'S001');
                  opcionesPorDefecto[grupo] = speedOption ? speedOption.codigo : opciones[0].codigo;
                }
              }
              setOpcionesSeleccionadas(opcionesPorDefecto);
              setMostrarModalOpciones(true);
              return; // Esperar a que el usuario confirme
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener receta:', error);
      }
    }
    
    // Si no tiene opciones o es simple, agregar directamente
    agregarProductoDirecto(producto, {});
  };

  const agregarProductoDirecto = (producto: Producto, opcionesComponentes: Record<string, string>) => {
    // Buscar si ya existe en el carrito (considerando las mismas opciones)
    const existe = carrito.find((item) => 
      item.producto.id === producto.id && 
      JSON.stringify(item.opcionesComponentes) === JSON.stringify(opcionesComponentes)
    );
    
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item.producto.id === producto.id && 
          JSON.stringify(item.opcionesComponentes) === JSON.stringify(opcionesComponentes)
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito([...carrito, { producto, cantidad: 1, opcionesComponentes }]);
    }
  };

  const confirmarOpcionesProducto = () => {
    if (productoSeleccionado) {
      agregarProductoDirecto(productoSeleccionado, opcionesSeleccionadas);
      setMostrarModalOpciones(false);
      setProductoSeleccionado(null);
      setRecetaProducto(null);
      setOpcionesSeleccionadas({});
    }
  };

  const cambiarCantidad = (index: number, delta: number) => {
    setCarrito(
      carrito
        .map((item, i) =>
          i === index
            ? { ...item, cantidad: Math.max(0, item.cantidad + delta) }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);
  };

  const iniciarEscaner = () => {
    // Solo cambiar el estado, el useEffect se encargará del resto
    setEscaneando(true);
    setQrDetectado(false);
  };

  const iniciarEscanerReal = async () => {
    try {
      console.log('Iniciando escáner...');

      // Verificar si el navegador soporta mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta acceso a la cámara');
        setEscaneando(false);
        return;
      }

      const videoElement = videoRef.current;
      if (!videoElement) {
        console.error('No se encontró el elemento video');
        alert('Error al cargar el video');
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
        const deviceId = videoTrack.getSettings().deviceId || null;
        
        await reader.decodeFromVideoDevice(
          deviceId,
          videoElement,
          (result, error) => {
            if (result && !qrDetectado) {
              qrDetectado = true; // Evitar procesar múltiples veces
              console.log('✅ QR detectado:', result.getText());
              const texto = result.getText();
              
              // Extraer solo el token del QR (última parte de la URL)
              const token = texto.includes('/') ? texto.split('/').pop() || texto : texto;
              console.log('Token extraído:', token);
              
              setQrConsumoToken(token);
              detenerEscaner();
              
              // Validar automáticamente después de escanear
              validarQRConsumoConToken(token);
            }
          }
        );
      } catch (decodeError) {
        console.error('Error al iniciar decodificación:', decodeError);
        alert('Error al iniciar el escáner');
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
      
      alert(mensaje);
      setEscaneando(false);
    }
  };

  const detenerEscaner = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setEscaneando(false);
    setQrDetectado(false);
  };

  const validarQRConsumo = () => {
    if (!qrConsumoToken.trim()) {
      alert('Ingresa el código o escanea el QR de consumo');
      return;
    }
    validarQRConsumoConToken(qrConsumoToken.trim());
  };

  const validarQRConsumoConToken = async (token: string) => {
    setValidandoQR(true);
    const authToken = localStorage.getItem('token');
    const total = calcularTotal();

    try {
      const res = await fetch('/api/qr-consumo/validar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          qrToken: token,
          montoRequerido: total,
        }),
      });

      const data = await res.json();

      if (data.success && data.valido) {
        setQrConsumoInfo(data.qrConsumo);
        alert(`QR validado correctamente. Saldo disponible: $${data.qrConsumo.saldoActual.toFixed(2)}`);
      } else {
        alert(data.error || 'QR de consumo no válido');
        setQrConsumoInfo(null);
      }
    } catch (error) {
      console.error('Error al validar QR:', error);
      alert('Error al validar QR de consumo');
      setQrConsumoInfo(null);
    } finally {
      setValidandoQR(false);
    }
  };

  const crearPedido = async () => {
    if (carrito.length === 0 || !eventoSeleccionado || !cajaSeleccionada) {
      alert('Complete todos los campos');
      return;
    }

    // Si el método es QR_CONSUMO, verificar que esté validado
    if (metodoPago === 'QR_CONSUMO' && !qrConsumoInfo) {
      alert('Debes validar el QR de consumo antes de continuar');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: eventoSeleccionado,
          cajaId: cajaSeleccionada,
          metodoPago,
          qrConsumoToken: metodoPago === 'QR_CONSUMO' ? qrConsumoToken.trim() : undefined,
          items: carrito.map((item) => ({
            productoId: item.producto.id,
            cantidad: item.cantidad,
            precioUnitario: item.producto.precio,
            opcionesComponentes: item.opcionesComponentes || {},
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPedidoCreado(data.data);
        setCarrito([]);
        setQrConsumoToken('');
        setQrConsumoInfo(null);
      } else {
        alert(data.error || 'Error al crear pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const categorias = [
    { nombre: 'Todas', valor: 'Todas', emoji: '🍹', color: 'bg-gradient-to-br from-purple-600 to-pink-600' },
    { nombre: 'Botellas', valor: 'Botellas', emoji: '🍾', color: 'bg-gradient-to-br from-blue-600 to-cyan-600' },
    { nombre: 'Tragos', valor: 'Tragos', emoji: '🍸', color: 'bg-gradient-to-br from-pink-600 to-rose-600' },
    { nombre: 'Sin Alcohol', valor: 'Sin Alcohol', emoji: '🥤', color: 'bg-gradient-to-br from-green-600 to-emerald-600' },
  ];

  const productosFiltrados = productos.filter((producto) => {
    const coincideBusqueda = 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideCategoria = 
      categoriaSeleccionada === 'Todas' || 
      producto.categoria === categoriaSeleccionada;
    
    return coincideBusqueda && coincideCategoria;
  });

  if (pedidoCreado) {
    // Usar directamente la URL que viene del backend
    const qrUrl = pedidoCreado.qrUrl || '';
    
    // Log para debugging
    console.log('Pedido creado:', pedidoCreado);
    console.log('URL del QR:', qrUrl);
    
    const esPendienteAprobacion = pedidoCreado.estadoPago === 'PENDING_PAYMENT';
    
    return (
      <div className="min-h-screen p-4 max-w-2xl mx-auto flex items-center justify-center">
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 sm:p-8 text-center w-full">
          <div className={`text-4xl sm:text-5xl mb-4 ${esPendienteAprobacion ? 'text-yellow-500' : 'text-green-500'}`}>
            {esPendienteAprobacion ? '⏳' : '✓'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {esPendienteAprobacion ? 'Pedido Creado - Pendiente de Aprobación' : 'Pedido Creado'}
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-blue-500 mb-3">
            {pedidoCreado.codigo}
          </p>
          
          {/* Mensaje según método de pago */}
          {esPendienteAprobacion && (
            <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl p-4 mb-6">
              <p className="text-yellow-400 font-bold mb-3 text-lg">
                🏦 Transferencia Pendiente de Aprobación
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3 text-left">
                <p className="text-blue-300 font-semibold text-sm mb-2">
                  📋 Instrucciones para el Cliente:
                </p>
                <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Realizar la transferencia al CBU/Alias del evento</li>
                  <li>Guardar el comprobante de transferencia</li>
                  <li>Escanear este QR para ver el estado del pedido</li>
                  <li>Esperar la aprobación del administrador</li>
                </ol>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-left">
                <p className="text-red-300 font-semibold text-sm mb-1">
                  ⚠️ Importante:
                </p>
                <p className="text-xs text-gray-300">
                  El pedido NO será procesado hasta que un administrador verifique el comprobante y apruebe el pago.
                </p>
              </div>
            </div>
          )}

          {/* QR Code - Responsive */}
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
              Escanea este código para ver tu pedido
            </p>
          </div>

          {/* Datos de Transferencia (solo si es transferencia) */}
          {esPendienteAprobacion && pedidoCreado.metodoPago === 'TRANSFER' && (
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/50 rounded-xl p-4 sm:p-6 mb-6">
              <p className="text-blue-300 font-bold mb-4 text-base sm:text-lg">
                💳 Datos para Transferir
              </p>
              <div className="bg-[#0f1419] border border-gray-700 rounded-lg p-4 space-y-3 text-left">
                <div>
                  <p className="text-xs text-gray-400 mb-1">CBU</p>
                  <p className="text-white font-mono font-bold text-sm sm:text-base">
                    0000003100012345678901
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Alias</p>
                  <p className="text-white font-bold text-base sm:text-lg">
                    BARRA.EVENTO.PAGO
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Monto a Transferir</p>
                  <p className="text-green-400 font-bold text-2xl sm:text-3xl">
                    ${pedidoCreado.total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Referencia (opcional)</p>
                  <p className="text-gray-300 font-mono text-sm">
                    {pedidoCreado.codigo}
                  </p>
                </div>
              </div>
              <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-yellow-300 text-center">
                  ⚠️ <span className="font-semibold">IMPORTANTE:</span> Guarda el comprobante. El pedido será aprobado por un administrador.
                </p>
              </div>
            </div>
          )}

          {/* Información del pedido */}
          <div className="space-y-3 mb-6 text-left bg-[#0f1419] border border-gray-800 rounded-lg p-4">
            <div className="flex justify-between text-base sm:text-lg">
              <span className="text-gray-400">Total:</span>
              <span className="font-bold text-white text-2xl">${pedidoCreado.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-400">Método de Pago:</span>
              <span className="font-semibold text-white">
                {pedidoCreado.metodoPago === 'CASH' && '💵 Efectivo'}
                {pedidoCreado.metodoPago === 'TRANSFER' && '🏦 Transferencia'}
                {pedidoCreado.metodoPago === 'QR_CONSUMO' && '🎫 QR Consumo'}
              </span>
            </div>
            <div className="flex justify-between text-sm sm:text-base items-center">
              <span className="text-gray-400">Estado Pago:</span>
              <span className={`font-semibold px-3 py-1 rounded-full text-xs ${
                pedidoCreado.estadoPago === 'PAID' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
              }`}>
                {pedidoCreado.estadoPago === 'PAID' ? '✅ PAGADO' : '⏳ PENDIENTE APROBACIÓN'}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(qrUrl);
              alert('URL copiada al portapapeles!');
            }}
            className="w-full mb-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
          >
            📋 Copiar URL del QR
          </button>

          <button
            onClick={() => {
              const token = pedidoCreado.qrToken;
              navigator.clipboard.writeText(token);
              alert('Token copiado! Pégalo en la barra para buscar el pedido.');
            }}
            className="w-full mb-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
          >
            🔑 Copiar Token para Barra
          </button>

          <button
            onClick={() => setPedidoCreado(null)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 rounded-lg transition-colors text-base sm:text-lg"
          >
            NUEVO PEDIDO
          </button>
        </div>
      </div>
    );
  }

  // Mostrar loader mientras carga
  if (loadingInicial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-400 text-lg font-semibold">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Configuración - Oculta pero mantiene la lógica */}
      {/* Descomenta este bloque si necesitas múltiples eventos/cajas en el futuro */}
      {/* 
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Caja
            </label>
            <select
              value={cajaSeleccionada}
              onChange={(e) => setCajaSeleccionada(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {cajas.map((caja) => (
                <option key={caja.id} value={caja.id}>
                  {caja.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Productos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Botones de Categoría */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Categorías
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categorias.map((categoria) => (
                <button
                  key={categoria.nombre}
                  onClick={() => setCategoriaSeleccionada(categoria.valor)}
                  className={`${
                    categoriaSeleccionada === categoria.valor
                      ? `${categoria.color} ring-4 ring-white/20 shadow-lg scale-105`
                      : 'bg-[#0f1419] border-2 border-gray-700 hover:border-gray-600'
                  } text-white p-4 rounded-xl transition-all transform hover:scale-105 active:scale-95`}
                >
                  <div className="text-3xl mb-2">{categoria.emoji}</div>
                  <div className="font-bold text-sm">{categoria.nombre}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Buscador y Productos */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            {/* Contador de productos */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} disponible{productosFiltrados.length !== 1 ? 's' : ''}
              </p>
              {categoriaSeleccionada !== 'Todas' && (
                <button
                  onClick={() => setCategoriaSeleccionada('Todas')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Ver todas ✕
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto scrollbar-hide">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map((producto) => (
                  <button
                    key={producto.id}
                    onClick={() => agregarAlCarrito(producto)}
                    className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white p-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    <div className="font-bold text-base sm:text-lg mb-1 truncate">{producto.nombre}</div>
                    <div className="text-xl sm:text-2xl font-bold">${producto.precio.toFixed(0)}</div>
                    {producto.categoria && (
                      <div className="text-xs opacity-80 mt-1 bg-white/10 rounded-full px-2 py-0.5 inline-block">
                        {producto.categoria}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🛒 Carrito
              {carrito.length > 0 && (
                <span className="bg-blue-600 text-white text-sm px-2.5 py-1 rounded-full">
                  {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
                </span>
              )}
            </h3>
            {carrito.length > 0 && (
              <button
                onClick={() => setCarrito([])}
                className="text-xs text-red-400 hover:text-red-300 font-semibold"
              >
                Vaciar
              </button>
            )}
          </div>

          {carrito.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-sm">Carrito vacío</p>
              <p className="text-xs mt-1">Agrega productos para comenzar</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4 max-h-[350px] overflow-y-auto scrollbar-hide">
              {carrito.map((item, index) => {
                // Buscar nombres de componentes seleccionados
                const opcionesTexto = item.opcionesComponentes 
                  ? Object.entries(item.opcionesComponentes).map(([grupo, codigo]) => {
                      const producto = productos.find(p => p.codigo === codigo);
                      return producto ? producto.nombre : codigo;
                    }).join(', ')
                  : null;

                return (
                  <div
                    key={`${item.producto.id}-${index}`}
                    className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-gray-700 p-3 rounded-xl hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">
                          {item.producto.nombre}
                        </div>
                        {opcionesTexto && (
                          <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                            <span className="text-blue-500">→</span> Con {opcionesTexto}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          ${item.producto.precio.toFixed(0)} c/u
                        </div>
                      </div>
                      <button
                        onClick={() => cambiarCantidad(index, -999)}
                        className="text-red-400 hover:text-red-300 text-xl ml-2"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => cambiarCantidad(index, -1)}
                        className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-transform"
                      >
                        −
                      </button>
                      <span className="text-xl font-bold w-10 text-center text-white">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => cambiarCantidad(index, 1)}
                        className="w-9 h-9 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-xl font-bold text-green-400">
                      ${(item.producto.precio * item.cantidad).toFixed(0)}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-gray-700 pt-4 mb-4">
            {/* Total */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-semibold text-lg">TOTAL</span>
                <div className="text-right">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    ${calcularTotal().toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {carrito.reduce((sum, item) => sum + item.cantidad, 0)} items
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                💳 Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setMetodoPago('CASH');
                    setQrConsumoInfo(null);
                    setQrConsumoToken('');
                  }}
                  className={`py-3 px-2 rounded-xl font-semibold transition-all text-xs sm:text-sm ${
                    metodoPago === 'CASH'
                      ? 'bg-gradient-to-br from-green-600 to-green-700 text-white ring-4 ring-green-500/20 shadow-lg scale-105'
                      : 'bg-[#0f1419] border-2 border-gray-700 text-gray-400 hover:border-green-500/50'
                  }`}
                >
                  <div className="text-lg mb-1">💵</div>
                  Efectivo
                </button>
                <button
                  onClick={() => {
                    setMetodoPago('TRANSFER');
                    setQrConsumoInfo(null);
                    setQrConsumoToken('');
                  }}
                  className={`py-3 px-2 rounded-xl font-semibold transition-all text-xs sm:text-sm ${
                    metodoPago === 'TRANSFER'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ring-4 ring-blue-500/20 shadow-lg scale-105'
                      : 'bg-[#0f1419] border-2 border-gray-700 text-gray-400 hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-lg mb-1">🏦</div>
                  Transfer
                </button>
                <button
                  onClick={() => {
                    setMetodoPago('QR_CONSUMO');
                    setQrConsumoInfo(null);
                    setQrConsumoToken('');
                  }}
                  className={`py-3 px-2 rounded-xl font-semibold transition-all text-xs sm:text-sm ${
                    metodoPago === 'QR_CONSUMO'
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white ring-4 ring-purple-500/20 shadow-lg scale-105'
                      : 'bg-[#0f1419] border-2 border-gray-700 text-gray-400 hover:border-purple-500/50'
                  }`}
                >
                  <div className="text-lg mb-1">🎫</div>
                  QR
                </button>
              </div>

              {/* Mensaje informativo para Transferencia */}
              {metodoPago === 'TRANSFER' && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 font-semibold text-sm mb-1 flex items-center gap-2">
                    <span>ℹ️</span> Instrucciones para el Cliente
                  </p>
                  <p className="text-xs text-gray-300">
                    El cliente debe realizar la transferencia y mostrar el comprobante.
                    El pedido quedará pendiente hasta que un administrador apruebe el pago.
                  </p>
                </div>
              )}

              {/* Formulario para QR de Consumo */}
              {metodoPago === 'QR_CONSUMO' && (
                <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  {!escaneando ? (
                    <>
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Código o Token del QR
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={qrConsumoToken}
                          onChange={(e) => setQrConsumoToken(e.target.value)}
                          placeholder="QRC-20260126-0001 o token..."
                          className="flex-1 px-3 py-2 bg-[#0f1419] border border-gray-700 text-white placeholder-gray-500 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={validarQRConsumo}
                          disabled={validandoQR || !qrConsumoToken.trim()}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-semibold rounded-lg text-sm transition-colors"
                        >
                          {validandoQR ? '...' : 'Validar'}
                        </button>
                      </div>
                      
                      <button
                        onClick={iniciarEscaner}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
                      >
                        📷 Escanear con Cámara
                      </button>
                      
                      {/* Info de debug para móviles */}
                      <div className="text-[10px] text-gray-500 text-center mt-2">
                        {window.location.protocol === 'https:' ? '🔒 HTTPS OK' : '⚠️ Necesita HTTPS'}
                        {' • '}
                        {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent) ? '📱 Móvil' : '💻 Desktop'}
                        {' • '}
                        <span className="text-[8px]">{navigator.userAgent.substring(0, 30)}...</span>
                      </div>

                      {qrConsumoInfo && (
                        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs">
                          <p className="text-green-400 font-semibold">✓ QR Validado</p>
                          {qrConsumoInfo.nombreCliente && (
                            <p className="text-gray-300">{qrConsumoInfo.nombreCliente}</p>
                          )}
                          <p className="text-gray-400">
                            Saldo: <span className="text-green-400 font-bold">${qrConsumoInfo.saldoActual.toFixed(2)}</span>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          playsInline
                        />
                        <div className="absolute inset-0 border-2 sm:border-4 border-green-500 pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 border-2 sm:border-4 border-green-500">
                            <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-black px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-bold animate-pulse whitespace-nowrap">
                              🔍 Buscando QR...
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={detenerEscaner}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors"
                      >
                        ✕ Detener Escáner
                      </button>
                      
                      <div className="bg-green-600/20 border-2 border-green-600/50 rounded-lg p-3">
                        <p className="text-center text-green-400 font-bold text-xs mb-2">
                          💡 CONSEJOS PARA ESCANEAR
                        </p>
                        <ul className="text-left text-gray-300 text-xs space-y-1">
                          <li>• Mantén el celular quieto y estable</li>
                          <li>• Acerca o aleja el QR hasta que enfoque</li>
                          <li>• Asegúrate de tener buena luz</li>
                          <li>• El QR debe estar dentro del cuadro verde</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={crearPedido}
              disabled={loading || carrito.length === 0}
              className={`w-full font-bold py-5 px-6 rounded-xl transition-all text-lg shadow-lg ${
                carrito.length === 0
                  ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white active:scale-95 transform hover:shadow-2xl'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  CREANDO PEDIDO...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ✓ CONFIRMAR PEDIDO
                  {carrito.length > 0 && (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                      ${calcularTotal().toFixed(0)}
                    </span>
                  )}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Selección de Componentes */}
      {mostrarModalOpciones && productoSeleccionado && recetaProducto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl max-w-md w-full border-2 border-blue-500/50 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white mb-2">
                Elegir Acompañamiento
              </h3>
              <p className="text-white/90 text-sm">
                {productoSeleccionado.nombre}
              </p>
            </div>

            {/* Opciones */}
            <div className="p-6 space-y-6">
              {Object.entries(recetaProducto.gruposOpcionales).map(([grupo, opciones]: [string, any]) => (
                <div key={grupo}>
                  <label className="block text-sm font-semibold text-gray-300 mb-3 capitalize">
                    {grupo}:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {opciones.map((opcion: any) => {
                      const estaSeleccionado = opcionesSeleccionadas[grupo] === opcion.codigo;
                      return (
                        <button
                          key={opcion.codigo}
                          onClick={() => setOpcionesSeleccionadas({
                            ...opcionesSeleccionadas,
                            [grupo]: opcion.codigo,
                          })}
                          className={`p-4 rounded-xl font-semibold transition-all text-left ${
                            estaSeleccionado
                              ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white ring-4 ring-green-500/30 shadow-xl scale-105'
                              : 'bg-[#0f1419] border-2 border-gray-700 text-gray-300 hover:border-blue-500/50'
                          }`}
                        >
                          <div className="text-base font-bold mb-1">
                            {opcion.nombre}
                          </div>
                          <div className="text-xs opacity-70">
                            {opcion.cantidad}x por botella
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Componentes obligatorios (info) */}
              {recetaProducto.componentesObligatorios && recetaProducto.componentesObligatorios.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300 font-semibold mb-2">
                    ℹ️ También incluye:
                  </p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {recetaProducto.componentesObligatorios.map((comp: any) => (
                      <li key={comp.codigo}>
                        • {comp.cantidad}x {comp.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => {
                  setMostrarModalOpciones(false);
                  setProductoSeleccionado(null);
                  setRecetaProducto(null);
                  setOpcionesSeleccionadas({});
                }}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarOpcionesProducto}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                ✓ Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
