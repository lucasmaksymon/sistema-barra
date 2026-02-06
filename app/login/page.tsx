'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Card } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      // Guardar token
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.usuario));

      // Redirigir según rol
      const rol = data.data.usuario.rol;
      if (rol === 'ADMIN' || rol === 'SUPERVISOR') {
        router.push('/admin');
      } else if (rol === 'CAJA') {
        router.push('/caja');
      } else if (rol === 'BARRA') {
        router.push('/barra');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/5 rounded-full filter blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full filter blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        <Card padding="lg" className="border-2 border-gray-700/50 backdrop-blur-sm bg-[#1a1f2e]/80">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/20">
              <span className="text-4xl">🍺</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Sistema de Bar
            </h1>
            <p className="text-gray-400 font-medium">Inicia sesión para continuar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900/20 border-2 border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@bar.com"
              required
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              className="mt-6"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-[#0f1419] border border-gray-700 rounded-lg">
            <p className="font-semibold mb-3 text-gray-300 text-center text-sm">Usuarios de prueba:</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-blue-900/10 rounded border border-blue-500/20">
                <span className="text-blue-400 font-medium">👨‍💼 Admin:</span>
                <span className="text-gray-400">admin@bar.com / admin123</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-900/10 rounded border border-green-500/20">
                <span className="text-green-400 font-medium">💵 Cajero:</span>
                <span className="text-gray-400">cajero1@bar.com / cajero123</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-purple-900/10 rounded border border-purple-500/20">
                <span className="text-purple-400 font-medium">🍹 Bartender:</span>
                <span className="text-gray-400">bartender1@bar.com / barra123</span>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Sistema de gestión de bar © 2026</p>
        </div>
      </div>
    </div>
  );
}
