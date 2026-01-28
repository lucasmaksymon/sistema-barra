'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);

    // Verificar que el usuario esté en la ruta correcta según su rol
    const rol = parsedUser.rol;
    if (rol === 'CAJA' && !pathname.includes('/caja')) {
      router.push('/caja');
    } else if (rol === 'BARRA' && !pathname.includes('/barra')) {
      router.push('/barra');
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" suppressHydrationWarning></div>
          <p className="mt-4 text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419]" suppressHydrationWarning>
      {/* Header */}
      <header className="bg-[#1a1f2e] border-b border-gray-800 sticky top-0 z-50" suppressHydrationWarning>
        <div className="px-4 py-3 flex items-center justify-between" suppressHydrationWarning>
          <div className="flex items-center gap-3" suppressHydrationWarning>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center" suppressHydrationWarning>
              <span className="text-xl">🍺</span>
            </div>
            <div suppressHydrationWarning>
              <h1 className="text-lg font-bold text-white">Sistema de Bar</h1>
              <p className="text-xs text-gray-400">
                {user?.nombre} • {user?.rol}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="pb-6">{children}</main>
    </div>
  );
}
