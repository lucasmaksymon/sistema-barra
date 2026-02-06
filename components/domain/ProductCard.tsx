import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  tipo?: 'SIMPLE' | 'BASE' | 'COMPUESTO';
  activo?: boolean;
}

export interface ProductCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

export const ProductCard = ({
  product,
  onAdd,
  onEdit,
  onDelete,
  showActions = true,
  variant = 'default',
}: ProductCardProps) => {
  const tipoLabels = {
    SIMPLE: 'Simple',
    BASE: 'Base',
    COMPUESTO: 'Combo',
  };
  
  const tipoColors = {
    SIMPLE: 'success' as const,
    BASE: 'gray' as const,
    COMPUESTO: 'info' as const,
  };
  
  if (variant === 'compact') {
    return (
      <button
        onClick={() => onAdd?.(product)}
        className="card p-3 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left w-full"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-bold text-white text-sm mb-1">{product.nombre}</h4>
            {product.categoria && (
              <p className="text-xs text-gray-400">{product.categoria}</p>
            )}
          </div>
          {product.tipo && (
            <Badge variant={tipoColors[product.tipo]} size="sm">
              {tipoLabels[product.tipo]}
            </Badge>
          )}
        </div>
        <p className="text-lg font-bold text-blue-400">
          ${Number(product.precio).toFixed(2)}
        </p>
      </button>
    );
  }
  
  return (
    <Card hover padding="md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{product.nombre}</h3>
          <p className="text-xs text-gray-400 mb-2">Código: {product.codigo}</p>
          {product.descripcion && (
            <p className="text-sm text-gray-300 line-clamp-2">
              {product.descripcion}
            </p>
          )}
        </div>
        {product.tipo && (
          <Badge variant={tipoColors[product.tipo]}>
            {tipoLabels[product.tipo]}
          </Badge>
        )}
      </div>
      
      {product.categoria && (
        <div className="mb-3">
          <Badge variant="gray" size="sm">
            {product.categoria}
          </Badge>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4">
        <p className="text-2xl font-bold text-blue-400">
          ${Number(product.precio).toFixed(2)}
        </p>
        
        {showActions && (
          <div className="flex gap-2">
            {onAdd && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAdd(product)}
              >
                Agregar
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(product)}
              >
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(product)}
              >
                Eliminar
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
