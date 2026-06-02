'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, MessageSquare, AlertCircle, Save, CheckCircle2, 
  Loader2, X, Clock, Check, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useClientes, ClienteLlamada } from '@/hooks/useClientes';

export default function CalendarioPage() {
  const { clientes, setClientes, loading } = useClientes();
  const [selectedCliente, setSelectedCliente] = useState<ClienteLlamada | null>(null);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form states for active details edit
  const [resultadoContacto, setResultadoContacto] = useState('');
  const [reagendarDate, setReagendarDate] = useState('');
  const [glpiActivo, setGlpiActivo] = useState(false);
  const [glpiDetalles, setGlpiDetalles] = useState('');
  const [informadoVal, setInformadoVal] = useState(false);

  // Dynamic filter state for event types
  const [filterTypes, setFilterTypes] = useState({
    reagenda: true,
    visita: true,
    glpi: true
  });

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Update form fields when selected client changes
  useEffect(() => {
    if (selectedCliente) {
      setResultadoContacto(selectedCliente.resultado_primer_contacto || '');
      setReagendarDate(selectedCliente.reagendar_fecha ? selectedCliente.reagendar_fecha.slice(0, 16) : '');
      setGlpiActivo(selectedCliente.requiere_ticket_glpi);
      setGlpiDetalles(selectedCliente.ticket_glpi_detalles || '');
      setInformadoVal(selectedCliente.informado);
    }
  }, [selectedCliente]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;

    setActionLoading(true);
    const primerContactoDate = selectedCliente.primer_contacto || new Date().toISOString();

    const updatedData = {
      resultado_primer_contacto: resultadoContacto.trim() || null,
      reagendar_fecha: reagendarDate ? new Date(reagendarDate).toISOString() : null,
      requiere_ticket_glpi: glpiActivo,
      ticket_glpi_detalles: glpiActivo ? glpiDetalles.trim() : null,
      informado: informadoVal,
      primer_contacto: primerContactoDate
    };

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCliente.id,
          cedula: selectedCliente.cedula,
          ...updatedData
        })
      });

      if (!res.ok) throw new Error('API response not ok');
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);

      showNotification('success', 'Bitácora guardada con éxito.');
      
      // Update local state in parent hook
      const updatedList = clientes.map(c => 
        c.id === selectedCliente.id 
          ? { ...c, ...updatedData } 
          : c
      );
      setClientes(updatedList);
      setSelectedCliente({ ...selectedCliente, ...updatedData });
      
      // Mirror locally
      localStorage.setItem('clientes_editados', JSON.stringify(updatedList));
    } catch (err) {
      console.error('API Save failed:', err);
      showNotification('error', 'Error al guardar el registro en Supabase.');
    } finally {
      setActionLoading(false);
    }
  };

  const generateSpeechText = (cliente: ClienteLlamada) => {
    const clientFullName = cliente.apellido ? `${cliente.nombre} ${cliente.apellido}` : cliente.nombre;
    const saludo = `Hola, estimado(a) **${clientFullName}**, le saludamos de **Sisprot Global Fiber** en relación a su servicio de Internet.`;
    
    let motivo = '';
    const actualCycle = cliente.ciclo_actual === 10 ? 15 : (cliente.ciclo_actual || 15);
    if (actualCycle === 15 || actualCycle === 30) {
      motivo = `Le informamos que actualmente su ciclo de facturación es el día **${actualCycle}** de cada mes. Como parte de nuestra reestructuración tecnológica, su servicio será migrado al **Ciclo 1**. Esto nos permitirá mejorar la estabilidad del procesamiento de pagos.`;
    } else {
      motivo = `Le llamamos para verificar las condiciones de su servicio de Internet, el cual se encuentra registrado en el **Ciclo 1** de facturación mensual.`;
    }

    const planInfo = `Su plan contratado es el **${cliente.plan_contratado}** con una tarifa de mensualidad de **$${cliente.costo_plan.toFixed(2)}**.`;
    const cierre = `¿Tiene alguna duda respecto a esta migración de ciclo o el cobro de la tarifa? Quedamos a su completa disposición.`;

    return { saludo, motivo, planInfo, cierre };
  };

  // Calendar Generation Helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
  
  const prevMonthDaysCount = getDaysInMonth(currentYear, currentMonth - 1);
  const paddingCells: { day: number; isCurrentMonth: false; date: Date }[] = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayVal = prevMonthDaysCount - i;
    paddingCells.push({
      day: dayVal,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth - 1, dayVal)
    });
  }

  const currentMonthCells: { day: number; isCurrentMonth: true; date: Date }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    currentMonthCells.push({
      day: d,
      isCurrentMonth: true,
      date: new Date(currentYear, currentMonth, d)
    });
  }

  const allCells = [...paddingCells, ...currentMonthCells];
  const remainingCells = 42 - allCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    allCells.push({
      day: d,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth + 1, d)
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2d4a] pb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#60c0ea] to-[#004e74] flex items-center justify-center shadow-lg shadow-[#60c0ea]/10">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight uppercase">Calendario de Reagendas</h1>
              <p className="text-muted-foreground text-sm">
                Control cronológico de visitas, compromisos y llamadas programadas.
              </p>
            </div>
          </div>
          
          {/* Notification */}
          {notification && (
            <div className={`px-4 py-2.5 rounded-xl border text-xs font-semibold animate-bounce flex items-center gap-2 ${
              notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <Check className="h-4 w-4" />
              {notification.message}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-[#60c0ea] animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Cargando base de datos y reagendas...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Legend / Filter Bar */}
            {(() => {
              const countReagenda = clientes.filter(c => c.reagendar_fecha && !c.resultado_primer_contacto?.toLowerCase().includes('visita')).length;
              const countVisita = clientes.filter(c => c.reagendar_fecha && c.resultado_primer_contacto?.toLowerCase().includes('visita')).length;
              const countGlpi = clientes.filter(c => c.requiere_ticket_glpi).length;
              const countTotal = countReagenda + countVisita + countGlpi;

              const allActive = filterTypes.reagenda && filterTypes.visita && filterTypes.glpi;

              return (
                <div className="bg-card/30 backdrop-blur-md border border-border/80 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] bg-[#60c0ea]/10 border border-[#60c0ea]/30 font-black text-[#60c0ea] uppercase tracking-widest px-2.5 py-1 rounded-xl">Filtros</span>
                    <span className="text-xs text-muted-foreground font-semibold">Toca las categorías para activar/desactivar en la vista:</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Toggle All Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setFilterTypes({
                          reagenda: !allActive,
                          visita: !allActive,
                          glpi: !allActive
                        });
                      }}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                        allActive 
                          ? 'bg-[#60c0ea] text-[#002851] border-[#60c0ea] shadow-lg shadow-[#60c0ea]/10 scale-105' 
                          : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      Todas ({countTotal})
                    </button>

                    {/* Reagendas (Call) */}
                    <button
                      type="button"
                      onClick={() => setFilterTypes(prev => ({ ...prev, reagenda: !prev.reagenda }))}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                        filterTypes.reagenda 
                          ? 'bg-[#004e74]/20 text-[#60c0ea] border-[#004e74]/40 shadow-md shadow-[#60c0ea]/5' 
                          : 'bg-secondary/40 border-border text-gray-500 hover:text-foreground'
                      }`}
                    >
                      📞 Reagendas ({countReagenda})
                    </button>

                    {/* Visitas (Office) */}
                    <button
                      type="button"
                      onClick={() => setFilterTypes(prev => ({ ...prev, visita: !prev.visita }))}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                        filterTypes.visita 
                          ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-md shadow-indigo-500/5' 
                          : 'bg-secondary/40 border-border text-gray-500 hover:text-foreground'
                      }`}
                    >
                      🏢 Visitas ({countVisita})
                    </button>

                    {/* GLPI Tickets */}
                    <button
                      type="button"
                      onClick={() => setFilterTypes(prev => ({ ...prev, glpi: !prev.glpi }))}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                        filterTypes.glpi 
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-md shadow-amber-500/5' 
                          : 'bg-secondary/40 border-border text-gray-500 hover:text-foreground'
                      }`}
                    >
                      🚨 Tickets GLPI ({countGlpi})
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Calendar View (8 cols) */}
            <div className="lg:col-span-8 bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
              
              {/* Month Header Controller */}
              <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {monthNames[currentMonth]} <span className="text-[#60c0ea] font-black">{currentYear}</span>
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={prevMonth}
                    className="p-2 bg-secondary border border-border text-foreground rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-2 bg-[#004e74]/20 border border-[#004e74]/40 text-[#60c0ea] text-xs font-bold rounded-xl hover:bg-[#004e74]/30 transition-colors uppercase"
                  >
                    Hoy
                  </button>
                  <button 
                    onClick={nextMonth}
                    className="p-2 bg-secondary border border-border text-foreground rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Day names row */}
              <div className="grid grid-cols-7 border-b border-border text-center py-3 bg-secondary/10">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <span key={day} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {day}
                  </span>
                ))}
              </div>

              {/* Calendar Grid Cells */}
              <div className="grid grid-cols-7 grid-rows-6 bg-secondary/5 divide-x divide-y divide-border/40">
                {allCells.map((cell, idx) => {
                  const cellYear = cell.date.getFullYear();
                  const cellMonth = cell.date.getMonth();
                  const cellDay = cell.date.getDate();

                  // Filter clients scheduled for this cell day or with GLPI ticket from this day
                  const dayClients = clientes.filter(c => {
                    const isVisita = c.resultado_primer_contacto?.toLowerCase().includes('visita');
                    
                    let matchesReagenda = false;
                    if (c.reagendar_fecha) {
                      const rDate = new Date(c.reagendar_fecha);
                      const isSameDay = rDate.getFullYear() === cellYear &&
                                        rDate.getMonth() === cellMonth &&
                                        rDate.getDate() === cellDay;
                      if (isSameDay) {
                        if (isVisita) {
                          matchesReagenda = filterTypes.visita;
                        } else {
                          matchesReagenda = filterTypes.reagenda;
                        }
                      }
                    }
                    
                    let matchesGLPI = false;
                    if (c.requiere_ticket_glpi && c.primer_contacto) {
                      const pDate = new Date(c.primer_contacto);
                      const isSameDay = pDate.getFullYear() === cellYear &&
                                    pDate.getMonth() === cellMonth &&
                                    pDate.getDate() === cellDay;
                      if (isSameDay) {
                        matchesGLPI = filterTypes.glpi;
                      }
                    }
                    
                    return matchesReagenda || matchesGLPI;
                  }).sort((a, b) => {
                    const timeA = a.reagendar_fecha 
                      ? new Date(a.reagendar_fecha).getTime() 
                      : (a.primer_contacto ? new Date(a.primer_contacto).getTime() : 0);
                    const timeB = b.reagendar_fecha 
                      ? new Date(b.reagendar_fecha).getTime() 
                      : (b.primer_contacto ? new Date(b.primer_contacto).getTime() : 0);
                    return timeA - timeB;
                  });

                  const today = new Date();
                  const isToday = today.getFullYear() === cellYear &&
                                  today.getMonth() === cellMonth &&
                                  today.getDate() === cellDay;

                  return (
                    <div 
                      key={idx}
                      className={`min-h-[100px] p-2 flex flex-col justify-between transition-colors relative group ${
                        cell.isCurrentMonth ? 'bg-card' : 'bg-secondary/10 text-gray-600'
                      } ${isToday ? 'bg-[#004e74]/5 border-2 border-[#60c0ea]/40' : ''}`}
                    >
                      {/* Day Number */}
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                          isToday 
                            ? 'bg-[#60c0ea] text-[#002851] font-black' 
                            : cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'
                        }`}>
                          {cell.day}
                        </span>
                        
                        {dayClients.length > 0 && (
                          <span className="text-[9px] bg-[#60c0ea]/10 text-[#60c0ea] font-extrabold px-1.5 py-0.5 rounded-full block">
                            {dayClients.length} {dayClients.length === 1 ? 'Caso' : 'Casos'}
                          </span>
                        )}
                      </div>

                      {/* Clients list */}
                      <div className="space-y-1 overflow-y-auto max-h-[72px] pr-0.5 scrollbar-thin">
                        {dayClients.map((c) => {
                          const isVisita = c.resultado_primer_contacto?.toLowerCase().includes('visita');
                          const timeStr = c.reagendar_fecha 
                            ? new Date(c.reagendar_fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }) 
                            : '';
                          
                          let badgeBg = 'bg-secondary text-foreground hover:bg-secondary/80';
                          if (c.informado) {
                            badgeBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20';
                          } else if (c.requiere_ticket_glpi) {
                            badgeBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-emerald-500/20';
                          } else if (isVisita) {
                            badgeBg = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20';
                          } else {
                            badgeBg = 'bg-[#004e74]/20 text-[#60c0ea] border border-[#004e74]/30 hover:bg-[#004e74]/30';
                          }

                          const isSelected = selectedCliente?.id === c.id;

                          return (
                            <button
                              key={c.id}
                              onClick={() => setSelectedCliente(c)}
                              className={`w-full text-left text-[10px] font-bold rounded px-1.5 py-0.5 block truncate transition-all ${badgeBg} ${
                                isSelected ? 'ring-2 ring-[#60c0ea]' : ''
                              }`}
                            >
                              <span className="font-mono text-[8px] opacity-75 mr-1 font-semibold">
                                {c.requiere_ticket_glpi ? 'GLPI 🚨' : (isVisita ? `VISITA 🏢 ${timeStr}` : timeStr)}
                              </span>
                              <span className="uppercase">{c.nombre}{c.apellido ? ` ${c.apellido.substring(0, 1)}.` : ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right: Active Detail Panel (4 cols) */}
            <div className="lg:col-span-4">
              {selectedCliente ? (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5 animate-slide-up relative">
                  
                  {/* Panel Header */}
                  <div className="border-b border-border pb-4 flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-[#60c0ea] uppercase tracking-wider block">Ficha de Reagenda</span>
                      <h2 className="text-lg font-bold text-foreground uppercase mt-0.5">{selectedCliente.nombre} {selectedCliente.apellido}</h2>
                      <span className="text-xs text-muted-foreground block font-mono">Tlf: {selectedCliente.telefono}</span>
                      {selectedCliente.cedula && <span className="text-xs text-muted-foreground block font-mono">C.I: {selectedCliente.cedula}</span>}
                      {selectedCliente.nro_contrato && <span className="text-xs text-muted-foreground block font-mono">Contrato: {selectedCliente.nro_contrato}</span>}
                    </div>
                    <button 
                      onClick={() => setSelectedCliente(null)} 
                      className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quick info badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-secondary/40 p-2.5 rounded-xl border border-border/50 text-left">
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Plan</span>
                      <span className="text-foreground uppercase block font-semibold truncate">{selectedCliente.plan_contratado}</span>
                    </div>
                    <div className="bg-secondary/40 p-2.5 rounded-xl border border-border/50 text-left">
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Ciclo Actual</span>
                      <span className="text-foreground block font-semibold">Ciclo {selectedCliente.ciclo_actual === 10 ? 15 : (selectedCliente.ciclo_actual || 15)}</span>
                    </div>
                  </div>

                  {/* Speech Button */}
                  <button
                    onClick={() => setShowSpeechModal(true)}
                    className="w-full bg-gradient-to-r from-[#004e74] to-[#122b51] hover:from-[#60c0ea] hover:to-[#004e74] text-white hover:text-[#002851] font-bold py-3 px-4 rounded-xl shadow-lg border border-[#60c0ea]/30 hover:border-[#60c0ea]/50 flex items-center justify-center gap-2 transition-all group"
                  >
                    <MessageSquare className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                    <span>Ver Speech de Llamada</span>
                  </button>

                  {/* Operations Edit Form */}
                  <form onSubmit={handleSaveDetails} className="space-y-4">
                    
                    {/* Informed Button */}
                    <div className="w-full">
                      <button
                        type="button"
                        onClick={() => setInformadoVal(!informadoVal)}
                        className={`w-full flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          informadoVal 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold shadow-md shadow-emerald-500/5' 
                            : 'bg-secondary/40 border-border text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <CheckCircle2 className={`h-5 w-5 mb-1 ${informadoVal ? 'text-emerald-400' : 'text-gray-500'}`} />
                        <span className="text-[9px] uppercase tracking-wider block">¿Fue Informado?</span>
                        <span className="text-xs font-black uppercase block mt-0.5">{informadoVal ? 'SÍ, CONFIRMADO' : 'NO CONTACTADO'}</span>
                      </button>
                    </div>

                    {/* Contact History */}
                    {selectedCliente.primer_contacto && (
                      <div className="bg-secondary/20 border border-border p-2.5 rounded-xl text-xs flex items-center gap-2 text-left">
                        <Clock className="h-4 w-4 text-[#60c0ea]" />
                        <div>
                          <span className="text-[8px] text-gray-500 font-bold block uppercase">Último Contacto</span>
                          <span className="text-foreground">{new Date(selectedCliente.primer_contacto).toLocaleString('es-ES')}</span>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                        Notas de la Llamada / Visita
                      </label>
                      <textarea
                        rows={3}
                        value={resultadoContacto}
                        onChange={(e) => setResultadoContacto(e.target.value)}
                        placeholder="Registra qué sucedió en la conversación o el motivo de la reagenda..."
                        className="w-full bg-secondary border border-border rounded-xl p-3 text-xs focus:outline-none focus:border-[#60c0ea] text-foreground placeholder-gray-500"
                      />
                    </div>

                    {/* Reschedule Date Input */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                        Modificar Fecha de Reagenda
                      </label>
                      <input
                        type="datetime-local"
                        value={reagendarDate}
                        onChange={(e) => setReagendarDate(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#60c0ea] text-foreground"
                      />
                    </div>

                    {/* GLPI Ticket Section */}
                    <div className="border border-border rounded-xl p-3 bg-secondary/10 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground uppercase">¿Reportar Ticket GLPI?</span>
                        <input
                          type="checkbox"
                          checked={glpiActivo}
                          onChange={(e) => setGlpiActivo(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-border bg-secondary text-[#60c0ea] focus:ring-[#60c0ea]"
                        />
                      </div>
                      
                      {glpiActivo && (
                        <textarea
                          rows={2}
                          value={glpiDetalles}
                          onChange={(e) => setGlpiDetalles(e.target.value)}
                          placeholder="Número de ticket y detalles de falla de ONT/Lentitud..."
                          className="w-full bg-secondary border border-border rounded-xl p-2 text-xs focus:outline-none focus:border-[#60c0ea] text-foreground placeholder-gray-500"
                        />
                      )}
                    </div>

                    {/* Save Button */}
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-[#60c0ea] hover:bg-[#4eaad4] text-[#002851] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{actionLoading ? 'Guardando...' : 'Actualizar Registro'}</span>
                    </button>

                  </form>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-xl flex flex-col items-center justify-center gap-4 min-h-[400px]">
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-bold text-foreground uppercase">Visualizador de Fichas</h3>
                  <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                    Haz clic en cualquiera de los bloques de clientes programados dentro del calendario para desplegar los detalles de llamada, speech personalizado y registrar avances.
                  </p>
                  
                  {/* Shortcut to clients listing */}
                  <Link
                    href="/clientes"
                    className="inline-flex items-center gap-1.5 text-xs text-[#60c0ea] hover:text-foreground font-semibold mt-4 border border-[#60c0ea]/20 bg-[#60c0ea]/5 px-4 py-2 rounded-xl transition-all"
                  >
                    Ir a Gestión de Llamadas
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

          </div>
          </div>
        )}

      </div>

      {/* Speech Modal */}
      {showSpeechModal && selectedCliente && (() => {
        const speech = generateSpeechText(selectedCliente);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-card border border-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
              
              {/* Header */}
              <div className="bg-secondary/40 px-6 py-4 flex items-center justify-between border-b border-border">
                <h3 className="font-bold text-foreground text-sm uppercase flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-[#60c0ea]" /> Speech de Llamada Personalizado
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSpeechModal(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4 text-left">
                {/* Meta details of speech client */}
                <div className="flex flex-wrap items-center gap-2 bg-secondary/30 p-3 rounded-2xl border border-border/50 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Cliente</span>
                    <span className="text-foreground font-bold uppercase">{selectedCliente.nombre} {selectedCliente.apellido}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-border mx-2" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Ciclo</span>
                    <span className="text-foreground font-bold">{selectedCliente.ciclo_actual === 10 ? 15 : (selectedCliente.ciclo_actual || 15)}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-border mx-2" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Plan</span>
                    <span className="text-emerald-400 font-bold uppercase">{selectedCliente.plan_contratado}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-border mx-2" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Tarifa</span>
                    <span className="text-[#60c0ea] font-bold">${selectedCliente.costo_plan.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-secondary border border-border rounded-2xl p-5 space-y-4 text-sm text-foreground leading-relaxed max-h-[300px] overflow-y-auto">
                  <p>{speech.saludo}</p>
                  <p>{speech.motivo}</p>
                  <p>{speech.planInfo}</p>
                  <p className="border-t border-border pt-3 text-[#60c0ea] font-semibold">{speech.cierre}</p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-2xl text-xs flex items-start gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Tono sugerido:</strong> Explicar pacientemente que la migración del día 30 al 1 es una mejora de procesamiento para asegurar su servicio y evitar interrupciones de facturación.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-secondary/40 border-t border-border text-right">
                <button
                  type="button"
                  onClick={() => setShowSpeechModal(false)}
                  className="bg-[#60c0ea] hover:bg-[#4eaad4] text-[#002851] font-bold text-xs px-5 py-2.5 rounded-xl uppercase transition-all"
                >
                  Entendido / Cerrar
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </main>
  );
}
