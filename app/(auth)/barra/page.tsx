'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui';
import { Button, Input, Select, Card, LoadingPage } from '@/components/ui';
import { QRScanner } from '@/components/domain';
import { EstadoPagoBadge, EstadoPedidoBadge } from '@/components/ui/Badge';

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
  const router = useRouter();
  const toast = useToast();
  
  // Estados principales
  const [eventos, setEventos] = useState<any[]>([]);
  const [barras, setBarras] = useState<any[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [barraSeleccionada, setBarraSeleccionada] = useState('');
  const [codigoQR, setCodigoQR] = useState('');
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [itemsEntrega, setItemsEntrega] = useState<{ [key: string]: number }>({});
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarBarras(eventoSeleccionado);
    }
  }, [eventoSeleccionado]);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sesión expirada', 'Redirigiendo al login...');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }
    
    setLoadingInicial(true);
    
    try {
      const [resEventos, resBarras] = await Promise.all([
        fetch('/api/eventos?activo=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/barras', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      if (resEventos.status === 401 || resEventos.status === 403) {
        toast.error('Sesión expirada', 'Por favor, inicia sesión nuevamente');
        setTimeout(() => {
          localStorage.removeItem('token');
          router.push('/login');
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
      } else if (dataEventos.data?.length === 0) {
        toast.warning('Sin eventos', 'No hay eventos activos disponibles');
      }

      if (dataBarras.success) {
        setBarras(dataBarras.data);
        if (dataBarras.data.length > 0) {
          setBarraSeleccionada(dataBarras.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error de conexión', 'No se pudieron cargar los datos');
    } finally {
      setLoadingInicial(false);
    }
  };

  const cargarBarras = async (eventoId: string) => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`/api/eventos/${eventoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success && data.data.barras && data.data.barras.length > 0) {
        setBarras(data.data.barras);
        setBarraSeleccionada(data.data.barras[0].id);
      } else {
        toast.warning('Sin barras', 'No hay barras disponibles para este evento');
        setBarras([]);
        setBarraSeleccionada('');
      }
    } catch (error) {
      console.error('Error al cargar barras:', error);
      setBarras([]);
      setBarraSeleccionada('');
    }
  };

  const buscarPedido = async (token?: string) => {
    const qrToken = token || codigoQR.trim();
    
    if (!qrToken) {
      toast.warning('Código requerido', 'Ingresa un código QR');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/qr/${qrToken}`);
      const data = await res.json();

      if (data.success) {
        setPedido(data.data);
        setCodigoQR(qrToken);
        
        // Inicializar cantidades de entrega
        const cantidades: { [key: string]: number } = {};
        data.data.items.forEach((item: PedidoItem) => {
          const restante = item.cantidad - item.cantidadEntregada;
          cantidades[item.id] = restante > 0 ? 1 : 0;
        });
        setItemsEntrega(cantidades);
        
        toast.success('Pedido encontrado', `${data.data.codigo}`);
      } else {
        toast.error('Pedido no encontrado', data.error || 'Verifica el código QR');
        setPedido(null);
      }
    } catch (error) {
      toast.error('Error de conexión', 'No se pudo buscar el pedido');
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

  const seleccionarTodo = () => {
    if (!pedido) return;
    
    const nuevosItems: { [key: string]: number } = {};
    pedido.items.forEach((item) => {
      const restante = item.cantidad - item.cantidadEntregada;
      if (restante > 0) {
        nuevosItems[item.id] = restante;
      }
    });
    setItemsEntrega(nuevosItems);
    toast.success('Todo seleccionado', 'Listo para confirmar la entrega');
  };

  const confirmarEntrega = async () => {
    if (!pedido) {
      toast.error('Sin pedido', 'No hay pedido cargado');
      return;
    }
    
    if (!barraSeleccionada) {
      toast.error(
        'Sin barra',
        'No hay barra seleccionada. Verifica que haya un evento activo con barras disponibles'
      );
      return;
    }

    const itemsParaEntregar = Object.entries(itemsEntrega)
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([itemId, cantidad]) => ({
        pedidoItemId: itemId,
        cantidadEntregada: cantidad,
      }));

    if (itemsParaEntregar.length === 0) {
      toast.warning(
        'Sin items',
        'Selecciona cantidades para entregar usando los botones +/- o "Seleccionar Todo"'
      );
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
        toast.success('Entrega confirmada', 'La entrega se registró correctamente');
        
        // Recargar pedido actualizado
        setTimeout(() => {
          buscarPedido();
        }, 1000);
      } else {
        toast.error('Error al entregar', data.error || 'Intenta nuevamente');
      }
    } catch (error) {
      toast.error('Error de conexión', 'No se pudo registrar la entrega');
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => {
    setCodigoQR('');
    setPedido(null);
    setItemsEntrega({});
    setIsScanning(false);
  };

  const handleScanQR = async (qrValue: string) => {
    // Extraer solo el token del QR (última parte de la URL)
    const token = qrValue.includes('/') ? qrValue.split('/').pop() || qrValue : qrValue;
    setIsScanning(false);
    await buscarPedido(token);
  };

  if (loadingInicial) {
    return <LoadingPage text="Cargando sistema de barra..." />;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Configuración */}
      <Card>
        <h3 className="text-lg font-bold text-white mb-4">📍 Configuración</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Evento"
            value={eventoSeleccionado}
            onChange={(e) => setEventoSeleccionado(e.target.value)}
            options={eventos.map(e => ({ value: e.id, label: e.nombre }))}
            placeholder={eventos.length === 0 ? 'No hay eventos disponibles' : undefined}
          />
          
          <Select
            label="Barra"
            value={barraSeleccionada}
            onChange={(e) => setBarraSeleccionada(e.target.value)}
            options={barras.map(b => ({ value: b.id, label: b.nombre }))}
            placeholder={barras.length === 0 ? 'No hay barras disponibles' : undefined}
          />
        </div>
        
        {barraSeleccionada ? (
          <div className="mt-3 p-2 bg-green-900/20 border border-green-600 rounded-lg">
            <p className="text-sm text-green-400">✓ Barra seleccionada correctamente</p>
          </div>
        ) : barras.length === 0 && eventos.length > 0 && (
          <div className="mt-3 p-2 bg-red-900/20 border border-red-600 rounded-lg">
            <p className="text-sm text-red-400">
              ⚠️ No hay barras disponibles. Contacta al administrador.
            </p>
          </div>
        )}
      </Card>

      {/* Escáner QR */}
      <Card>
        <h2 className="text-xl font-bold text-white mb-4">Escanear Pedido</h2>
        
        {!isScanning ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={codigoQR}
                onChange={(e) => setCodigoQR(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarPedido()}
                placeholder="Código QR..."
                className="flex-1"
              />
              <Button onClick={() => buscarPedido()} disabled={loading} isLoading={loading}>
                Buscar
              </Button>
              {pedido && (
                <Button onClick={limpiar} variant="secondary">
                  Limpiar
                </Button>
              )}
            </div>
            
            <Button
              variant="success"
              fullWidth
              onClick={() => setIsScanning(true)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              }
            >
              Activar Cámara para Escanear QR
            </Button>
          </div>
        ) : (
          <QRScanner
            onScan={handleScanQR}
            isScanning={isScanning}
            onToggleScanner={() => setIsScanning(!isScanning)}
            allowManualInput={false}
          />
        )}
      </Card>

      {/* Detalle del Pedido */}
      {pedido ? (
        <Card>
          <div className="mb-6 pb-4 border-b border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-3">{pedido.codigo}</h3>
            <div className="flex flex-wrap gap-2">
              <EstadoPagoBadge estado={pedido.estadoPago} />
              <EstadoPedidoBadge estado={pedido.estadoPedido} />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4 mb-6">
            <h4 className="text-lg font-bold text-white">Items del Pedido</h4>
            
            {pedido.items.map((item) => {
              const restante = item.cantidad - item.cantidadEntregada;
              const estaCompleto = restante === 0;

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    estaCompleto
                      ? 'bg-green-900/20 border-green-600'
                      : 'bg-[#0f1419] border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-white">{item.producto.nombre}</p>
                      <p className="text-sm text-gray-400">
                        Entregado: {item.cantidadEntregada} / {item.cantidad}
                        {estaCompleto && ' ✓'}
                      </p>
                    </div>
                    {!estaCompleto && (
                      <span className="bg-yellow-900/20 text-yellow-400 border border-yellow-600 px-3 py-1 rounded-lg text-sm font-semibold">
                        Faltan {restante}
                      </span>
                    )}
                  </div>

                  {!estaCompleto && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-[#0f1419] border border-gray-800 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-300">Entregar:</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => cambiarCantidad(item.id, -1)}
                          >
                            −
                          </Button>
                          <span className="text-2xl font-bold w-12 text-center text-white">
                            {itemsEntrega[item.id] || 0}
                          </span>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => cambiarCantidad(item.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => setItemsEntrega({ ...itemsEntrega, [item.id]: restante })}
                      >
                        Entregar todo ({restante})
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info de cantidades */}
          {pedido.estadoPedido !== 'DELIVERED' && pedido.estadoPago === 'PAID' && (
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
              <p className="text-sm text-blue-300">
                📋 Cantidades seleccionadas:{' '}
                {Object.values(itemsEntrega).reduce((sum, cant) => sum + cant, 0) === 0
                  ? '⚠️ Ninguna (usa el botón de abajo)'
                  : `${Object.values(itemsEntrega).reduce((sum, cant) => sum + cant, 0)} items`}
              </p>
            </div>
          )}

          {/* Acciones */}
          {pedido.estadoPedido !== 'DELIVERED' && pedido.estadoPago === 'PAID' && (
            <div className="space-y-3">
              <Button variant="primary" size="lg" fullWidth onClick={seleccionarTodo}>
                ⚡ SELECCIONAR TODO EL PEDIDO
              </Button>
              
              <Button
                variant="success"
                size="lg"
                fullWidth
                onClick={confirmarEntrega}
                disabled={loading}
                isLoading={loading}
              >
                ✓ CONFIRMAR ENTREGA
              </Button>
            </div>
          )}

          {pedido.estadoPedido !== 'DELIVERED' && pedido.estadoPago !== 'PAID' && (
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 text-center">
              <p className="text-yellow-400 font-bold">⏳ ESPERANDO PAGO</p>
              <p className="text-sm text-gray-300 mt-1">
                El pedido no puede ser entregado hasta que sea aprobado
              </p>
            </div>
          )}

          {pedido.estadoPedido === 'DELIVERED' && (
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 text-center">
              <p className="text-green-400 font-bold text-lg">
                ✓ Pedido completamente entregado
              </p>
            </div>
          )}
        </Card>
      ) : !loading && (
        <Card padding="lg" className="text-center">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-bold text-white mb-2">Escanea un código QR</h3>
          <p className="text-gray-400">
            Ingresa o escanea el código QR del pedido para comenzar la entrega
          </p>
        </Card>
      )}
    </div>
  );
}
