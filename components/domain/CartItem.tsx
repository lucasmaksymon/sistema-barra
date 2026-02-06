import { Button } from '@/components/ui/Button';

export interface CartItemData {
  producto: {
    id: string;
    nombre: string;
    precio: number;
    codigo?: string;
  };
  cantidad: number;
  opcionesComponentes?: Record<string, string>;
}

export interface CartItemProps {
  item: CartItemData;
  index: number;
  onUpdateQuantity?: (index: number, delta: number) => void;
  onRemove?: (index: number) => void;
  showOptions?: boolean;
  readonly?: boolean;
}

export const CartItem = ({
  item,
  index,
  onUpdateQuantity,
  onRemove,
  showOptions = true,
  readonly = false,
}: CartItemProps) => {
  const subtotal = item.cantidad * Number(item.producto.precio);
  
  return (
    <div className="card p-3 mb-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm mb-1 truncate">
            {item.producto.nombre}
          </h4>
          
          {item.producto.codigo && (
            <p className="text-xs text-gray-400 mb-1">{item.producto.codigo}</p>
          )}
          
          {showOptions && item.opcionesComponentes && Object.keys(item.opcionesComponentes).length > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {Object.entries(item.opcionesComponentes).map(([key, value]) => (
                <p key={key} className="capitalize">
                  {key}: {value}
                </p>
              ))}
            </div>
          )}
          
          <p className="text-xs text-blue-400 mt-1">
            ${Number(item.producto.precio).toFixed(2)} × {item.cantidad} = ${subtotal.toFixed(2)}
          </p>
        </div>
        
        {!readonly && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {onUpdateQuantity && (
              <div className="flex items-center gap-1 bg-[#0f1419] rounded-lg p-1">
                <button
                  onClick={() => onUpdateQuantity(index, -1)}
                  className="w-7 h-7 flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium text-white">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => onUpdateQuantity(index, 1)}
                  className="w-7 h-7 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            )}
            
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                aria-label="Eliminar item"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const CartSummary = ({
  items,
  metodoPago,
}: {
  items: CartItemData[];
  metodoPago?: string;
}) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.cantidad * Number(item.producto.precio),
    0
  );
  
  const metodoPagoLabels: Record<string, string> = {
    CASH: '💵 Efectivo',
    TRANSFER: '🏦 Transferencia',
    QR_CONSUMO: '🎫 QR Consumo',
  };
  
  return (
    <div className="card p-4">
      <h3 className="font-bold text-white mb-3">Resumen</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Items:</span>
          <span className="text-white font-medium">{items.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Cantidad total:</span>
          <span className="text-white font-medium">
            {items.reduce((sum, item) => sum + item.cantidad, 0)}
          </span>
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-3 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-white">Total:</span>
          <span className="text-2xl font-bold text-blue-400">
            ${subtotal.toFixed(2)}
          </span>
        </div>
      </div>
      
      {metodoPago && (
        <div className="text-sm text-gray-400">
          Método: {metodoPagoLabels[metodoPago] || metodoPago}
        </div>
      )}
    </div>
  );
};
