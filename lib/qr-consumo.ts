import { randomUUID } from 'crypto';

/**
 * Genera un token único para QR de Consumo
 */
export function generateQRConsumoToken(): string {
  return randomUUID();
}

/**
 * Genera el código del QR de consumo en formato QRC-YYYYMMDD-NNNN
 */
export function generateQRConsumoCodigo(numero: number): string {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const secuencia = String(numero).padStart(4, '0');
  
  return `QRC-${year}${month}${day}-${secuencia}`;
}

/**
 * Genera la URL completa para el QR de consumo
 * @param token - Token del QR
 * @param request - (Opcional) Request de Next.js para obtener el dominio actual
 */
export function getQRConsumoUrl(token: string, request?: Request): string {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Si no hay variable de entorno, intentar obtener del request
  if (!baseUrl && request) {
    const url = new URL(request.url);
    baseUrl = url.origin;
  }
  
  // Fallback a localhost
  if (!baseUrl) {
    baseUrl = 'http://localhost:3000';
  }
  
  return `${baseUrl}/qr-consumo/${token}`;
}
