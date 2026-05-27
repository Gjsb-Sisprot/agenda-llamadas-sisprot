import Link from 'next/link';
import { ClipboardCheck, BarChart3, Settings, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-3xl w-full space-y-8 animate-slide-up">
        {/* Banner principal */}
        <div className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#004e74]/50 bg-[#004e74]/10 text-[#60c0ea] text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="h-3 w-3 animate-pulse" />
          Sisprot Global Fiber
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-none">
          Primer Encuentro de <br />
          <span className="text-[#60c0ea]">Condominios</span>
        </h1>
        
        <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
          Sistema unificado de control de asistencia, asignación automática de mesas de trabajo temáticas y notificaciones en tiempo real vía WhatsApp (EvolutionAPI).
        </p>

        {/* Tarjetas de Módulo */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Registro */}
          <Link
            href="/registro"
            className="group relative rounded-2xl border border-[#1e2d4a] bg-[#111a2e] p-6 text-left transition-all duration-300 hover:border-[#60c0ea]/50 hover:bg-[#15223e] hover:shadow-lg hover:shadow-[#004e74]/20 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[#004e74]/20 text-[#60c0ea] mb-4 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#60c0ea] transition-colors">
                Registro de Asistencia
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Módulo rápido de bienvenida. Digita la Cédula del presidente de condominio, valida datos, asigna mesa y envía WhatsApp.
              </p>
            </div>
            <div className="mt-6 text-sm font-semibold text-[#60c0ea] group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Ingresar al Registro &rarr;
            </div>
          </Link>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="group relative rounded-2xl border border-[#1e2d4a] bg-[#111a2e] p-6 text-left transition-all duration-300 hover:border-[#60c0ea]/50 hover:bg-[#15223e] hover:shadow-lg hover:shadow-[#004e74]/20 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[#f3af30]/10 text-[#f3af30] mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#f3af30] transition-colors">
                Estadísticas en Tiempo Real
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Dashboard interactivo para visualizar el quórum de asistentes distribuidos por mesa de trabajo y por municipio.
              </p>
            </div>
            <div className="mt-6 text-sm font-semibold text-[#f3af30] group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Ver Estadísticas &rarr;
            </div>
          </Link>

          {/* Administración */}
          <Link
            href="/admin"
            className="group relative rounded-2xl border border-[#1e2d4a] bg-[#111a2e] p-6 text-left transition-all duration-300 hover:border-[#60c0ea]/50 hover:bg-[#15223e] hover:shadow-lg hover:shadow-[#004e74]/20 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[#db8a2a]/10 text-[#db8a2a] mb-4 group-hover:scale-110 transition-transform">
                <Settings className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#db8a2a] transition-colors">
                Administración General
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Configura mesas, asocia tipos de servicios (muchos a muchos) e importa asistentes desde el listado predefinido.
              </p>
            </div>
            <div className="mt-6 text-sm font-semibold text-[#db8a2a] group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Ir a Configuración &rarr;
            </div>
          </Link>
        </div>

        {/* Footer Informativo */}
        <div className="mt-16 flex items-center justify-center gap-2 text-xs text-gray-500 border-t border-[#1e2d4a] pt-8">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Base de datos segura en Supabase y notificaciones integradas con EvolutionAPI.</span>
        </div>
      </div>
    </div>
  );
}
