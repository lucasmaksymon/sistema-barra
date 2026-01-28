'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface MenuItem {
  icon: string;
  label: string;
  path: string;
  color: string;
  badge?: number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems: MenuItem[] = [
    {
      icon: '📊',
      label: 'Dashboard',
      path: '/admin',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      icon: '🍹',
      label: 'Productos',
      path: '/admin/productos',
      color: 'from-indigo-600 to-purple-600',
    },
    {
      icon: '🎁',
      label: 'Combos',
      path: '/admin/combos',
      color: 'from-pink-600 to-rose-600',
    },
    {
      icon: '📦',
      label: 'Inventario',
      path: '/admin/inventario',
      color: 'from-green-600 to-emerald-600',
    },
    {
      icon: '🎫',
      label: 'QR Consumo',
      path: '/admin/qr-consumo',
      color: 'from-purple-600 to-pink-600',
    },
    {
      icon: '💳',
      label: 'Transacciones',
      path: '/admin/transacciones',
      color: 'from-violet-600 to-fuchsia-600',
    },
    {
      icon: '📈',
      label: 'Reportes',
      path: '/admin/reportes',
      color: 'from-amber-600 to-orange-600',
    },
    {
      icon: '👥',
      label: 'Usuarios',
      path: '/admin/usuarios',
      color: 'from-rose-600 to-red-600',
    },
    {
      icon: '⚙️',
      label: 'Configuración',
      path: '/admin/configuracion',
      color: 'from-teal-600 to-cyan-600',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#0f1419]">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          bg-gradient-to-b from-[#1a1f2e] to-[#0f1419]
          border-r border-gray-800
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-20'}
          flex flex-col
        `}
      >
        {/* Logo y Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">👨‍💼</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Admin</h2>
                <p className="text-xs text-gray-400">Panel de Control</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <span className="text-xl">👨‍💼</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`
              p-2 hover:bg-gray-800 rounded-lg transition-colors
              ${!sidebarOpen && 'hidden'}
            `}
          >
            <span className="text-gray-400 text-xl">☰</span>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl
                  transition-all duration-200 group
                  ${
                    active
                      ? `bg-gradient-to-r ${item.color} shadow-lg scale-105`
                      : 'hover:bg-gray-800/50 hover:scale-105'
                  }
                  ${!sidebarOpen && 'justify-center'}
                `}
                title={!sidebarOpen ? item.label : ''}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <span
                    className={`
                      text-sm font-semibold flex-1 text-left
                      ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}
                    `}
                  >
                    {item.label}
                  </span>
                )}
                {sidebarOpen && active && (
                  <span className="text-white text-lg">→</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          {!sidebarOpen ? (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Expandir menú"
            >
              <span className="text-gray-400 text-xl">→</span>
            </button>
          ) : (
            <div className="text-xs text-gray-500 text-center">
              <p className="font-semibold mb-1">Sistema de Bar</p>
              <p>Versión 2.0</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
          flex-1 transition-all duration-300
          ${sidebarOpen ? 'ml-64' : 'ml-20'}
        `}
      >
        {children}
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
