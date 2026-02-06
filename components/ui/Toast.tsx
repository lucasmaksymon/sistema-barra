'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);
  
  const config = {
    success: {
      icon: '✓',
      bgColor: 'bg-green-600',
      borderColor: 'border-green-500',
    },
    error: {
      icon: '✕',
      bgColor: 'bg-red-600',
      borderColor: 'border-red-500',
    },
    warning: {
      icon: '⚠',
      bgColor: 'bg-yellow-600',
      borderColor: 'border-yellow-500',
    },
    info: {
      icon: 'ℹ',
      bgColor: 'bg-cyan-600',
      borderColor: 'border-cyan-500',
    },
  };
  
  const { icon, bgColor, borderColor } = config[type];
  
  return (
    <div
      className={`
        ${bgColor} ${borderColor}
        border-l-4 rounded-lg shadow-xl
        p-4 pr-12 mb-3 relative
        max-w-sm w-full
      `}
      role="alert"
      aria-live="polite"
    >
      <button
        onClick={() => onClose(id)}
        className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors p-1"
        aria-label="Cerrar notificación"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <h4 className="text-white font-bold text-sm mb-0.5">{title}</h4>
          {message && (
            <p className="text-white/90 text-xs leading-relaxed">{message}</p>
          )}
        </div>
      </div>
      
      {/* Barra de progreso */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-white/30"
            style={{
              animation: `shrink ${duration}ms linear`,
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
