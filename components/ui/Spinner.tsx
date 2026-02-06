import { HTMLAttributes } from 'react';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'current';
  text?: string;
}

export const Spinner = ({
  size = 'md',
  color = 'primary',
  text,
  className = '',
  ...props
}: SpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  
  const colorClasses = {
    primary: 'border-blue-600',
    white: 'border-white',
    current: 'border-current',
  };
  
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} {...props}>
      <div
        className={`${sizeClasses[size]} rounded-full border-b-2 ${colorClasses[color]}`}
      />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
};

export const LoadingOverlay = ({ text = 'Cargando...' }: { text?: string }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <Spinner size="lg" text={text} />
      </div>
    </div>
  );
};

export const LoadingPage = ({ text = 'Cargando...' }: { text?: string }) => {
  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
      <Spinner size="xl" text={text} />
    </div>
  );
};
