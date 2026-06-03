'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { setSessionActive } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, Users, LogOut, User, PhoneCall, ClipboardCheck, Sun, Moon, CalendarDays, Loader2, X, ShieldAlert, Check
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  // Estados de edición de perfil
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('user_name') || 'Agente Sisprot');
      const savedTheme = localStorage.getItem('theme');
      const light = savedTheme === 'light';
      setIsLightMode(light);
      if (light) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  }, [pathname]);

  const openEditModal = () => {
    setEditName(userName || '');
    setEditPassword('');
    setEditError(null);
    setEditSuccess(null);
    setShowProfileModal(true);
  };

  const handleUpdatePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const normalizedName = editName.trim();
      if (!normalizedName) {
        throw new Error('El nombre no puede estar vacío.');
      }

      // 1. Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('No se pudo identificar la sesión activa.');
      }

      // 2. Actualizar metadatos en auth.users
      const updateData: { data: { name: string; full_name: string }; password?: string } = {
        data: { name: normalizedName, full_name: normalizedName }
      };

      if (editPassword.trim()) {
        if (editPassword.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        updateData.password = editPassword;
      }

      const { error: authError } = await supabase.auth.updateUser(updateData);
      if (authError) throw authError;

      // 3. Actualizar tabla pública perfiles
      const { error: profileError } = await supabase
        .from('perfiles')
        .update({ nombre: normalizedName })
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error actualizando perfil público:', profileError.message);
      }

      // 4. Actualizar estado y LocalStorage
      setUserName(normalizedName);
      localStorage.setItem('user_name', normalizedName);
      setEditSuccess('¡Perfil actualizado con éxito!');
      setTimeout(() => setShowProfileModal(false), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error al actualizar.';
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }

  };


  const toggleTheme = () => {
    const nextTheme = !isLightMode;
    setIsLightMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setSessionActive(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_name');
    }
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    {
      name: 'Búsqueda Rápida',
      href: '/buscar',
      icon: ClipboardCheck,
    },
    {
      name: 'Métricas de Agenda',
      href: '/',
      icon: BarChart3,
    },
    {
      name: 'Gestión de Llamadas',
      href: '/clientes',
      icon: Users,
    },
    {
      name: 'Calendario',
      href: '/calendario',
      icon: CalendarDays,
    },
  ];

  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#60c0ea] to-[#004e74] flex items-center justify-center text-white font-bold shadow-md shadow-[#004e74]/20">
              <PhoneCall className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-lg text-foreground block leading-none">Sisprot Global Fiber</span>
              <span className="text-xs text-[#60c0ea] font-medium">Agenda de Llamadas y Migración</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-4 ml-auto md:ml-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-[#004e74] text-white shadow-md shadow-[#004e74]/30'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#60c0ea]' : 'text-muted-foreground'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="h-4 w-[1px] bg-border hidden sm:block" />

            <div className="flex items-center gap-2 md:gap-3">
              {userName && (
                <div 
                  onClick={openEditModal}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-background px-2.5 py-1.5 rounded-md border border-border cursor-pointer hover:bg-secondary hover:text-foreground transition-all"
                  title="Haga clic para editar su perfil"
                >
                  <User className="h-3 w-3 text-[#60c0ea]" />
                  <span>{userName}</span>
                </div>
              )}
              
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 border border-transparent"
                title={isLightMode ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
              >
                {isLightMode ? <Moon className="h-4 w-4 text-[#60c0ea]" /> : <Sun className="h-4 w-4 text-[#f3af30]" />}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 border border-transparent hover:border-red-500/20"
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición de Perfil */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-border bg-gradient-to-br from-[#0a1628] to-[#0d1f3c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#60c0ea]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Editar Perfil de Operador</h3>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdatePerfil} className="p-6 space-y-4">
              {editError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                  <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{editSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#60c0ea] text-foreground font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Nueva Contraseña (Opcional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#60c0ea] text-foreground font-mono"
                />
                <span className="text-[9px] text-muted-foreground">Deja este campo vacío si no deseas cambiar tu contraseña.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold py-2.5 px-4 rounded-xl text-xs uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-[#60c0ea] hover:bg-[#4eaad4] text-[#002851] font-bold py-2.5 px-4 rounded-xl text-xs uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  {editLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>

  );
}

