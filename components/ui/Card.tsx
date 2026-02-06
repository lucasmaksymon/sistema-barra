import { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
  children,
  hover = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) => {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };
  
  const hoverClass = hover
    ? 'hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer'
    : '';
  
  return (
    <div
      className={`card ${paddingClasses[padding]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}: CardHeaderProps) => {
  return (
    <div
      className={`flex items-start justify-between mb-3 ${className}`}
      {...props}
    >
      <div className="flex-1">
        {title && (
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-400">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
};

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const CardBody = ({
  children,
  className = '',
  ...props
}: CardBodyProps) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  divided?: boolean;
}

export const CardFooter = ({
  children,
  divided = false,
  className = '',
  ...props
}: CardFooterProps) => {
  const dividedClass = divided ? 'border-t border-gray-700 pt-3 mt-3' : '';
  
  return (
    <div className={`${dividedClass} ${className}`} {...props}>
      {children}
    </div>
  );
};
