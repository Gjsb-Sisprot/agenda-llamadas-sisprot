'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { setSessionActive } from '@/lib/utils';
import { 
  BarChart3, Users, LogOut, User, PhoneCall, ClipboardCheck, Sun, Moon, CalendarDays
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

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
      await supabase.auth.signOut();
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
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-background px-2.5 py-1.5 rounded-md border border-border">
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
    </nav>
  );
}

