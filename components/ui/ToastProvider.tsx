'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType } from './Toast';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  
  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast({ type: 'success', title, message, duration });
    },
    [showToast]
  );
  
  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast({ type: 'error', title, message, duration });
    },
    [showToast]
  );
  
  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast({ type: 'warning', title, message, duration });
    },
    [showToast]
  );
  
  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast({ type: 'info', title, message, duration });
    },
    [showToast]
  );
  
  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      
      {/* Container de toasts */}
      <div
        className="fixed top-4 right-4 z-[var(--z-toast)] flex flex-col items-end pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
