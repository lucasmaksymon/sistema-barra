import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'btn inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f1419]';
    
    const variantClasses = {
      primary: 'btn-primary focus:ring-blue-600',
      secondary: 'btn-secondary focus:ring-gray-600',
      success: 'btn-success focus:ring-green-600',
      danger: 'btn-danger focus:ring-red-600',
      ghost: 'btn-ghost focus:ring-gray-600',
      outline: 'bg-transparent border-2 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600 focus:ring-gray-600',
    };
    
    const sizeClasses = {
      sm: 'text-xs px-2.5 py-1.5 rounded-md',
      md: 'text-sm px-3 py-2 rounded-lg',
      lg: 'text-base px-4 py-2.5 rounded-lg',
    };
    
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
