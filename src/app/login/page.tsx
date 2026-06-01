'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { hasActiveSession, setSessionActive } from '@/lib/utils';
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const USERS_DATABASE: Record<string, { name: string; email: string; pass: string }> = {
  "elisaul@sisprot.com": { name: "Elisaul Reyes", email: "elisaul@sisprot.com", pass: "elisaul123" },
  "georgina@sisprot.com": { name: "Georgina Baladi", email: "georgina@sisprot.com", pass: "georgina123" },
  "khaloa@sisprot.com": { name: "Khaloa Serrano", email: "khaloa@sisprot.com", pass: "khaloa123" },
  "derwing@sisprot.com": { name: "Derwing Acevedo", email: "derwing@sisprot.com", pass: "derwing123" },
  "luis@sisprot.com": { name: "Luis Hidalgo", email: "luis@sisprot.com", pass: "luis123" },
  "sandy@sisprot.com": { name: "Sandy Rodriguez", email: "sandy@sisprot.com", pass: "sandy123" },
  "yhosselyn@sisprot.com": { name: "Yhosselyn Perez", email: "yhosselyn@sisprot.com", pass: "yhosselyn123" },
  "yetzareth@sisprot.com": { name: "Yetzareth Bravo", email: "yetzareth@sisprot.com", pass: "yetzareth123" },
  "paola@sisprot.com": { name: "Paola Guanipa", email: "paola@sisprot.com", pass: "paola123" },
  "guillermo@sisprot.com": { name: "Guillermo Sanchez", email: "guillermo@sisprot.com", pass: "guillermo123" },
  "levi@sisprot.com": { name: "Levi Oliveros", email: "levi@sisprot.com", pass: "levi123" },
  "barbara@sisprot.com": { name: "Barbara Rodriguez", email: "barbara@sisprot.com", pass: "barbara123" },
  "milagros@sisprot.com": { name: "Milagros Teran", email: "milagros@sisprot.com", pass: "milagros123" },
  "jannerys@sisprot.com": { name: "Jannerys Pirela", email: "jannerys@sisprot.com", pass: "jannerys123" },
  "thais@sisprot.com": { name: "Thais Bejas", email: "thais@sisprot.com", pass: "thais123" }
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasActiveSession()) {
      router.replace('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const normalizedEmail = email.trim().toLowerCase();
      const user = USERS_DATABASE[normalizedEmail];

      if (!user || user.pass !== password) {
        throw new Error('Credenciales inválidas o correo no registrado.');
      }

      setSessionActive(true);
      localStorage.setItem('user_name', user.name);
      localStorage.setItem('user_email', user.email);

      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#111a2e]/60 backdrop-blur-md p-8 rounded-2xl border border-[#1e2d4a] shadow-xl">
        <div>
          <div className="mx-auto h-16 w-16 rounded-2xl bg-[#004e74]/30 flex items-center justify-center text-[#60c0ea] shadow-inner border border-[#004e74]/50 mb-6">
            <ShieldCheck className="h-9 w-9 text-[#60c0ea]" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            Sisprot Global Fiber
          </h2>
          <p className="mt-2 text-center text-sm text-[#60c0ea]">
            Portal de Acceso - Encuentro de Condominios
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg flex items-start gap-2.5 text-sm">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-[#1e2d4a] rounded-lg bg-[#0b111e]/80 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004e74] focus:border-transparent text-sm transition-all duration-200"
                  placeholder="ejemplo@sisprot.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-[#1e2d4a] rounded-lg bg-[#0b111e]/80 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004e74] focus:border-transparent text-sm transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#004e74] hover:bg-[#005e8c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b111e] focus:ring-[#60c0ea] disabled:opacity-50 transition-all duration-200 shadow-lg shadow-[#004e74]/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
