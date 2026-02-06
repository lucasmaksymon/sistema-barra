import { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) => {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    gray: 'badge-gray',
    info: 'bg-cyan-600 text-white',
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  };
  
  return (
    <span
      className={`badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
};

// Badge específico para estados de pedidos
export const EstadoPagoBadge = ({ estado }: { estado: string }) => {
  const config = {
    PENDING_PAYMENT: { variant: 'warning' as const, label: 'Pendiente Pago', dot: true },
    PAID: { variant: 'success' as const, label: 'Pagado', dot: false },
    REJECTED: { variant: 'danger' as const, label: 'Rechazado', dot: false },
  };
  
  const { variant, label, dot } = config[estado as keyof typeof config] || {
    variant: 'gray' as const,
    label: estado,
    dot: false,
  };
  
  return <Badge variant={variant} dot={dot}>{label}</Badge>;
};

export const EstadoPedidoBadge = ({ estado }: { estado: string }) => {
  const config = {
    PENDING_DELIVERY: { variant: 'warning' as const, label: 'Pendiente', dot: true },
    PARTIAL_DELIVERY: { variant: 'info' as const, label: 'Parcial', dot: true },
    DELIVERED: { variant: 'success' as const, label: 'Entregado', dot: false },
    CANCELLED: { variant: 'danger' as const, label: 'Cancelado', dot: false },
  };
  
  const { variant, label, dot } = config[estado as keyof typeof config] || {
    variant: 'gray' as const,
    label: estado,
    dot: false,
  };
  
  return <Badge variant={variant} dot={dot}>{label}</Badge>;
};

export const MetodoPagoBadge = ({ metodo }: { metodo: string }) => {
  const config = {
    CASH: { variant: 'success' as const, label: '💵 Efectivo' },
    TRANSFER: { variant: 'info' as const, label: '🏦 Transferencia' },
    QR_CONSUMO: { variant: 'primary' as const, label: '🎫 QR Consumo' },
  };
  
  const { variant, label } = config[metodo as keyof typeof config] || {
    variant: 'gray' as const,
    label: metodo,
  };
  
  return <Badge variant={variant}>{label}</Badge>;
};
