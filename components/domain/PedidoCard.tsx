import { Card } from '@/components/ui/Card';
import { EstadoPagoBadge, EstadoPedidoBadge, MetodoPagoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface PedidoData {
  id: string;
  codigo: string;
  estadoPago: string;
  estadoPedido: string;
  metodoPago: string;
  total: number;
  subtotal: number;
  createdAt: string;
  caja?: {
    nombre: string;
  };
  cajero?: {
    nombre: string;
  };
  items?: Array<{
    id: string;
    cantidad: number;
    cantidadEntregada: number;
    producto: {
      nombre: string;
    };
  }>;
}

export interface PedidoCardProps {
  pedido: PedidoData;
  onView?: (pedido: PedidoData) => void;
  onApprove?: (pedido: PedidoData) => void;
  onReject?: (pedido: PedidoData) => void;
  onDeliver?: (pedido: PedidoData) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

export const PedidoCard = ({
  pedido,
  onView,
  onApprove,
  onReject,
  onDeliver,
  showActions = true,
  variant = 'default',
}: PedidoCardProps) => {
  const fecha = new Date(pedido.createdAt).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const totalItems = pedido.items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;
  const itemsEntregados = pedido.items?.reduce((sum, item) => sum + item.cantidadEntregada, 0) || 0;
  
  if (variant === 'compact') {
    return (
      <button
        onClick={() => onView?.(pedido)}
        className="card p-3 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left w-full"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-bold text-white text-sm">{pedido.codigo}</p>
            <p className="text-xs text-gray-400">{fecha}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <EstadoPagoBadge estado={pedido.estadoPago} />
            <EstadoPedidoBadge estado={pedido.estadoPedido} />
          </div>
        </div>
        <p className="text-lg font-bold text-blue-400">${Number(pedido.total).toFixed(2)}</p>
      </button>
    );
  }
  
  return (
    <Card hover padding="md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{pedido.codigo}</h3>
          <p className="text-xs text-gray-400 mb-2">{fecha}</p>
          
          {pedido.cajero && (
            <p className="text-sm text-gray-300">
              Cajero: {pedido.cajero.nombre}
            </p>
          )}
          {pedido.caja && (
            <p className="text-xs text-gray-400">
              {pedido.caja.nombre}
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-2 items-end">
          <EstadoPagoBadge estado={pedido.estadoPago} />
          <EstadoPedidoBadge estado={pedido.estadoPedido} />
          <MetodoPagoBadge metodo={pedido.metodoPago} />
        </div>
      </div>
      
      {pedido.items && pedido.items.length > 0 && (
        <div className="mb-3 p-2 bg-[#0f1419] rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Items del pedido:</p>
          <div className="space-y-1">
            {pedido.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-300">
                  {item.producto.nombre}
                </span>
                <span className="text-gray-400">
                  {item.cantidadEntregada}/{item.cantidad}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between text-xs">
            <span className="text-gray-400">Total items:</span>
            <span className="text-white font-medium">
              {itemsEntregados}/{totalItems}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-2xl font-bold text-blue-400">
            ${Number(pedido.total).toFixed(2)}
          </p>
        </div>
        
        {showActions && (
          <div className="flex gap-2 flex-wrap justify-end">
            {onView && (
              <Button variant="ghost" size="sm" onClick={() => onView(pedido)}>
                Ver
              </Button>
            )}
            {onApprove && pedido.estadoPago === 'PENDING_PAYMENT' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => onApprove(pedido)}
              >
                Aprobar
              </Button>
            )}
            {onReject && pedido.estadoPago === 'PENDING_PAYMENT' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onReject(pedido)}
              >
                Rechazar
              </Button>
            )}
            {onDeliver && pedido.estadoPago === 'PAID' && pedido.estadoPedido !== 'DELIVERED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onDeliver(pedido)}
              >
                Entregar
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
