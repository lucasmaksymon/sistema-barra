import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  } & Partial<ButtonProps>;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="text-6xl mb-4 opacity-50">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      
      {description && (
        <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>
      )}
      
      {action && (
        <Button
          variant={action.variant || 'primary'}
          size={action.size || 'md'}
          onClick={action.onClick}
          {...action}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Empty states predefinidos
export const NoResultsEmpty = ({ onReset }: { onReset?: () => void }) => {
  return (
    <EmptyState
      icon="🔍"
      title="No se encontraron resultados"
      description="Intenta ajustar los filtros o términos de búsqueda"
      action={
        onReset
          ? {
              label: 'Limpiar filtros',
              onClick: onReset,
              variant: 'ghost',
            }
          : undefined
      }
    />
  );
};

export const NoDataEmpty = ({
  entity,
  onCreate,
}: {
  entity: string;
  onCreate?: () => void;
}) => {
  return (
    <EmptyState
      icon="📦"
      title={`No hay ${entity} todavía`}
      description={`Comienza creando tu primer ${entity}`}
      action={
        onCreate
          ? {
              label: `Crear ${entity}`,
              onClick: onCreate,
              variant: 'primary',
            }
          : undefined
      }
    />
  );
};

export const ErrorEmpty = ({ onRetry }: { onRetry?: () => void }) => {
  return (
    <EmptyState
      icon="⚠️"
      title="Algo salió mal"
      description="No pudimos cargar los datos. Por favor, intenta nuevamente."
      action={
        onRetry
          ? {
              label: 'Reintentar',
              onClick: onRetry,
              variant: 'primary',
            }
          : undefined
      }
    />
  );
};
