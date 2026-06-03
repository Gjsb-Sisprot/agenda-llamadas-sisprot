'use client';

import { useClientes } from '@/hooks/useClientes';
import {
  Users, Search, Check, X, Phone, MessageSquare, AlertCircle, Save, CheckCircle2,
  ChevronRight, CalendarDays, Loader2, Mail, MapPin, PhoneOff, Building2, User, Hash, Clock,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';


export default function ClientesPage() {
  const {
    loading,
    selectedCliente,
    setSelectedCliente,
    searchQuery,
    setSearchQuery,
    actionLoading,
    notification,
    resultadoContacto,
    setResultadoContacto,
    reagendarDate,
    setReagendarDate,
    informadoVal,
    setInformadoVal,
    contestoLlamada,
    setContestoLlamada,
    operatorName,
    secondsElapsed,
    setSecondsElapsed,
    timerActive,
    setTimerActive,
    stageAnswers,
    setStageAnswers,
    duracionLlamada,
    whatsappMsg,
    setWhatsappMsg,
    whatsappLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    showSpeechModal,
    setShowSpeechModal,
    activeSpeechStage,
    setActiveSpeechStage,
    handleFinalizarLlamada,
    formatTime,
    handleSaveDetails,
    handleNoContesto,
    handleSendWhatsApp,
    handleSearchSubmit,
    getSpeechStages,
    clientesFiltrados,
    paginatedClientes,
    totalInformados,
    totalPendientes,
    porcentajeMeta,
    atendidosHoy,
    metaDiaria,
    myClientes,
    itemsPerPage,
    triggerWebhookPortalPago,
    handleReagendarSpeech,
    handleAgendarVisitaSpeech,
    handleFinalizarSpeech,
    showResumenModal,
    setShowResumenModal,
    resumenData,
  } = useClientes();


  const totalItems = clientesFiltrados.length;

  const handleSiguienteContactado = () => {
    setShowResumenModal(false);
    const nextPending = clientesFiltrados.find(c => !c.informado);
    if (nextPending) {
      setSelectedCliente(nextPending);
    } else {
      setSelectedCliente(null);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2d4a] pb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#60c0ea] to-[#004e74] flex items-center justify-center shadow-lg shadow-[#60c0ea]/10">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight uppercase">Gestión de Llamadas</h1>
              <p className="text-muted-foreground text-sm">
                Control de llamadas · {operatorName ? <span>Operador: <strong className="text-[#60c0ea]">{operatorName}</strong></span> : 'Migración de clientes'} · <span className="text-[#60c0ea] font-bold">{myClientes.length.toLocaleString()} clientes asignados</span>
              </p>
            </div>
          </div>

          {/* Stats chips */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold">
              <Check className="h-3.5 w-3.5" />
              {totalInformados} Informados
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold">
              <Phone className="h-3.5 w-3.5" />
              {totalPendientes} Pendientes
            </div>
            {notification && (
              <div className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <Check className="h-4 w-4" />
                {notification.message}
              </div>
            )}
          </div>
        </div>

        {/* Meta Diaria del Operador */}
        {operatorName && operatorName !== "Elisaul Reyes" && (
          <div className="bg-card border border-border rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-[#09152b] to-[#0c2447] border-[#004e74]/30 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">Meta Diaria</span>
              <h2 className="text-sm font-bold text-white uppercase">Progreso Personal de Hoy</h2>
              <p className="text-[11px] text-muted-foreground">
                Has gestionado <strong className="text-white">{atendidosHoy}</strong> de <strong className="text-white">{metaDiaria}</strong> llamadas/contactos hoy.
              </p>
            </div>
            
            <div className="w-full sm:w-64 space-y-2 shrink-0">
              <div className="flex justify-between text-[10px] font-bold text-white uppercase">
                <span>{porcentajeMeta}% Completado</span>
                <span className="text-[#60c0ea]">{atendidosHoy} / {metaDiaria} Clientes</span>
              </div>
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden p-0.5 border border-border">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-[#60c0ea] h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${porcentajeMeta}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-[#60c0ea] animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Cargando directorio de clientes desde el CRM...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">

            {/* Left Column: List & Filters */}
            <div className="space-y-4">

              {/* Search + Filters */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xl space-y-4">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por cédula, contrato, nombre, teléfono o email..."
                      className="w-full bg-secondary border border-border text-foreground text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-[#60c0ea] placeholder-gray-500 font-medium transition-all"
                    />
                    <Search className="absolute left-4 top-4 h-4.5 w-4.5 text-gray-400" />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#004e74] hover:bg-[#004e74]/80 border border-border text-white font-bold text-xs px-5 py-3.5 rounded-xl uppercase transition-all flex items-center gap-1.5"
                  >
                    <Search className="h-4 w-4" />
                    <span>Buscar</span>
                  </button>
                </form>
              </div>

              {/* Client List */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-secondary/50 border-b border-border flex items-center justify-between">
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Directorio de Clientes ({clientesFiltrados.length.toLocaleString()} de {myClientes.length.toLocaleString()})
                  </h2>
                  <span className="text-[10px] bg-[#004e74] text-[#60c0ea] font-bold px-2 py-0.5 rounded-full uppercase">
                    Ciclo 15
                  </span>
                </div>

                {clientesFiltrados.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 italic text-sm">
                    No se encontraron clientes con los filtros seleccionados.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider bg-secondary/10">
                          <th className="py-3.5 px-4">Cliente</th>
                          <th className="py-3.5 px-4">Plan</th>
                          <th className="py-3.5 px-4 text-right">Costo del plan</th>
                          <th className="py-3.5 px-4 text-right">Prorrateo</th>
                          <th className="py-3.5 px-4 text-center">Intentos</th>
                          <th className="py-3.5 px-4 text-center">Informado</th>
                          <th className="py-3.5 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedClientes.map((c) => {
                          const isSelected = selectedCliente?.id === c.id;
                          return (
                            <tr
                              key={c.id}
                              onClick={() => setSelectedCliente(c)}
                              className={`border-b border-border/50 hover:bg-secondary/20 transition-colors text-sm last:border-0 cursor-pointer ${
                                isSelected ? 'bg-[#004e74]/10 border-l-4 border-l-[#60c0ea]' : ''
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="font-bold text-foreground uppercase text-xs leading-tight">{c.nombre} {c.apellido}</div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex flex-wrap gap-x-2">
                                  {c.cedula && <span>{c.cedula}</span>}
                                  <span>· {c.telefono}</span>
                                  {c.nro_contrato && <span>· {c.nro_contrato}</span>}
                                  {c.operador && <span className="text-[#60c0ea] font-bold">· Op: {c.operador}</span>}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-foreground/80 font-semibold text-xs uppercase leading-tight">{c.plan_contratado}</div>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {c.retaining_client && (
                                    <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-md font-bold uppercase">Retenido</span>
                                  )}
                                  {c.migrate && (
                                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md font-bold uppercase">Migrar</span>
                                  )}
                                  {c.requiere_ticket_glpi && (
                                    <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-md font-bold uppercase">GLPI</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="text-emerald-400 font-bold text-xs">${c.costo_plan.toFixed(2)}</div>
                                {c.deuda_bs != null && c.deuda_bs > 0 && (
                                  <div className="text-[10px] text-muted-foreground font-mono">Bs {c.deuda_bs.toFixed(2)}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="text-[#60c0ea] font-mono font-bold text-xs">${(c.costo_plan / 2).toFixed(2)}</div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-mono font-bold text-xs text-amber-400">{c.intentos_fallidos || 0}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {c.informado ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md uppercase font-semibold">
                                    <Check className="h-3 w-3" /> Sí
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-400 text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md uppercase font-semibold">
                                    <X className="h-3 w-3" /> No
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 bg-secondary/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground font-semibold">
                      Mostrando {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(totalItems, currentPage * itemsPerPage)} de {totalItems} clientes
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-foreground font-bold transition-all flex items-center gap-1"
                        title="Ir al inicio"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                        <span>Inicio</span>
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-foreground font-bold transition-all"
                      >
                        Anterior
                      </button>
                      <span className="font-bold text-foreground">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-foreground font-bold transition-all"
                      >
                        Siguiente
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-foreground font-bold transition-all flex items-center gap-1"
                        title="Ir al final"
                      >
                        <span>Final</span>
                        <ChevronsRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Panel Modal overlay */}
            {selectedCliente && (
              <div
                className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setSelectedCliente(null)}
              >
                <div
                  className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-xl animate-slide-up flex flex-col max-h-[90vh] overflow-hidden text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Panel Header */}
                  <div className="p-5 border-b border-border bg-gradient-to-br from-[#0a1628] to-[#0d1f3c] flex items-center justify-between shrink-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#60c0ea] uppercase tracking-wider block">Panel del Cliente</span>
                      <h2 className="text-lg font-extrabold text-white uppercase mt-0.5 leading-tight truncate">
                        {selectedCliente.nombre} {selectedCliente.apellido}
                      </h2>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedCliente.estado && (
                          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">{selectedCliente.estado}</span>
                        )}
                        {selectedCliente.retaining_client && (
                          <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase">Retenido</span>
                        )}
                        {selectedCliente.migrate && (
                          <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase">Migrar</span>
                        )}
                        {selectedCliente.contract_tag && (
                          <span className="text-[9px] bg-[#004e74]/40 border border-[#60c0ea]/20 text-[#60c0ea] px-2 py-0.5 rounded-full font-bold uppercase">{selectedCliente.contract_tag}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCliente(null)}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary ml-2 flex-shrink-0"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Scrollable Container for Panel Body */}
                  <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    {/* Info grid */}
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Phone className="h-3.5 w-3.5 text-[#60c0ea] shrink-0" />
                          <span className="font-mono font-semibold">{selectedCliente.telefono}</span>
                        </div>
                        {selectedCliente.email && (
                          <div className="flex items-center gap-2 text-foreground/80">
                            <Mail className="h-3.5 w-3.5 text-[#60c0ea] shrink-0" />
                            <span className="truncate font-mono text-[10px]">{selectedCliente.email}</span>
                          </div>
                        )}
                        {selectedCliente.cedula && (
                          <div className="flex items-center gap-2 text-foreground/80">
                            <User className="h-3.5 w-3.5 text-[#60c0ea] shrink-0" />
                            <span className="font-mono">{selectedCliente.cedula}</span>
                          </div>
                        )}
                        {selectedCliente.nro_contrato && (
                          <div className="flex items-center gap-2 text-foreground/80">
                            <Hash className="h-3.5 w-3.5 text-[#60c0ea] shrink-0" />
                            <span className="font-mono">{selectedCliente.nro_contrato}</span>
                          </div>
                        )}
                      </div>

                      {/* Plan + Financial Details Grid */}
                      <div className="bg-[#0e1726]/50 border border-[#1e2d4a] rounded-xl p-3.5 grid grid-cols-2 gap-3 mt-2">
                        <div className="col-span-2 pb-1.5 border-b border-[#1e2d4a]">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Plan Contratado</span>
                          <span className="text-xs font-extrabold text-[#60c0ea] uppercase block truncate mt-0.5">{selectedCliente.plan_contratado}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Costo del plan</span>
                          <span className="text-xs font-mono font-black text-foreground block mt-0.5">${selectedCliente.costo_plan.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Prorrateo</span>
                          <span className="text-xs font-mono font-black text-emerald-400 block mt-0.5">${(selectedCliente.costo_plan / 2).toFixed(2)}</span>
                        </div>
                        <div className="col-span-2 pt-1.5 border-t border-[#1e2d4a] flex items-center justify-between">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Intentos de llamada</span>
                          <span className="bg-amber-500/10 text-amber-300 font-mono font-black border border-amber-500/20 px-2.5 py-0.5 rounded-lg text-xs">
                            {selectedCliente.intentos_fallidos || 0}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      {(selectedCliente.sector || selectedCliente.parroquia || selectedCliente.direccion) && (
                        <div className="space-y-1">
                          {(selectedCliente.sector || selectedCliente.parroquia) && (
                            <div className="flex items-center gap-2 text-foreground/70">
                              <MapPin className="h-3.5 w-3.5 text-[#60c0ea] shrink-0" />
                              <span className="text-xs font-semibold">{[selectedCliente.sector, selectedCliente.parroquia].filter(Boolean).join(' · ')}</span>
                            </div>
                          )}
                          {selectedCliente.direccion && (
                            <p className="text-[10px] text-muted-foreground pl-5 leading-relaxed line-clamp-2">{selectedCliente.direccion}</p>
                          )}
                        </div>
                      )}

                      {/* Bank */}
                      {selectedCliente.banco_nombre && (
                        <div className="flex items-start gap-2 text-foreground/70">
                          <Building2 className="h-3.5 w-3.5 text-[#60c0ea] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground block uppercase">{selectedCliente.banco_nombre}</span>
                            {selectedCliente.banco_nro_cuenta && (
                              <span className="text-[10px] font-mono text-foreground/60">{selectedCliente.banco_nro_cuenta}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Call Answer Guard & Form */}
                    <div className="border-t border-border/50 pt-4">
                      {contestoLlamada === null ? (
                        <div className="space-y-3 text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">¿El cliente contestó la llamada?</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setContestoLlamada(true)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-3 rounded-xl transition-all text-xs uppercase shadow-md flex items-center justify-center gap-1.5"
                            >
                              <Phone className="h-3.5 w-3.5" /> Sí contestó
                            </button>
                            <button
                              type="button"
                              onClick={handleNoContesto}
                              disabled={actionLoading}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-3 rounded-xl transition-all text-xs uppercase shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              <PhoneOff className="h-3.5 w-3.5" />
                              {actionLoading ? 'Guardando...' : 'No contestó'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Stopwatch Display */}
                          {timerActive && (
                            <div className="bg-[#004e74]/15 border border-[#60c0ea]/30 rounded-xl p-3 flex items-center justify-between text-xs animate-pulse">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Llamada en curso:</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-black text-sm text-[#60c0ea] flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatTime(secondsElapsed)}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleFinalizarLlamada}
                                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2.5 rounded-lg text-[9px] uppercase tracking-wider transition-all shadow-md"
                                >
                                  Finalizar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Finalized Duration Display */}
                          {duracionLlamada !== null && !timerActive && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
                              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[9px]">Llamada finalizada:</span>
                              <span className="font-mono font-black text-emerald-400 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatTime(duracionLlamada)}
                              </span>
                            </div>
                          )}

                          {/* Speech Button */}
                          <button
                            onClick={() => {
                              setSecondsElapsed(0);
                              setTimerActive(true);
                              setShowSpeechModal(true);
                            }}
                            className="w-full bg-gradient-to-r from-[#004e74] to-[#122b51] hover:from-[#60c0ea] hover:to-[#004e74] text-white hover:text-[#002851] font-bold py-3 px-4 rounded-xl shadow-lg border border-[#60c0ea]/30 flex items-center justify-center gap-2 transition-all group"
                          >
                            <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            Ver Speech de Llamada
                          </button>

                          {/* WhatsApp Messaging Widget */}
                          <div className="bg-[#0e1726]/40 border border-border/80 rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center gap-1.5 border-b border-border/50 pb-2">
                              <MessageSquare className="h-4 w-4 text-[#60c0ea]" />
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Enviar WhatsApp al Cliente</span>
                            </div>
                            
                            <form onSubmit={handleSendWhatsApp} className="space-y-2.5">
                              <textarea
                                rows={2}
                                value={whatsappMsg}
                                onChange={(e) => setWhatsappMsg(e.target.value)}
                                placeholder="Escribe el mensaje de WhatsApp..."
                                className="w-full bg-[#0b111e]/80 border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#60c0ea] text-white placeholder-gray-500"
                                required
                              />
                              
                              <button
                                type="submit"
                                disabled={whatsappLoading || !whatsappMsg.trim()}
                                className="w-full bg-[#004e74] hover:bg-[#60c0ea] hover:text-[#002851] text-white font-bold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                {whatsappLoading ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Verificando y Enviando...</span>
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    <span>Verificar y Enviar</span>
                                  </>
                                )}
                              </button>
                            </form>
                          </div>

                          {/* Form */}
                          <form onSubmit={handleSaveDetails} className="space-y-3">

                            {/* Informado toggle (read-only) */}
                            <button
                              type="button"
                              disabled={true}
                              className={`w-full flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-not-allowed ${
                                informadoVal
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                                  : 'bg-secondary/40 border-border text-gray-400'
                              }`}
                            >
                              <CheckCircle2 className={`h-5 w-5 mb-1 ${informadoVal ? 'text-emerald-400' : 'text-gray-500'}`} />
                              <span className="text-[9px] uppercase tracking-wider block">¿Fue Informado de la Migración?</span>
                              <span className="text-xs font-black uppercase mt-0.5">{informadoVal ? 'SÍ, CONFIRMADO' : 'NO CONTACTADO'}</span>
                            </button>

                            {/* Last contact date */}
                            {selectedCliente.primer_contacto && (
                              <div className="bg-secondary/30 border border-border p-2.5 rounded-xl flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                  <span className="text-[9px] font-bold text-[#60c0ea] block uppercase">Último Contacto</span>
                                  <span className="text-xs text-foreground font-semibold">{new Date(selectedCliente.primer_contacto).toLocaleString('es-ES')}</span>
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Notas del Contacto</label>
                              <textarea
                                rows={3}
                                value={resultadoContacto}
                                onChange={(e) => setResultadoContacto(e.target.value)}
                                placeholder="Bitácora de la llamada..."
                                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#60c0ea] text-foreground placeholder-gray-500"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="w-full bg-[#60c0ea] hover:bg-[#4eaad4] text-[#002851] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              {actionLoading ? 'Guardando...' : 'Guardar Bitácora'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Speech Modal */}
      {showSpeechModal && selectedCliente && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSpeechModal(false)}
        >
          <div
            className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl animate-slide-up flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-border bg-gradient-to-br from-[#0a1628] to-[#0d1f3c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#60c0ea] animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Libreto de Llamada Oficial</h3>
                  <p className="text-[10px] text-slate-300 font-semibold">Cliente: {selectedCliente.nombre} {selectedCliente.apellido}</p>
                </div>
              </div>

              {/* Stopwatch display inside modal */}
              {timerActive ? (
                <div className="flex items-center gap-3 bg-[#004e74]/40 px-3 py-1.5 rounded-xl border border-[#60c0ea]/20 animate-pulse">
                  <span className="font-mono text-xs font-black text-[#60c0ea] flex items-center gap-1">
                    <Clock className="h-4 w-4 text-[#60c0ea] animate-spin-slow" />
                    {formatTime(secondsElapsed)}
                  </span>
                  <button
                    type="button"
                    onClick={handleFinalizarLlamada}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-0.5 px-2 rounded-lg text-[8px] uppercase tracking-wider transition-all"
                  >
                    Finalizar
                  </button>
                </div>
              ) : (
                duracionLlamada !== null && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-emerald-400">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span className="font-mono text-xs font-black">{formatTime(duracionLlamada)}</span>
                  </div>
                )
              )}

              <button onClick={() => setShowSpeechModal(false)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Stages Bar */}
            <div className="bg-secondary/40 border-b border-border p-2 flex gap-1 overflow-x-auto">
              {(() => {
                const stages = getSpeechStages(selectedCliente);
                return stages.map((stg, idx) => {
                  const isActive = activeSpeechStage === idx;
                  return (
                    <button
                      key={stg.id}
                      onClick={() => {
                        if (idx === 3 && activeSpeechStage === 2 && stageAnswers[2] === true) {
                          triggerWebhookPortalPago(selectedCliente.id);
                        }
                        setActiveSpeechStage(idx);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'bg-[#60c0ea] text-[#002851] shadow-md shadow-[#60c0ea]/10 scale-105'
                          : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Etapa {stg.id}: {stg.title}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Content Area */}
            {(() => {
              const stages = getSpeechStages(selectedCliente);
              const currentStg = stages[activeSpeechStage];
              if (!currentStg) return null;

              const QUESTIONS_BY_STAGE: Record<number, string> = {
                0: "¿Dispone de unos minutos para explicarle la información?",
                1: "¿Me confirma por favor si hasta este punto queda claro que su factura será fijada en bolívares con la tasa BCV del día 01 de cada mes?",
                2: "¿Me confirma si quedó claro que en junio no tendrá doble facturación, sino un prorrateo, y que desde julio su ciclo será el día 01 de cada mes?",
                3: "¿Hasta aquí queda clara la información que verá reflejada en el portal?",
                4: "¿Me confirma si quedó clara la información sobre el SLA y la firma digital del contrato actualizado?",
                5: "¿Me confirma si quedó clara la política de suspensión y el cobro completo de la mensualidad?",
                6: "¿Me confirma por favor si la información principal quedó clara?"
              };

              return (
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  {/* Internal Instruction Box */}
                  <div className="bg-[#004e74]/10 border border-[#60c0ea]/20 p-3 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="h-4.5 w-4.5 text-[#60c0ea] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-[#60c0ea] uppercase tracking-wider block">Nota Operativa / Instrucción</span>
                      <p className="text-xs text-foreground/80 font-medium leading-relaxed mt-0.5">{currentStg.instructions}</p>
                    </div>
                  </div>

                  {/* Speech Script Box */}
                  <div className="bg-secondary/20 border border-border p-5 rounded-2xl space-y-4 font-medium text-sm leading-relaxed text-foreground select-text">
                    {currentStg.text.map((para, pIdx) => {
                      // Simple markdown parser helper for bold tags
                      const parts = para.split('**');
                      return (
                        <p key={pIdx}>
                          {parts.map((part, partIdx) => 
                            partIdx % 2 === 1 ? <strong key={partIdx} className="text-[#60c0ea] font-extrabold">{part}</strong> : part
                          )}
                        </p>
                      );
                    })}
                  </div>

                  {/* Interactive Question / Answer Buttons */}
                  {QUESTIONS_BY_STAGE[activeSpeechStage] !== undefined && (
                    <div className="bg-[#004e74]/15 border border-[#60c0ea]/30 rounded-2xl p-5 space-y-4 text-left">
                      <span className="text-[10px] font-bold text-[#60c0ea] uppercase tracking-wider block">Registrar Respuesta de la Etapa</span>
                      <p className="text-xs font-semibold text-foreground leading-relaxed">
                        {QUESTIONS_BY_STAGE[activeSpeechStage]}
                      </p>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setStageAnswers(prev => ({ ...prev, [activeSpeechStage]: true }))}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all uppercase flex items-center justify-center gap-1.5 ${
                            stageAnswers[activeSpeechStage] === true
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105'
                              : 'bg-secondary border border-border text-foreground hover:bg-secondary/80'
                          }`}
                        >
                          <Check className="h-4 w-4" /> Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setStageAnswers(prev => ({ ...prev, [activeSpeechStage]: false }))}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all uppercase flex items-center justify-center gap-1.5 ${
                            stageAnswers[activeSpeechStage] === false
                              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 scale-105'
                              : 'bg-secondary border border-border text-foreground hover:bg-secondary/80'
                          }`}
                        >
                          <X className="h-4 w-4" /> No
                        </button>
                      </div>

                      {/* Special Handling for Stage 1 (Index 0) - "No" Answer (Call Reschedule) */}
                      {activeSpeechStage === 0 && stageAnswers[0] === false && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl space-y-3 text-left animate-slide-up mt-3">
                          <span className="text-[10px] font-bold text-red-400 uppercase block">El cliente indicó que NO tiene disponibilidad</span>
                          <p className="text-xs text-foreground/80 leading-relaxed font-semibold">
                            Entendemos perfectamente. ¿Podría indicarnos una hora o momento del día para llamarle nuevamente?
                          </p>
                          
                          <div className="space-y-2 pt-2 border-t border-border/40">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Programar Nueva Llamada (Reagenda)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="datetime-local"
                                value={reagendarDate}
                                onChange={(e) => setReagendarDate(e.target.value)}
                                className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#60c0ea] text-foreground font-semibold"
                              />
                              <button
                                type="button"
                                onClick={() => handleReagendarSpeech(reagendarDate)}
                                className="bg-[#60c0ea] hover:bg-[#4eaad4] text-[#002851] font-bold px-4 py-2 rounded-xl text-xs uppercase transition-all flex-shrink-0"
                              >
                                Reagendar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Handling for Stages 2 to 6 (Indexes 1 to 5) - "No" Answer (Office Visit Scheduling) */}
                      {activeSpeechStage >= 1 && activeSpeechStage <= 5 && stageAnswers[activeSpeechStage] === false && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl space-y-3 text-left animate-slide-up mt-3">
                          <span className="text-[10px] font-bold text-red-400 uppercase block">El cliente no está de acuerdo o tiene dudas</span>
                          <p className="text-xs text-foreground/80 leading-relaxed font-semibold">
                            {activeSpeechStage === 1 && "Entendemos perfectamente que prefiera recibir esta explicación de forma presencial. Para su tranquilidad y mayor detalle sobre el oficio de CONATEL y la tasa BCV, agendemos una visita a nuestra oficina."}
                            {activeSpeechStage === 2 && "Comprendemos sus dudas respecto al prorrateo de junio y el nuevo ciclo. Queremos que esté 100% seguro de su facturación, por lo que le invitamos a agendar una visita a nuestra oficina para revisarlo juntos con un asesor."}
                            {activeSpeechStage === 3 && "No se preocupe si el uso del portal le genera dudas o prefiere no interactuar digitalmente. Con gusto le atenderemos en nuestra oficina física para enseñarle el portal paso a paso. Agendemos su visita."}
                            {activeSpeechStage === 4 && "Entendemos que la firma del contrato y las condiciones de SLA son temas importantes que prefiere revisar en persona. Agendemos una cita en nuestra oficina para que firme su contrato en físico o reciba asistencia personalizada."}
                            {activeSpeechStage === 5 && "Comprendemos perfectamente que prefiera conversar sobre las políticas de suspensión de forma directa. Para brindarle una atención presencial y personalizada, programemos una visita a nuestra oficina."}
                          </p>
                          
                          <div className="space-y-2 pt-2 border-t border-border/40">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Programar Visita a la Oficina
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="datetime-local"
                                value={reagendarDate}
                                onChange={(e) => setReagendarDate(e.target.value)}
                                className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#60c0ea] text-foreground font-semibold"
                              />
                              <button
                                type="button"
                                onClick={() => handleAgendarVisitaSpeech(activeSpeechStage, reagendarDate)}
                                className="bg-[#60c0ea] hover:bg-[#4eaad4] text-[#002851] font-bold px-4 py-2 rounded-xl text-xs uppercase transition-all flex-shrink-0"
                              >
                                Agendar Visita
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Handling for Stage 7 (Index 6) - "No" Answer (No scheduling, only reminder to re-explain) */}
                      {activeSpeechStage === 6 && stageAnswers[6] === false && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl space-y-3 text-left animate-slide-up mt-3 animate-pulse">
                          <span className="text-[10px] font-bold text-red-400 uppercase block">El cliente aún tiene dudas</span>
                          <p className="text-xs text-foreground/80 leading-relaxed font-semibold">
                            Es muy importante que toda la información quede totalmente clara para evitar confusiones con su facturación. Por favor, vuelva a explicar los puntos principales o repase la etapa anterior con el cliente para asegurar su comprensión.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Footer controls */}
            <div className="p-4 bg-secondary/50 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Etapa {activeSpeechStage + 1} de 7
              </span>
              <div className="flex gap-2">
                <button
                  disabled={activeSpeechStage === 0}
                  onClick={() => setActiveSpeechStage(prev => prev - 1)}
                  className="px-3.5 py-2 border border-border rounded-xl text-xs font-bold text-foreground bg-secondary disabled:opacity-40"
                >
                  Etapa Anterior
                </button>
                {activeSpeechStage < 6 ? (
                  <button
                    disabled={stageAnswers[activeSpeechStage] !== true}
                    onClick={() => {
                      if (activeSpeechStage === 2) {
                        triggerWebhookPortalPago(selectedCliente.id);
                      }
                      setActiveSpeechStage(prev => prev + 1);
                    }}
                    className="px-4 py-2 bg-[#60c0ea] hover:bg-[#4eaad4] text-[#002851] rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente Etapa
                  </button>
                ) : (
                  <button
                    disabled={stageAnswers[6] !== true}
                    onClick={handleFinalizarSpeech}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Finalizar con éxito 🚀
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Resumen de Llamada Exitosa */}
      {showResumenModal && resumenData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
            {/* Success Header */}
            <div className="p-6 text-center bg-gradient-to-br from-[#0c2e47] to-[#0a1f3c] border-b border-border flex flex-col items-center justify-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Cliente Informado Exitosamente</h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">Gestión completada y guardada</p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-secondary/40 border border-border rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Cliente</span>
                  <span className="font-extrabold text-foreground uppercase">{resumenData.clienteNombre}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Duración</span>
                  <span className="font-mono font-bold text-foreground">
                    {resumenData.duracion ? formatTime(resumenData.duracion) : '00:00'}
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Bitácora / Notas</span>
                  <p className="text-foreground/90 font-medium leading-relaxed italic bg-background p-2.5 rounded-lg border border-border/60">
                    &ldquo;{resumenData.notas}&rdquo;
                  </p>

                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={() => setShowResumenModal(false)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5"
              >
                Aceptar y Continuar
              </button>
              {clientesFiltrados.length > 0 && (
                <button
                  onClick={handleSiguienteContactado}
                  className="w-full mt-2 bg-gradient-to-r from-[#004e74] to-[#122b51] hover:from-[#60c0ea] hover:to-[#004e74] text-white hover:text-[#002851] font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 border border-[#60c0ea]/20"
                >
                  Siguiente contactado
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>

  );
}
