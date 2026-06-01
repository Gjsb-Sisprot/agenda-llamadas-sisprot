'use client';

import { useState, useEffect } from 'react';
import {
  Users, Search, Check, X, Phone, MessageSquare, AlertCircle, Save, CheckCircle2,
  ChevronRight, CalendarDays, Loader2, Mail, MapPin, PhoneOff, Building2, User, Hash, Clock
} from 'lucide-react';

interface ClienteLlamada {
  id: string;
  client_id?: number | null;
  nombre: string;
  apellido: string;
  cedula?: string | null;
  email?: string | null;
  nro_contrato?: string | null;
  telefono: string;
  plan_contratado: string;
  plan_id?: number | null;
  costo_plan: number;
  deuda_bs?: number | null;
  ciclo_actual: number;
  estado?: string | null;
  estado_id?: number | null;
  migrate?: boolean;
  direccion?: string | null;
  sector?: string | null;
  parroquia?: string | null;
  contract_tag?: string | null;
  retaining_client?: boolean;
  banco_nombre?: string | null;
  banco_nro_cuenta?: string | null;
  created_by?: string | null;
  created_at?: string | null;
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


export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteLlamada[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteLlamada | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form states
  const [resultadoContacto, setResultadoContacto] = useState('');
  const [reagendarDate, setReagendarDate] = useState('');
  const [informadoVal, setInformadoVal] = useState(false);
  const [contestoLlamada, setContestoLlamada] = useState<boolean | null>(null);

  const [operatorName, setOperatorName] = useState<string | null>(null);

  // Stopwatch/timer state
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [stageAnswers, setStageAnswers] = useState<Record<number, boolean | null>>({});
  const [duracionLlamada, setDuracionLlamada] = useState<number | null>(null);

  const handleFinalizarLlamada = () => {
    setTimerActive(false);
    setDuracionLlamada(secondsElapsed);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOperatorName(localStorage.getItem('user_name'));
    }
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, operatorName]);

  // Speech modal
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [activeSpeechStage, setActiveSpeechStage] = useState(0);

  async function fetchClientes() {
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
      console.warn('CRM API fetch failed:', err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClientes();
  }, []);

  // Reset form when client changes
  useEffect(() => {
    setContestoLlamada(null);
    setShowSpeechModal(false);
    setActiveSpeechStage(0);
    setSecondsElapsed(0);
    setTimerActive(false);
    setStageAnswers({});
    setDuracionLlamada(null);
    if (selectedCliente) {
      setResultadoContacto(selectedCliente.resultado_primer_contacto || '');
      setReagendarDate(selectedCliente.reagendar_fecha ? selectedCliente.reagendar_fecha.slice(0, 16) : '');
      setInformadoVal(selectedCliente.informado);
    } else {
      setResultadoContacto('');
      setReagendarDate('');
      setInformadoVal(false);
    }
  }, [selectedCliente]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const triggerWebhookPortalPago = async (contrato: string) => {
    if (!contrato) return;
    try {
      await fetch('https://n8n.sisprottaurus.com/webhook/notificacion_cliente_portal_pago_ciclo_01', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ CONTRATO: contrato })
      });
    } catch (err) {
      console.error('Failed to trigger portal pago webhook:', err);
    }
  };

  const triggerWebhookNoContesto = async (contrato: string) => {
    if (!contrato) return;
    try {
      await fetch('https://n8n.sisprottaurus.com/webhook/Intento-contacto-sin-respuesta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ CONTRATO: contrato })
      });
    } catch (err) {
      console.error('Failed to trigger no contesto webhook:', err);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;
    setActionLoading(true);
    const primerContactoDate = selectedCliente.primer_contacto || new Date().toISOString();

    const updatedData = {
      resultado_primer_contacto: resultadoContacto.trim() || null,
      reagendar_fecha: selectedCliente.reagendar_fecha,
      requiere_ticket_glpi: selectedCliente.requiere_ticket_glpi,
      ticket_glpi_detalles: selectedCliente.ticket_glpi_detalles,
      informado: informadoVal,
      primer_contacto: primerContactoDate,
      duracion_segundos: duracionLlamada !== null ? duracionLlamada : (selectedCliente.duracion_segundos || null),
      intentos_fallidos: selectedCliente.intentos_fallidos || 0
    };

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCliente.id, cedula: selectedCliente.cedula, ...updatedData })
      });
      if (!res.ok) throw new Error('API response not ok');
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);
      showNotification('success', 'Información guardada con éxito.');
      const updatedList = clientes.map(c => c.id === selectedCliente.id ? { ...c, ...updatedData } : c);
      setClientes(updatedList);
      setSelectedCliente({ ...selectedCliente, ...updatedData });
      setTimerActive(false);
    } catch (err) {
      console.error('Save failed:', err);
      showNotification('error', 'Error al guardar la información en Supabase.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoContesto = async () => {
    if (!selectedCliente) return;
    setActionLoading(true);
    const newIntentos = (selectedCliente.intentos_fallidos || 0) + 1;
    const isVisitaInformativa = newIntentos >= 3;

    if (isVisitaInformativa) {
      await triggerWebhookNoContesto(selectedCliente.nro_contrato || selectedCliente.id);
    }

    const updatedData = {
      resultado_primer_contacto: isVisitaInformativa 
        ? 'Agendado para visita informativa' 
        : 'Llamada no contestada',
      reagendar_fecha: null,
      requiere_ticket_glpi: false,
      ticket_glpi_detalles: null,
      informado: false,
      primer_contacto: new Date().toISOString(),
      intentos_fallidos: newIntentos,
      duracion_segundos: selectedCliente.duracion_segundos || null
    };

    const currentIndex = clientesFiltrados.findIndex(c => c.id === selectedCliente.id);
    const nextCliente = clientesFiltrados[currentIndex + 1] || clientesFiltrados[0] || null;

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCliente.id, cedula: selectedCliente.cedula, ...updatedData })
      });
      if (!res.ok) throw new Error('API response not ok');
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);

      showNotification('success', isVisitaInformativa ? 'Registrado: Agendado para visita informativa.' : 'Registrado: No contestó.');
      const updatedList = clientes.map(c => c.id === selectedCliente.id ? { ...c, ...updatedData } : c);
      setClientes(updatedList);

      if (nextCliente && nextCliente.id !== selectedCliente.id) {
        setSelectedCliente(nextCliente);
      } else {
        setSelectedCliente(null);
      }
    } catch (err) {
      console.error('Save failed:', err);
      showNotification('error', 'Error al guardar el intento de llamada.');
    } finally {
      setTimerActive(false);
      setActionLoading(false);
    }
  };

  const getSpeechStages = (cliente: ClienteLlamada) => {
    const operName = operatorName || 'el operador';
    const clientFullName = cliente.apellido ? `${cliente.nombre} ${cliente.apellido}` : cliente.nombre;
    const planName = cliente.plan_contratado;
    const planCost = `$${cliente.costo_plan.toFixed(2)}`;
    const planCostHalf = `$${(cliente.costo_plan / 2).toFixed(2)}`;
    const costBs = cliente.deuda_bs ? `Bs ${cliente.deuda_bs.toFixed(2)}` : 'Bs —';
    const clientPhone = cliente.telefono;
    const clientEmail = cliente.email || 'su correo registrado';

    return [
      {
        id: 1,
        title: 'Inicio',
        instructions: 'Si el cliente contesta, lee el siguiente libreto. Si no contesta, usa el botón "No contestó".',
        text: [
          `— Buenos días / buenas tardes, ¿tengo el gusto de hablar con el señor / la señora **${clientFullName}**?`,
          `— Le saluda **${operName}**, de **Sisprot Global Fiber, C.A.**, su proveedor de internet.`,
          `— Le llamo brevemente para informarle una actualización oficial relacionada con su facturación, tasa de cambio, ciclo de pago y uso del portal, conforme a una disposición de nuestro ente regulador **CONATEL**.`,
          `— ¿Dispone de unos minutos para explicarle la información?`,
          `*Si responde NO:* Entendemos perfectamente. ¿Podría indicarnos una hora o momento del día para llamarle nuevamente? Es importante orientarle, ya que este ajuste impacta su ciclo, su fecha de pago y la forma correcta de validar su factura.`
        ]
      },
      {
        id: 2,
        title: 'CONATEL y Tasa BCV',
        instructions: 'Explica el marco oficial y el gran beneficio de la tasa fija mensual.',
        text: [
          `— Muchas gracias, señor / señora **${clientFullName}**.`,
          `— En atención al oficio **DG N.º 1856**, de fecha de **mayo de 2026**, emitido por la **Comisión Nacional de Telecomunicaciones, CONATEL**, Sisprot Global Fiber debe aplicar una adecuación en el proceso de facturación y pago del servicio.`,
          `— El principal beneficio para usted es que su factura quedará con un **monto fijo en bolívares durante el mes**, calculado con la **tasa oficial BCV del día 01 de cada mes**.`,
          `— Esto evita variaciones diarias de tasa y le permite planificar su pago con mayor claridad, seguridad y anticipación.`,
          `— Por ejemplo, para la facturación correspondiente a junio, el monto será calculado con la **tasa BCV del 01 de junio**, y ese será el monto oficial que deberá validar y pagar a través del portal.`,
          `— Por eso es importante no calcular montos con tasas externas ni referencias distintas al portal, para evitar pagos incorrectos o excedentes.`,
          `— **¿Me confirma por favor si hasta este punto queda claro que su factura será fijada en bolívares con la tasa BCV del día 01 de cada mes?**`
        ]
      },
      {
        id: 3,
        title: 'Migración y Prorrateo',
        instructions: 'Explica la migración al ciclo 1 y el cobro prorrateado de la transición de junio.',
        text: [
          `— Gracias por su atención, señor / señora **${clientFullName}**.`,
          `— Actualmente usted tiene un plan de **${planName}**, por un costo mensual de **${planCost}**, y pertenece al **ciclo 15**.`,
          `— Bajo la modalidad anterior, su ciclo habitual vencía los días 15. Sin embargo, para dar cumplimiento a la adecuación indicada por CONATEL, todos los clientes serán migrados al **nuevo ciclo único 01**.`,
          `— Para este mes de junio, usted recibirá una notificación de cobro desde el **01 de junio**, con oportunidad de pago hasta el **15 de junio**.`,
          `— Esta factura no será una mensualidad completa ni un pago doble. Será un **prorrateo correspondiente a los días restantes del mes de junio**, desde el **15 de junio hasta el 30 de junio**.`,
          `— Es decir, en junio usted pagará aproximadamente la mitad de su plan, correspondiente únicamente a ese período de transición.`,
          `— **Ejemplo:** Su plan tiene un costo de **${planCost}**. Para junio pagará **${planCostHalf}**, calculado a la tasa BCV del 01 de junio, dando un total aproximado de **${costBs}**.`,
          `— A partir del **01 de julio**, su facturación pasará al nuevo **ciclo único 01**. Su factura será generada el día 01, con plazo de pago hasta el día 02, y el día 03 se generará el corte automático en caso de falta de pago.`,
          `— **¿Me confirma si quedó claro que en junio no tendrá doble facturación, sino un prorrateo, y que desde julio su ciclo será el día 01 de cada mes?**`
        ]
      },
      {
        id: 4,
        title: 'Portal de Pago',
        instructions: 'Explica lo que se visualizará en el portal oficial y los links enviados.',
        text: [
          `— Señor / señora **${clientFullName}**, ahora le explico cómo podrá validar esta información en el portal oficial.`,
          `— En este momento, hemos enviado a su número **${clientPhone}**, vía WhatsApp, y a su correo **${clientEmail}**, un enlace de acceso al portal de pago de **Sisprot Global Fiber**.`,
          `— En el portal podrá consultar: Factura generada, Fecha de vencimiento, Monto exacto a pagar, Tasa BCV aplicada, Contrato actualizado, Enlaces oficiales de interés.`,
          `— En el portal verá reflejada:`,
          `  1. **Factura prorrateada de junio:** por el período del 15 al 30 de junio (pagar hasta el 15 de junio).`,
          `  2. **Factura de julio:** por el mes completo de julio (pagar entre el 01 y 02 de julio).`,
          `— **¿Hasta aquí queda clara la información que verá reflejada en el portal?**`
        ]
      },
      {
        id: 5,
        title: 'SLA y Contrato',
        instructions: 'Detalla el nuevo SLA oficial y la firma digital del contrato actualizado.',
        text: [
          `— Ya para finalizar, también queremos informarle que en el portal encontrará la opción **SLA**, que significa **Nivel de Acuerdo de Servicio**, donde podrá consultar los tiempos de respuesta oficiales para soporte técnico y trámites administrativos.`,
          `— Adicionalmente, su contrato será actualizado y podrá visualizarlo de forma digital dentro del portal. Allí podrá leerlo con calma y firmarlo en línea como constancia de aceptación (debe firmarse desde su teléfono móvil o dispositivo táctil).`,
          `— Este proceso estará disponible hasta el **30 de julio**, y nuestro equipo le acompañará cada 15 días.`
        ]
      },
      {
        id: 6,
        title: 'Suspensión y Corte',
        instructions: 'Indica la política de no cobrar reconexión, pero exigir el pago completo en caso de suspensión.',
        text: [
          `— También es importante aclararle que, si el servicio llega a ser suspendido por falta de pago, **Sisprot Global Fiber no cobra reconexión**.`,
          `— Sin embargo, para activar nuevamente el servicio, deberá cancelar la mensualidad pendiente completa. El pago no será prorrateado por los días suspendidos, ya que el servicio se factura bajo modalidad mensual.`
        ]
      },
      {
        id: 7,
        title: 'Cierre y Asistente',
        instructions: 'Recapitula los 3 puntos clave, introduce a Susana y despide la llamada.',
        text: [
          `— Señor / señora **${clientFullName}**, esperamos que esta información le haya sido útil para comprender el nuevo proceso de facturación, tasa aplicable, fechas de pago y actualización de contrato.`,
          `— Le recordamos tres puntos principales:`,
          `  1. Su factura se fijará en bolívares con la **tasa BCV del día 01** de cada mes.`,
          `  2. En junio pagará solo el **prorrateo del 15 al 30 de junio**.`,
          `  3. Desde julio pasará al **ciclo único 01** (pago entre el 01 y 02 de cada mes).`,
          `— También queremos informarle que nuestra asistente virtual se llama **Susana** y está disponible dentro del portal las **24 horas del día, los 7 días de la semana**.`,
          `— El número anterior 0412-0261134 ya no se encuentra disponible. Todo soporte se realiza mediante **Susana** para registrar correctamente su ticket numerado y canalizar su solicitud.`,
          `— **¿Me confirma por favor si la información principal quedó clara?**`,
          `— Agradecemos mucho su atención, comprensión y confianza en Sisprot Global Fiber. ¡Que tenga un excelente día!`
        ]
      }
    ];
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();
    const matched = clientes.find(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
      c.telefono.includes(q) ||
      (c.cedula && c.cedula.toLowerCase().includes(q)) ||
      (c.nro_contrato && c.nro_contrato.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
    if (matched) {
      setSelectedCliente(matched);
    } else {
      showNotification('error', 'No se encontró ningún cliente.');
    }
  };

  const myClientes = operatorName ? clientes.filter(c => c.operador === operatorName) : clientes;

  const clientesFiltrados = myClientes.filter(c => {
    if (c.resultado_primer_contacto === 'Agendado para visita informativa') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
      if (
        !fullName.includes(q) &&
        !c.telefono.includes(q) &&
        !(c.cedula && c.cedula.toLowerCase().includes(q)) &&
        !(c.nro_contrato && c.nro_contrato.toLowerCase().includes(q)) &&
        !(c.email && c.email.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const totalItems = clientesFiltrados.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const sortedClientesFiltrados = [...clientesFiltrados].sort((a, b) => {
    // 1. Informado: false first, true last
    if (a.informado !== b.informado) {
      return a.informado ? 1 : -1;
    }
    // 2. Primer contacto: nulls first (never called), then oldest called, recently called last
    if (!a.primer_contacto && b.primer_contacto) return -1;
    if (a.primer_contacto && !b.primer_contacto) return 1;
    if (a.primer_contacto && b.primer_contacto) {
      return new Date(a.primer_contacto).getTime() - new Date(b.primer_contacto).getTime();
    }
    // 3. Fallback to ID comparison
    return a.id.localeCompare(b.id);
  });

  const paginatedClientes = sortedClientesFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalInformados = myClientes.filter(c => c.informado).length;
  const totalPendientes = myClientes.filter(c => !c.informado).length;

  // Meta Diaria (30 llamadas/contactos por día)
  const metaDiaria = 30;
  const todayStr = new Date().toISOString().split('T')[0];
  const atendidosHoy = myClientes.filter(c => {
    if (!c.primer_contacto) return false;
    const contactDate = c.primer_contacto.split('T')[0] || '';
    return contactDate === todayStr;
  }).length;
  const porcentajeMeta = Math.min(100, Math.round((atendidosHoy / metaDiaria) * 100));

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
        {operatorName && (
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: List & Filters */}
            <div className="lg:col-span-8 space-y-4">

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
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Client Panel */}
            <div className="lg:col-span-4">
              {!selectedCliente ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3 shadow-xl h-full flex flex-col items-center justify-center">
                  <div className="h-14 w-14 rounded-2xl bg-secondary/40 flex items-center justify-center">
                    <Users className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">Selecciona un cliente<br />de la lista para gestionar la llamada.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl shadow-xl space-y-0 animate-fade-in overflow-hidden">

                  {/* Panel Header */}
                  <div className="p-5 border-b border-border bg-gradient-to-br from-[#0a1628] to-[#0d1f3c]">
                    <div className="flex justify-between items-start">
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
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="p-4 space-y-2 border-b border-border bg-secondary/10">
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {/* Contact row */}
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

                    {/* Plan + Financial */}
                    {/* Plan + Financial Details Grid */}
                    <div className="bg-[#0e1726]/50 border border-[#1e2d4a] rounded-xl p-3 grid grid-cols-2 gap-3 mt-2">
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

                    {/* Created by */}
                    {selectedCliente.created_by && (
                      <div className="text-[9px] text-muted-foreground">
                        Registrado por <span className="font-semibold text-foreground/60">{selectedCliente.created_by}</span>
                        {selectedCliente.created_at && (
                          <span> · {new Date(selectedCliente.created_at).toLocaleDateString('es-ES')}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Call Answer Guard */}
                  <div className="p-4 space-y-4">
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
                      <div className="space-y-4 animate-fade-in">

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
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between text-xs animate-fade-in">
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

                        {/* Form */}
                        <form onSubmit={handleSaveDetails} className="space-y-3">

                          {/* Informado toggle */}
                          <button
                            type="button"
                            onClick={() => setInformadoVal(!informadoVal)}
                            className={`w-full flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                              informadoVal
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                                : 'bg-secondary/40 border-border text-gray-400 hover:border-gray-500'
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
              )}
            </div>
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
                          triggerWebhookPortalPago(selectedCliente.nro_contrato || selectedCliente.id);
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
                                onClick={async () => {
                                  if (!reagendarDate) {
                                    showNotification('error', 'Por favor selecciona fecha y hora.');
                                    return;
                                  }
                                  setActionLoading(true);
                                  const updatedData = {
                                    resultado_primer_contacto: 'Reagendado desde speech (no disponible)',
                                    reagendar_fecha: new Date(reagendarDate).toISOString(),
                                    requiere_ticket_glpi: false,
                                    ticket_glpi_detalles: null,
                                    informado: false,
                                    primer_contacto: selectedCliente.primer_contacto || new Date().toISOString(),
                                    intentos_fallidos: selectedCliente.intentos_fallidos || 0,
                                    duracion_segundos: selectedCliente.duracion_segundos || null
                                  };
                                  try {
                                    const res = await fetch('/api/clientes', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: selectedCliente.id, cedula: selectedCliente.cedula, ...updatedData })
                                    });
                                    if (!res.ok) throw new Error('API error');
                                    showNotification('success', 'Llamada reagendada con éxito.');
                                    const updatedList = clientes.map(c => c.id === selectedCliente.id ? { ...c, ...updatedData } : c);
                                    setClientes(updatedList);
                                    setSelectedCliente({ ...selectedCliente, ...updatedData });
                                    localStorage.setItem('clientes_editados', JSON.stringify(updatedList));
                                    setShowSpeechModal(false);
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('success', 'Reagenda guardada localmente.');
                                  } finally {
                                    setActionLoading(false);
                                  }
                                }}
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
                                onClick={async () => {
                                  if (!reagendarDate) {
                                    showNotification('error', 'Por favor selecciona fecha y hora para la visita.');
                                    return;
                                  }
                                  setActionLoading(true);
                                  const updatedData = {
                                    resultado_primer_contacto: `Visita a la oficina programada (Etapa ${activeSpeechStage + 1})`,
                                    reagendar_fecha: new Date(reagendarDate).toISOString(),
                                    requiere_ticket_glpi: false,
                                    ticket_glpi_detalles: null,
                                    informado: false,
                                    primer_contacto: selectedCliente.primer_contacto || new Date().toISOString(),
                                    intentos_fallidos: selectedCliente.intentos_fallidos || 0,
                                    duracion_segundos: selectedCliente.duracion_segundos || null
                                  };
                                  try {
                                    const res = await fetch('/api/clientes', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: selectedCliente.id, cedula: selectedCliente.cedula, ...updatedData })
                                    });
                                    if (!res.ok) throw new Error('API error');
                                    showNotification('success', 'Visita a la oficina agendada con éxito.');
                                    const updatedList = clientes.map(c => c.id === selectedCliente.id ? { ...c, ...updatedData } : c);
                                    setClientes(updatedList);
                                    setSelectedCliente({ ...selectedCliente, ...updatedData });
                                    localStorage.setItem('clientes_editados', JSON.stringify(updatedList));
                                    setShowSpeechModal(false);
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('success', 'Visita guardada localmente.');
                                  } finally {
                                    setActionLoading(false);
                                  }
                                }}
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
                        triggerWebhookPortalPago(selectedCliente.nro_contrato || selectedCliente.id);
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
                    onClick={async () => {
                      setActionLoading(true);
                      const updatedData = {
                        resultado_primer_contacto: 'Informado con éxito desde speech completo',
                        reagendar_fecha: null,
                        requiere_ticket_glpi: false,
                        ticket_glpi_detalles: null,
                        informado: true,
                        primer_contacto: selectedCliente.primer_contacto || new Date().toISOString(),
                        intentos_fallidos: selectedCliente.intentos_fallidos || 0,
                        duracion_segundos: duracionLlamada !== null ? duracionLlamada : (selectedCliente.duracion_segundos || null)
                      };
                      try {
                        const res = await fetch('/api/clientes', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: selectedCliente.id, cedula: selectedCliente.cedula, ...updatedData })
                        });
                        if (!res.ok) throw new Error('API error');
                        showNotification('success', 'Cliente informado con éxito.');
                        const updatedList = clientes.map(c => c.id === selectedCliente.id ? { ...c, ...updatedData } : c);
                        setClientes(updatedList);
                        setSelectedCliente({ ...selectedCliente, ...updatedData });
                        setShowSpeechModal(false);
                      } catch (err) {
                        console.error(err);
                        showNotification('error', 'Error al guardar la información en Supabase.');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
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
    </main>
  );
}
