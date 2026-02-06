'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, Button, Select, Card, ConfirmModal, Spinner } from '@/components/ui';
import { StatsCard, PedidoCard } from '@/components/domain';

interface Stats {
  totalPedidos: number;
  pedidosPendientes: number;
  pedidosEntregados: number;
  pagosPendientes: number;
  totalVentas: number;
}

export default function AdminPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalPedidos: 0,
    pedidosPendientes: 0,
    pedidosEntregados: 0,
    pagosPendientes: 0,
    totalVentas: 0,
  });
  const [pagosPendientes, setPagosPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  
  // Modal de confirmación
  const [pedidoParaAprobar, setPedidoParaAprobar] = useState<any>(null);
  const [accionAprobacion, setAccionAprobacion] = useState<'aprobar' | 'rechazar' | null>(null);

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarDashboard();
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
      toast.error('Error', 'No se pudieron cargar los eventos');
    }
  };

  const cargarDashboard = async () => {
    const token = localStorage.getItem('token');
    setLoadingDashboard(true);
    
    try {
      const [resPedidos, resPagos] = await Promise.all([
        fetch(`/api/pedidos?eventoId=${eventoSeleccionado}&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/pagos/pendientes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [dataPedidos, dataPagos] = await Promise.all([
        resPedidos.json(),
        resPagos.json(),
      ]);
      
      if (dataPedidos.success) {
        const pedidos = dataPedidos.data.pedidos;
        const newStats: Stats = {
          totalPedidos: pedidos.length,
          pedidosPendientes: pedidos.filter(
            (p: any) => p.estadoPedido === 'PENDING_DELIVERY' || p.estadoPedido === 'PARTIAL_DELIVERY'
          ).length,
          pedidosEntregados: pedidos.filter((p: any) => p.estadoPedido === 'DELIVERED').length,
          pagosPendientes: pedidos.filter(
            (p: any) => p.estadoPago === 'PENDING_PAYMENT'
          ).length,
          totalVentas: pedidos
            .filter((p: any) => p.estadoPago === 'PAID')
            .reduce((sum: number, p: any) => sum + Number(p.total), 0),
        };
        setStats(newStats);
      }

      if (dataPagos.success) {
        setPagosPendientes(dataPagos.data.filter((p: any) => p.eventoId === eventoSeleccionado));
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      toast.error('Error', 'No se pudo cargar el dashboard');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const confirmarAprobacion = (pedido: any, aprobar: boolean) => {
    setPedidoParaAprobar(pedido);
    setAccionAprobacion(aprobar ? 'aprobar' : 'rechazar');
  };

  const ejecutarAprobacion = async () => {
    if (!pedidoParaAprobar || !accionAprobacion) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/pagos/${pedidoParaAprobar.id}/aprobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ aprobado: accionAprobacion === 'aprobar' }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          accionAprobacion === 'aprobar' ? 'Pago aprobado' : 'Pago rechazado',
          data.message
        );
        cargarDashboard();
      } else {
        toast.error('Error', data.error || 'No se pudo procesar la acción');
      }
    } catch (error) {
      toast.error('Error de conexión', 'No se pudo procesar la acción');
    } finally {
      setLoading(false);
      setPedidoParaAprobar(null);
      setAccionAprobacion(null);
    }
  };

  return (
    <div className="p-3 md:p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-gray-400">Panel de control y gestión del sistema</p>
          </div>
          <div className="hidden sm:block text-4xl">📊</div>
        </div>
        
        <Card>
          <Select
            label="🎪 Evento Activo"
            value={eventoSeleccionado}
            onChange={(e) => setEventoSeleccionado(e.target.value)}
            options={eventos.map(e => ({ value: e.id, label: e.nombre }))}
            className="md:w-96"
          />
        </Card>
      </div>

      {/* Stats */}
      {loadingDashboard ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" text="Cargando estadísticas..." />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4">
          <StatsCard
            title="Total Pedidos"
            value={stats.totalPedidos}
            icon="📋"
            color="blue"
            subtitle="Pedidos registrados"
          />
          
          <StatsCard
            title="Pendientes"
            value={stats.pedidosPendientes}
            icon="⏳"
            color="yellow"
            subtitle="Por entregar"
          />
          
          <StatsCard
            title="Entregados"
            value={stats.pedidosEntregados}
            icon="✅"
            color="green"
            subtitle="Completados"
          />
          
          <StatsCard
            title="Ventas Totales"
            value={`$${stats.totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon="💰"
            color="purple"
            subtitle="Ingresos generados"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pagos Pendientes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">💳</span>
              Transferencias Pendientes
            </h2>
            <span className="bg-yellow-600 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-lg">
              {pagosPendientes.length}
            </span>
          </div>

          {pagosPendientes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-semibold">No hay pagos pendientes</p>
              <p className="text-xs mt-1">Todas las transferencias han sido procesadas</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
              {pagosPendientes.map((pedido) => (
                <Card key={pedido.id} padding="md" className="border-2 border-yellow-600/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-white text-lg mb-1">{pedido.codigo}</p>
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold">Caja:</span> {pedido.caja.nombre}
                      </p>
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold">Cajero:</span> {pedido.cajero.nombre}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        📅 {new Date(pedido.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-400">
                        ${Number(pedido.total).toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">🏦 Transferencia</p>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-300">
                      <span className="font-semibold">ℹ️ Instrucción:</span> Verifica el comprobante de transferencia antes de aprobar.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      fullWidth
                      onClick={() => confirmarAprobacion(pedido, true)}
                      disabled={loading}
                    >
                      ✓ Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      fullWidth
                      onClick={() => confirmarAprobacion(pedido, false)}
                      disabled={loading}
                    >
                      ✗ Rechazar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Stock Bajo - Deshabilitado */}
        <Card className="opacity-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Stock Bajo
            </h2>
            <span className="bg-gray-700 text-gray-400 px-3 py-1 rounded-lg text-sm font-semibold">
              DESHABILITADO
            </span>
          </div>
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Control de stock deshabilitado</p>
            <p className="text-xs text-gray-600">Las alertas de stock no están activas</p>
          </div>
        </Card>
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={!!pedidoParaAprobar}
        onClose={() => {
          setPedidoParaAprobar(null);
          setAccionAprobacion(null);
        }}
        onConfirm={ejecutarAprobacion}
        title={accionAprobacion === 'aprobar' ? 'Aprobar Pago' : 'Rechazar Pago'}
        message={
          accionAprobacion === 'aprobar'
            ? `¿Confirmas que recibiste la transferencia del pedido ${pedidoParaAprobar?.codigo}?`
            : `¿Estás seguro de rechazar el pago del pedido ${pedidoParaAprobar?.codigo}?`
        }
        confirmText={accionAprobacion === 'aprobar' ? 'Aprobar' : 'Rechazar'}
        variant={accionAprobacion === 'aprobar' ? 'primary' : 'danger'}
        isLoading={loading}
      />
    </div>
  );
}
