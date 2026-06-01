'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Users, PhoneCall, PhoneOff, CheckCircle2, XCircle, 
  RefreshCw, SlidersHorizontal, Sparkles, ArrowRight, Clock, CalendarDays
} from 'lucide-react';
import Link from 'next/link';

interface ClienteLlamada {
  id: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  nro_contrato?: string;
  telefono: string;
  plan_contratado: string;
  costo_plan: number;
  ciclo_actual: number;
  informado: boolean;
  primer_contacto: string | null;
  resultado_primer_contacto: string | null;
  reagendar_fecha: string | null;
  requiere_ticket_glpi: boolean;
  ticket_glpi_detalles: string | null;
  operador?: string;
  duracion_segundos?: number | null;
  intentos_fallidos?: number | null;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteLlamada[]>([]);
  const [operatorName, setOperatorName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOperatorName(localStorage.getItem('user_name'));
    }
  }, []);

  // Filtros activos
  const [filtroPlan, setFiltroPlan] = useState<string>('todos');
  const [filtroPrecio, setFiltroPrecio] = useState<string>('todos');
  const [filtroCiclo, setFiltroCiclo] = useState<string>('todos');

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes');
      if (!res.ok) throw new Error('API response not ok');
      const data = await res.json();
      if (data && !data.error) {
        setClientes(data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.warn('CRM API: failed to fetch clients or route inactive. Using static fallback data.', err);
      
      const mockData: ClienteLlamada[] = [
        { id: '1', nombre: 'Juan', apellido: 'Pérez', cedula: 'V-12345678', nro_contrato: 'CTR-0001', telefono: '+584121234567', plan_contratado: 'Plan Fibra 100 Mbps', costo_plan: 20.00, ciclo_actual: 30, informado: false, primer_contacto: null, resultado_primer_contacto: null, reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null, duracion_segundos: null, intentos_fallidos: 0 },
        { id: '2', nombre: 'María', apellido: 'Gómez', cedula: 'V-87654321', nro_contrato: 'CTR-0002', telefono: '+584149876543', plan_contratado: 'Plan Fibra 200 Mbps', costo_plan: 30.00, ciclo_actual: 30, informado: true, primer_contacto: '2026-05-29 09:30:00-04', resultado_primer_contacto: 'Se le informó la migración al ciclo 1. Está de acuerdo.', reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null, duracion_segundos: 120, intentos_fallidos: 0 },
        { id: '3', nombre: 'Carlos', apellido: 'Rodríguez', cedula: 'V-11112222', nro_contrato: 'CTR-0003', telefono: '+584161112233', plan_contratado: 'Plan Fibra 300 Mbps', costo_plan: 45.00, ciclo_actual: 30, informado: false, primer_contacto: '2026-05-29 14:15:00-04', resultado_primer_contacto: 'Llamada no contestada, buzón de voz.', reagendar_fecha: '2026-06-01 10:00:00-04', requiere_ticket_glpi: false, ticket_glpi_detalles: null, duracion_segundos: null, intentos_fallidos: 1 },
        { id: '4', nombre: 'Ana', apellido: 'Martínez', cedula: 'V-33334444', nro_contrato: 'CTR-0004', telefono: '+584244445566', plan_contratado: 'Plan Fibra 500 Mbps', costo_plan: 60.00, ciclo_actual: 1, informado: true, primer_contacto: '2026-05-28 11:00:00-04', resultado_primer_contacto: 'Confirmada recepción de información.', reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null, duracion_segundos: 95, intentos_fallidos: 0 },
        { id: '5', nombre: 'Luis', apellido: 'Hernández', cedula: 'V-55556666', nro_contrato: 'CTR-0005', telefono: '+584125556677', plan_contratado: 'Plan Fibra 100 Mbps', costo_plan: 20.00, ciclo_actual: 30, informado: false, primer_contacto: '2026-05-28 15:45:00-04', resultado_primer_contacto: 'El cliente no reconoce el cambio de ciclo y exige soporte técnico por lentitud.', reagendar_fecha: null, requiere_ticket_glpi: true, ticket_glpi_detalles: 'GLPI-98432: Reclamo ONT', duracion_segundos: null, intentos_fallidos: 0 },
        { id: '6', nombre: 'Sofía', apellido: 'Díaz', cedula: 'V-77778888', nro_contrato: 'CTR-0006', telefono: '+584147778899', plan_contratado: 'Plan Fibra 1 Gbps', costo_plan: 100.00, ciclo_actual: 30, informado: false, primer_contacto: null, resultado_primer_contacto: null, reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null, duracion_segundos: null, intentos_fallidos: 0 },
        { id: '7', nombre: 'Pedro', apellido: 'Álvarez', cedula: 'V-99990000', nro_contrato: 'CTR-0007', telefono: '+584128889900', plan_contratado: 'Plan Fibra 200 Mbps', costo_plan: 30.00, ciclo_actual: 1, informado: false, primer_contacto: null, resultado_primer_contacto: null, reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null, duracion_segundos: null, intentos_fallidos: 0 },
        { id: '8', nombre: 'Elena', apellido: 'Torres', cedula: 'V-22223333', nro_contrato: 'CTR-0008', telefono: '+584249990011', plan_contratado: 'Plan Fibra 300 Mbps', costo_plan: 45.00, ciclo_actual: 30, informado: true, primer_contacto: '2026-05-30 08:00:00-04', resultado_primer_contacto: 'Informada de la migración. Conforme.', reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null, duracion_segundos: 150, intentos_fallidos: 0 }
      ];

      // Assign operator to fallback mock data dynamically so it works in demo mode
      const assignedData = mockData.map(c => ({
        ...c,
        operador: c.operador || operatorName || 'Luis Hidalgo'
      }));
      setClientes(assignedData);
    } finally {
      setLoading(false);
    }
  }, [operatorName]);

  useEffect(() => {
    if (operatorName !== null) {
      fetchClientes();
    }
  }, [operatorName, fetchClientes]);

  const myClientes = operatorName ? clientes.filter(c => c.operador === operatorName) : clientes;

  // Lista de planes únicos para filtros
  const planesDisponibles = Array.from(new Set(myClientes.map(c => c.plan_contratado))).sort();

  // Rangos de precios únicos para filtros
  const preciosDisponibles = Array.from(new Set(myClientes.map(c => c.costo_plan))).sort((a,b) => a - b);

  // Filtrar clientes
  const clientesFiltrados = myClientes.filter(c => {
    if (c.resultado_primer_contacto === 'Agendado para visita informativa') return false;
    if (filtroPlan !== 'todos' && c.plan_contratado !== filtroPlan) return false;
    if (filtroPrecio !== 'todos' && c.costo_plan.toString() !== filtroPrecio) return false;
    if (filtroCiclo !== 'todos' && c.ciclo_actual.toString() !== filtroCiclo) return false;
    return true;
  });

  // Métricas generales (sobre todo el universo de clientes)
  const visitasInformativasTotal = myClientes.filter(c => c.resultado_primer_contacto === 'Agendado para visita informativa').length;
  const activeClientes = myClientes.filter(c => c.resultado_primer_contacto !== 'Agendado para visita informativa');
  const totalClientes = activeClientes.length;
  const contactadosTotal = activeClientes.filter(c => c.informado).length;
  const noContactadosTotal = totalClientes - contactadosTotal;
  const tasaContactabilidad = totalClientes > 0 ? Math.round((contactadosTotal / totalClientes) * 100) : 0;
  
  // Tiempo promedio por llamada
  const clientesConDuracion = activeClientes.filter(c => c.duracion_segundos != null && c.duracion_segundos > 0);
  const sumaDuracion = clientesConDuracion.reduce((acc, c) => acc + (c.duracion_segundos || 0), 0);
  const promedioSegundos = clientesConDuracion.length > 0 ? Math.round(sumaDuracion / clientesConDuracion.length) : 0;

  const formatAverageTime = (secs: number) => {
    if (secs === 0) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // Métricas dinámicas filtradas
  const totalFiltrados = clientesFiltrados.length;
  const contactadosFiltrados = clientesFiltrados.filter(c => c.informado).length;
  const noContactadosFiltrados = totalFiltrados - contactadosFiltrados;

  // Meta Diaria (30 llamadas/contactos por día)
  const metaDiaria = 30;
  const todayStr = new Date().toISOString().split('T')[0];
  const atendidosHoy = myClientes.filter(c => {
    if (!c.primer_contacto) return false;
    const contactDate = c.primer_contacto.split('T')[0] || '';
    return contactDate === todayStr;
  }).length;
  const porcentajeMeta = Math.min(100, Math.round((atendidosHoy / metaDiaria) * 100));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 min-h-[60vh]">
        <div className="h-10 w-10 text-[#60c0ea] animate-spin border-4 border-[#60c0ea]/20 border-t-[#60c0ea] rounded-full" />
        <p className="text-gray-400 text-sm font-medium">Cargando métricas de la agenda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up py-4">
      {/* Banner Principal */}
      <div className="relative rounded-3xl overflow-hidden border border-[#004e74]/40 bg-gradient-to-r from-[#111a2e] to-[#0a1b3a] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#004e74]/50 bg-[#004e74]/20 text-[#60c0ea] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Migración Masiva a Ciclo 1
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Dashboard de Control: <span className="text-[#60c0ea]">{operatorName || 'Métricas Generales'}</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Consola de supervisión de llamadas para {operatorName ? `operador ${operatorName} con ${myClientes.length} clientes asignados` : 'todos los clientes'}.
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href="/clientes"
            className="group inline-flex items-center gap-2 bg-[#60c0ea] hover:bg-[#4eaad4] text-[#002851] font-bold px-6 py-3.5 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
          >
            Comenzar Llamadas
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Meta Diaria del Operador */}
      {operatorName && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[#09152b] to-[#0c2447] border-[#004e74]/30 animate-fade-in">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-wider">
              Progreso Personal de Hoy
            </div>
            <h2 className="text-xl font-extrabold text-white uppercase mt-1">Mi Meta Diaria de Contactos</h2>
            <p className="text-xs text-muted-foreground">
              Has atendido a <strong className="text-white text-sm">{atendidosHoy}</strong> de <strong className="text-white text-sm">{metaDiaria}</strong> clientes asignados para el día de hoy.
            </p>
          </div>
          
          <div className="w-full md:w-80 space-y-3 shrink-0">
            <div className="flex justify-between text-xs font-bold text-white uppercase">
              <span>{porcentajeMeta}% Completado</span>
              <span className="text-[#60c0ea]">{atendidosHoy} / {metaDiaria} Clientes</span>
            </div>
            <div className="w-full bg-secondary h-4 rounded-full overflow-hidden p-0.5 border border-border">
              <div 
                className="bg-gradient-to-r from-amber-500 to-[#60c0ea] h-full rounded-full transition-all duration-1000" 
                style={{ width: `${porcentajeMeta}%` }}
              />
            </div>
            {atendidosHoy >= metaDiaria ? (
              <p className="text-[10px] text-emerald-400 font-extrabold uppercase animate-pulse flex items-center gap-1">
                <span>¡Excelente trabajo! Has cumplido la meta diaria de hoy. 🎉</span>
              </p>
            ) : (
              <p className="text-[10px] text-amber-400 font-bold uppercase">
                Te faltan {metaDiaria - atendidosHoy} clientes para cumplir tu meta de hoy. ¡Sigue adelante!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Grid de Métricas Generales (Tarjetas Superiores - 6 Columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Total Clientes */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Total Clientes Activos</span>
              <span className="text-3xl font-black text-foreground">{totalClientes}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#60c0ea]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Clientes en agenda para llamar
          </div>
        </div>

        {/* Contactados */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Clientes Contactados</span>
              <span className="text-3xl font-black text-emerald-400">{contactadosTotal}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <PhoneCall className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ya se les informó de la migración</span>
          </div>
        </div>

        {/* No Contactados */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">No Contactados</span>
              <span className="text-3xl font-black text-red-400">{noContactadosTotal}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <PhoneOff className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-red-400" />
            <span>Pendientes por realizar contacto</span>
          </div>
        </div>

        {/* Agendados para visitas informativas */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Visitas Informativas</span>
              <span className="text-3xl font-black text-amber-400">{visitasInformativasTotal}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 text-amber-400" />
            <span>Agendados para visitas informativas</span>
          </div>
        </div>

        {/* Tiempo Promedio por Llamada */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Tiempo Promedio</span>
              <span className="text-3xl font-black text-purple-400 font-mono">{formatAverageTime(promedioSegundos)}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-purple-400" />
            <span>Por llamada completada con éxito</span>
          </div>
        </div>

        {/* Tasa de Contactabilidad */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#f3af30] uppercase tracking-wider block">Avance de Campaña</span>
              <span className="text-3xl font-black text-[#f3af30]">{tasaContactabilidad}%</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#f3af30]/10 flex items-center justify-center text-[#f3af30]">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 space-y-1">
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#f3af30] h-full rounded-full transition-all duration-500" 
                style={{ width: `${tasaContactabilidad}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor de Filtros Interactivos */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <SlidersHorizontal className="h-5 w-5 text-[#60c0ea]" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Filtros Dinámicos del Universo Seleccionado
          </h2>
          <button 
            onClick={() => {
              setFiltroPlan('todos');
              setFiltroPrecio('todos');
              setFiltroCiclo('todos');
            }}
            className="ml-auto text-xs text-[#60c0ea] hover:text-foreground flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="h-3 w-3" /> Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Plan Contratado */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Plan Contratado</label>
            <select
              value={filtroPlan}
              onChange={(e) => setFiltroPlan(e.target.value)}
              className="w-full bg-secondary border border-border text-foreground text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#60c0ea] font-semibold uppercase"
            >
              <option value="todos">Todos los Planes</option>
              {planesDisponibles.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
          </div>

          {/* Precio del Plan */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Precio del Plan</label>
            <select
              value={filtroPrecio}
              onChange={(e) => setFiltroPrecio(e.target.value)}
              className="w-full bg-secondary border border-border text-[#60c0ea] text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#60c0ea] font-semibold uppercase"
            >
              <option value="todos">Todos los Precios</option>
              {preciosDisponibles.map(precio => (
                <option key={precio} value={precio.toString()}>${precio.toFixed(2)} / mes</option>
              ))}
            </select>
          </div>

          {/* Ciclo Facturación */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Ciclo de Facturación</label>
            <select
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
              className="w-full bg-secondary border border-border text-[#60c0ea] text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#60c0ea] font-semibold uppercase"
            >
              <option value="todos">Todos los Ciclos</option>
              <option value="1">Ciclo 1</option>
              <option value="30">Ciclo 30</option>
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Dinámicas Filtradas */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Relación de Contactados Filtrados */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <PhoneCall className="h-4.5 w-4.5 text-[#60c0ea]" /> Distribución de Contacto
          </h3>
          
          <div className="grid grid-cols-3 gap-4 text-center py-2">
            <div className="bg-secondary/20 p-4 rounded-xl border border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Filtrados</span>
              <span className="block text-2xl font-black text-foreground mt-1">{totalFiltrados}</span>
            </div>
            <div className="bg-secondary/20 p-4 rounded-xl border border-border">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Contactados</span>
              <span className="block text-2xl font-black text-emerald-400 mt-1">{contactadosFiltrados}</span>
            </div>
            <div className="bg-secondary/20 p-4 rounded-xl border border-border">
              <span className="text-[10px] font-bold text-red-400 uppercase">No Contact.</span>
              <span className="block text-2xl font-black text-red-400 mt-1">{noContactadosFiltrados}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
              <span>Porcentaje de Contactados Filtrados</span>
              <span>{totalFiltrados > 0 ? Math.round((contactadosFiltrados / totalFiltrados) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${totalFiltrados > 0 ? (contactadosFiltrados / totalFiltrados) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Sección Informativa Inferior */}
      <div className="bg-card/60 border border-border p-5 rounded-2xl">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Instrucciones de Operación</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          1. Dirígete a la pestaña de **Gestión de Llamadas** o **Búsqueda Rápida** para interactuar con la base de datos de clientes.<br />
          2. Selecciona un cliente para desplegar el panel de llamada y consultar su **Speech Personalizado** correspondiente.<br />
          3. Utiliza los selectores del panel del cliente para registrar si fue informado, notas de contacto, reagendar llamadas o registrar un ticket de incidencia GLPI en caso de fallas.
        </p>
      </div>
    </div>
  );
}
