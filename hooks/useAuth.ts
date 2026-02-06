'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from './useLocalStorage';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'CAJA' | 'BARRA' | 'INVENTARIO';
  activo: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Hook centralizado para manejar autenticación
 * Reemplaza el uso directo de localStorage
 */
export function useAuth() {
  const router = useRouter();
  const [token, setToken, removeToken] = useLocalStorage<string | null>('token', null);
  const [user, setUser, removeUser] = useLocalStorage<User | null>('user', null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión al montar
    if (token && user) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [token, user]);

  const login = useCallback(
    (newToken: string, newUser: User) => {
      setToken(newToken);
      setUser(newUser);
    },
    [setToken, setUser]
  );

  const logout = useCallback(() => {
    removeToken();
    removeUser();
    router.push('/login');
  }, [removeToken, removeUser, router]);

  const updateUser = useCallback(
    (updates: Partial<User>) => {
      if (user) {
        setUser({ ...user, ...updates });
      }
    },
    [user, setUser]
  );

  // Verificar si el usuario tiene un rol específico
  const hasRole = useCallback(
    (...roles: User['rol'][]) => {
      return user ? roles.includes(user.rol) : false;
    },
    [user]
  );

  const isAdmin = useCallback(() => {
    return hasRole('ADMIN');
  }, [hasRole]);

  const isAdminOrSupervisor = useCallback(() => {
    return hasRole('ADMIN', 'SUPERVISOR');
  }, [hasRole]);

  const authState: AuthState = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
  };

  return {
    ...authState,
    login,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isAdminOrSupervisor,
  };
}
