import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-development-only'
);

export interface JWTPayload {
  userId: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'CAJA' | 'BARRA' | 'INVENTARIO';
  eventoId?: string;
}

/**
 * Crea un JWT token
 */
export async function createJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // 8 horas para un evento típico
    .sign(secret);
}

/**
 * Verifica y decodifica un JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}

/**
 * Extrae el token del header Authorization
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware para verificar autenticación
 */
export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const token = extractToken(request);
  
  if (!token) {
    throw new Error('No autorizado');
  }
  
  return await verifyJWT(token);
}

/**
 * Middleware para verificar roles específicos
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: JWTPayload['rol'][]
): Promise<JWTPayload> {
  const user = await requireAuth(request);
  
  if (!allowedRoles.includes(user.rol)) {
    throw new Error('Acceso denegado');
  }
  
  return user;
}

/**
 * Verifica si el usuario es admin o supervisor
 */
export function isAdminOrSupervisor(rol: JWTPayload['rol']): boolean {
  return rol === 'ADMIN' || rol === 'SUPERVISOR';
}
