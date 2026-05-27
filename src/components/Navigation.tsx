'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ClipboardCheck, BarChart3, Settings, AlertTriangle, 
  Map, Building2, UserX, ShieldAlert, Sliders 
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const activeMenuItems = [
    {
      name: 'Registro Asistencia',
      href: '/registro',
      icon: ClipboardCheck,
    },
    {
      name: 'Dashboard Realtime',
      href: '/dashboard',
      icon: BarChart3,
    },
    {
      name: 'Casos de Infraestructura',
      href: '/casos',
      icon: ShieldAlert,
    },
    {
      name: 'Administración',
      href: '/admin',
      icon: Settings,
    },
  ];

  const inactiveMenuItems = [
    { name: 'Mapa', icon: Map },
    { name: 'Condominios', icon: Building2 },
    { name: 'Denuncias Minería', icon: AlertTriangle },
    { name: 'Portal Inspectores', icon: Sliders },
    { name: 'Personas Vulnerables', icon: UserX },
  ];

  return (
    <nav className="bg-[#111a2e] border-b border-[#1e2d4a] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#004e74] flex items-center justify-center text-[#60c0ea] font-bold shadow-md shadow-[#004e74]/20">
              S
            </div>
            <div>
              <span className="font-semibold text-lg text-white block leading-none">Sisprot Global Fiber</span>
              <span className="text-xs text-[#60c0ea] font-medium">Gestión del Encuentro</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Activos */}
            {activeMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#004e74] text-white shadow-md shadow-[#004e74]/30'
                      : 'text-gray-300 hover:bg-[#1a2640] hover:text-white'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#60c0ea]' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Inactivos (Estáticos de la Suite) */}
            {inactiveMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 cursor-not-allowed select-none bg-gray-900/10 border border-transparent"
                  title="Disponible en la suite corporativa"
                >
                  <Icon className="h-3.5 w-3.5 text-gray-600" />
                  <span className="hidden lg:inline">{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
