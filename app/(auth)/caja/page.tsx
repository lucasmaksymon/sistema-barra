'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui';
import { Button, Input, Card, Modal, LoadingPage } from '@/components/ui';
import { ProductCard, CartItem, CartSummary, QRScanner, QRDisplay } from '@/components/domain';
import { useDebounce } from '@/hooks';

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
  opcionesComponentes?: Record<string, string>;
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
  const router = useRouter();
  const toast = useToast();
  
  // Estados principales
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [cajaSeleccionada, setCajaSeleccionada] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [metodoPago, setMetodoPago] = useState<'CASH' | 'TRANSFER' | 'QR_CONSUMO'>('CASH');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas');
  
  // Estados para QR de consumo
  const [qrConsumoToken, setQrConsumoToken] = useState('');
  const [qrConsumoInfo, setQrConsumoInfo] = useState<any>(null);
  const [validandoQR, setValidandoQR] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Estados para combos
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [recetaProducto, setRecetaProducto] = useState<any>(null);
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState<Record<string, string>>({});
  const [mostrarModalOpciones, setMostrarModalOpciones] = useState(false);
  
  // Estado para pedido creado
  const [pedidoCreado, setPedidoCreado] = useState<any>(null);
  
  // Estado para mostrar carrito en mobile
  const [mostrarCarritoMobile, setMostrarCarritoMobile] = useState(false);
  
  // Debounce de búsqueda
  const busquedaDebounced = useDebounce(busqueda, 300);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarCajas(eventoSeleccionado);
    }
  }, [eventoSeleccionado]);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sesión expirada', 'Por favor, inicia sesión nuevamente');
      router.push('/login');
      return;
    }
    
    setLoadingInicial(true);
    
    try {
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
        const productosVendibles = dataProductos.data.filter(
          (p: Producto) => p.tipo !== 'BASE'
        );
        setProductos(productosVendibles);
      }
    } catch (error) {
      toast.error('Error al cargar datos', 'No se pudieron cargar los productos');
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
      
      if (data.success) {
        setCajas(data.data.cajas);
        if (data.data.cajas.length > 0) {
          setCajaSeleccionada(data.data.cajas[0].id);
        }
      }
    } catch (error) {
      console.error('Error al cargar cajas:', error);
    }
  };

  const agregarAlCarrito = async (producto: Producto) => {
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
            
            if (receta.gruposOpcionales && Object.keys(receta.gruposOpcionales).length > 0) {
              setProductoSeleccionado(producto);
              setRecetaProducto(receta);
              
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
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener receta:', error);
      }
    }
    
    agregarProductoDirecto(producto, {});
  };

  const agregarProductoDirecto = (producto: Producto, opcionesComponentes: Record<string, string>) => {
    const existe = carrito.find((item) => 
      item.producto.id === producto.id && 
      JSON.stringify(item.opcionesComponentes) === JSON.stringify(opcionesComponentes)
    );
    
    if (existe) {
      const nuevaCantidad = existe.cantidad + 1;
      setCarrito(
        carrito.map((item) =>
          item.producto.id === producto.id && 
          JSON.stringify(item.opcionesComponentes) === JSON.stringify(opcionesComponentes)
            ? { ...item, cantidad: nuevaCantidad }
            : item
        )
      );
      toast.success('✓ Agregado', `${producto.nombre} (x${nuevaCantidad})`);
    } else {
      setCarrito([...carrito, { producto, cantidad: 1, opcionesComponentes }]);
      toast.success('✓ Agregado', `${producto.nombre} al carrito`);
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

  const eliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
    toast.info('Producto eliminado', 'El producto fue removido del carrito');
  };

  const validarQRConsumo = async (token: string) => {
    setValidandoQR(true);
    
    try {
      const authToken = localStorage.getItem('token');
      const res = await fetch('/api/qr-consumo/validar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ qrToken: token }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setQrConsumoInfo(data.qrConsumo);
        setQrConsumoToken(token);
        toast.success(
          'QR validado correctamente',
          `Saldo disponible: $${data.qrConsumo.saldoActual.toFixed(2)}`
        );
      } else {
        toast.error('QR no válido', data.error || 'El QR de consumo no es válido');
        setQrConsumoInfo(null);
        setQrConsumoToken('');
      }
    } catch (error) {
      toast.error('Error de conexión', 'No se pudo validar el QR de consumo');
      setQrConsumoInfo(null);
      setQrConsumoToken('');
    } finally {
      setValidandoQR(false);
    }
  };

  const crearPedido = async () => {
    if (!eventoSeleccionado || !cajaSeleccionada) {
      toast.warning('Datos incompletos', 'Selecciona un evento y una caja');
      return;
    }
    
    if (carrito.length === 0) {
      toast.warning('Carrito vacío', 'Agrega productos al carrito');
      return;
    }
    
    if (metodoPago === 'QR_CONSUMO' && !qrConsumoToken) {
      toast.warning('QR requerido', 'Valida un QR de consumo');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
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
          qrConsumoToken: metodoPago === 'QR_CONSUMO' ? qrConsumoToken : undefined,
          items: carrito.map((item) => ({
            productoId: item.producto.id,
            cantidad: item.cantidad,
            precioUnitario: item.producto.precio,
            opcionesComponentes: item.opcionesComponentes,
          })),
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setPedidoCreado(data.data);
        setCarrito([]);
        setQrConsumoToken('');
        setQrConsumoInfo(null);
        
        const esPendiente = data.data.estadoPago === 'PENDING_PAYMENT';
        toast.success(
          esPendiente ? 'Pedido pendiente de aprobación' : 'Pedido creado',
          `Código: ${data.data.codigo}`
        );
      } else {
        toast.error('Error al crear pedido', data.error || 'Intenta nuevamente');
      }
    } catch (error) {
      toast.error('Error de conexión', 'No se pudo crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos
  const categorias = ['Todas', ...Array.from(new Set(productos.map(p => p.categoria).filter(Boolean)))];
  
  const productosFiltrados = productos.filter((producto) => {
    const coincideCategoria =
      categoriaSeleccionada === 'Todas' || producto.categoria === categoriaSeleccionada;
    const coincideBusqueda =
      producto.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(busquedaDebounced.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });
  
  // Calcular total del carrito
  const totalCarrito = carrito.reduce(
    (sum, item) => sum + item.producto.precio * item.cantidad,
    0
  );
  
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  if (loadingInicial) {
    return <LoadingPage text="Cargando productos..." />;
  }

  // Vista de pedido creado
  if (pedidoCreado) {
    const qrUrl = `${window.location.origin}/qr/${pedidoCreado.qrToken}`;
    const esPendiente = pedidoCreado.estadoPago === 'PENDING_PAYMENT';
    
    return (
      <div className="min-h-screen p-4 max-w-2xl mx-auto flex items-center justify-center">
        <Card padding="lg" className="text-center w-full">
          <div className={`text-5xl mb-4 ${esPendiente ? 'text-yellow-500' : 'text-green-500'}`}>
            {esPendiente ? '⏳' : '✓'}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {esPendiente ? 'Pedido Pendiente' : 'Pedido Creado'}
          </h2>
          
          <p className="text-gray-400 mb-6">
            {esPendiente
              ? 'Esperando aprobación de transferencia'
              : 'El pedido se creó correctamente'}
          </p>
          
          <QRDisplay
            value={qrUrl}
            title={pedidoCreado.codigo}
            subtitle="Presenta este QR en la barra"
            showDownload
          />
          
          <div className="mt-6 p-4 bg-[#0f1419] rounded-lg text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Total:</span>
              <span className="text-white font-bold text-xl">
                ${Number(pedidoCreado.total).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Método:</span>
              <span className="text-white">
                {metodoPago === 'CASH' && '💵 Efectivo'}
                {metodoPago === 'TRANSFER' && '🏦 Transferencia'}
                {metodoPago === 'QR_CONSUMO' && '🎫 QR Consumo'}
              </span>
            </div>
          </div>
          
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setPedidoCreado(null)}
            className="mt-6"
          >
            Crear Nuevo Pedido
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 max-w-7xl mx-auto pb-28 lg:pb-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Panel izquierdo - Catálogo */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <h2 className="text-xl font-bold text-white mb-3">Productos</h2>
            
            {/* Filtros */}
            <div className="mb-3">
              <Input
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                className="mb-2"
              />
              
              {/* Categorías como botones */}
              <div className="flex flex-wrap gap-1.5">
                {categorias.map((categoria) => (
                  <button
                    key={categoria}
                    onClick={() => setCategoriaSeleccionada(categoria)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      categoriaSeleccionada === categoria
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {categoria}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Grid de productos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto scrollbar-hide">
              {productosFiltrados.map((producto) => (
                <ProductCard
                  key={producto.id}
                  product={producto}
                  onAdd={agregarAlCarrito}
                  variant="compact"
                />
              ))}
            </div>
            
            {productosFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No se encontraron productos
              </div>
            )}
          </Card>
        </div>
        
        {/* Panel derecho - Carrito (Desktop) */}
        <div className="hidden lg:block space-y-3">
          <Card>
            <h3 className="text-lg font-bold text-white mb-3">Carrito</h3>
            
            {carrito.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">🛒</p>
                <p>Carrito vacío</p>
              </div>
            ) : (
              <div className="space-y-1.5 mb-3 max-h-[350px] overflow-y-auto scrollbar-hide">
                {carrito.map((item, index) => (
                  <CartItem
                    key={index}
                    item={item}
                    index={index}
                    onUpdateQuantity={cambiarCantidad}
                    onRemove={eliminarDelCarrito}
                  />
                ))}
              </div>
            )}
          </Card>
          
          {carrito.length > 0 && (
            <>
              <CartSummary items={carrito} metodoPago={metodoPago} />
              
              <Card>
                <h3 className="text-sm font-bold text-white mb-2">Método de Pago</h3>
                
                {/* Métodos de pago como cards */}
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => setMetodoPago('CASH')}
                    className={`p-2 rounded-lg text-sm font-medium text-left transition-colors ${
                      metodoPago === 'CASH'
                        ? 'bg-green-600 text-white border-2 border-green-500'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💵</span>
                      <span>Efectivo</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setMetodoPago('TRANSFER')}
                    className={`p-2 rounded-lg text-sm font-medium text-left transition-colors ${
                      metodoPago === 'TRANSFER'
                        ? 'bg-blue-600 text-white border-2 border-blue-500'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏦</span>
                      <span>Transferencia</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setMetodoPago('QR_CONSUMO')}
                    className={`p-2 rounded-lg text-sm font-medium text-left transition-colors ${
                      metodoPago === 'QR_CONSUMO'
                        ? 'bg-purple-600 text-white border-2 border-purple-500'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎫</span>
                      <span>QR Consumo</span>
                    </div>
                  </button>
                </div>
                
                {metodoPago === 'QR_CONSUMO' && (
                  <div className="mt-4">
                    <QRScanner
                      onScan={validarQRConsumo}
                      isScanning={isScanning}
                      onToggleScanner={() => setIsScanning(!isScanning)}
                      allowManualInput
                    />
                    
                    {qrConsumoInfo && (
                      <div className="mt-3 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                        <p className="text-sm text-green-400 font-medium">
                          ✓ QR Validado
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          Saldo: ${Number(qrConsumoInfo.saldoActual).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
              
              <Button
                variant="success"
                size="lg"
                fullWidth
                onClick={crearPedido}
                isLoading={loading}
                disabled={loading || (metodoPago === 'QR_CONSUMO' && !qrConsumoToken)}
              >
                Crear Pedido
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Botón flotante móvil - Carrito */}
      {carrito.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-2 bg-[#0f1419] z-50">
          <div className="bg-[#1a1f2e] rounded-xl p-2 border-2 border-blue-600 shadow-2xl shadow-blue-600/20">
            <div className="flex items-center gap-3">
              {/* Badge de items */}
              <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-center min-w-[50px]">
                <div className="text-xl">{totalItems}</div>
                <div className="text-[9px] opacity-80">items</div>
              </div>
              
              {/* Total */}
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
                <p className="text-xl font-bold text-white">
                  ${totalCarrito.toFixed(2)}
                </p>
              </div>
              
              {/* Botón de acción */}
              <Button
                variant="success"
                size="lg"
                onClick={() => setMostrarCarritoMobile(true)}
                className="whitespace-nowrap px-6"
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">🛒</span>
                  <span className="text-xs">Ver</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Carrito Mobile */}
      {mostrarCarritoMobile && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-[#0f1419] overflow-y-auto">
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-white">Mi Carrito</h2>
              <button
                onClick={() => setMostrarCarritoMobile(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Items del carrito */}
            <Card className="mb-3">
              <h3 className="text-lg font-bold text-white mb-2">Productos</h3>
              <div className="space-y-1.5 mb-2 max-h-[40vh] overflow-y-auto">
                {carrito.map((item, index) => (
                  <CartItem
                    key={index}
                    item={item}
                    index={index}
                    onUpdateQuantity={cambiarCantidad}
                    onRemove={eliminarDelCarrito}
                  />
                ))}
              </div>
            </Card>
            
            {/* Resumen */}
            <CartSummary items={carrito} metodoPago={metodoPago} />
            
            {/* Método de pago */}
            <Card className="my-3">
              <h3 className="text-sm font-bold text-white mb-2">Método de Pago</h3>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => setMetodoPago('CASH')}
                  className={`p-3 rounded-lg font-medium text-left transition-colors ${
                    metodoPago === 'CASH'
                      ? 'bg-green-600 text-white border-2 border-green-500'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💵</span>
                    <span>Efectivo</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setMetodoPago('TRANSFER')}
                  className={`p-3 rounded-lg font-medium text-left transition-colors ${
                    metodoPago === 'TRANSFER'
                      ? 'bg-blue-600 text-white border-2 border-blue-500'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏦</span>
                    <span>Transferencia</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setMetodoPago('QR_CONSUMO')}
                  className={`p-3 rounded-lg font-medium text-left transition-colors ${
                    metodoPago === 'QR_CONSUMO'
                      ? 'bg-purple-600 text-white border-2 border-purple-500'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎫</span>
                    <span>QR Consumo</span>
                  </div>
                </button>
              </div>
              
              {metodoPago === 'QR_CONSUMO' && (
                <div className="mt-4">
                  <QRScanner
                    onScan={validarQRConsumo}
                    isScanning={isScanning}
                    onToggleScanner={() => setIsScanning(!isScanning)}
                    allowManualInput
                  />
                  
                  {qrConsumoInfo && (
                    <div className="mt-3 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                      <p className="text-sm text-green-400 font-medium">
                        ✓ QR Validado
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        Saldo: ${Number(qrConsumoInfo.saldoActual).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
            
            {/* Botones de acción */}
            <div className="space-y-2 pb-4">
              <Button
                variant="success"
                size="lg"
                fullWidth
                onClick={crearPedido}
                isLoading={loading}
                disabled={loading || (metodoPago === 'QR_CONSUMO' && !qrConsumoToken)}
              >
                Finalizar Pedido - ${totalCarrito.toFixed(2)}
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onClick={() => setMostrarCarritoMobile(false)}
              >
                Seguir Comprando
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de opciones de combo */}
      {mostrarModalOpciones && productoSeleccionado && recetaProducto && (
        <Modal
          isOpen={mostrarModalOpciones}
          onClose={() => setMostrarModalOpciones(false)}
          title={`Configurar ${productoSeleccionado.nombre}`}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setMostrarModalOpciones(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={confirmarOpcionesProducto}>
                Agregar al Carrito
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {Object.entries(recetaProducto.gruposOpcionales).map(([grupo, opciones]: [string, any]) => (
              <div key={grupo}>
                <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                  {grupo}:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {opciones.map((opcion: any) => (
                    <button
                      key={opcion.codigo}
                      onClick={() =>
                        setOpcionesSeleccionadas({
                          ...opcionesSeleccionadas,
                          [grupo]: opcion.codigo,
                        })
                      }
                      className={`p-3 rounded-lg font-medium text-left transition-colors ${
                        opcionesSeleccionadas[grupo] === opcion.codigo
                          ? 'bg-blue-600 text-white border-2 border-blue-500'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opcion.nombre}</span>
                        {opcionesSeleccionadas[grupo] === opcion.codigo && (
                          <span className="text-lg">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
