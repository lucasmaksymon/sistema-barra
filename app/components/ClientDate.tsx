'use client';

import { useState, useEffect } from 'react';

interface ClientDateProps {
  date: string | Date;
  format?: 'full' | 'short' | 'time';
  className?: string;
}

export function ClientDate({ date, format = 'short', className = '' }: ClientDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Mostrar placeholder durante SSR para evitar hidratación
    return <span className={className}>...</span>;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  let formatted = '';
  
  switch (format) {
    case 'full':
      formatted = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      break;
    case 'time':
      formatted = dateObj.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      break;
    case 'short':
    default:
      formatted = dateObj.toLocaleDateString('es-ES');
      break;
  }

  return <span className={className}>{formatted}</span>;
}
