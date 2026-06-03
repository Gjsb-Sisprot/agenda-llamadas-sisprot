import { useState, useEffect, useCallback } from 'react';

export interface ClienteLlamada {
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

const triggerWebhookPortalPago = async (contrato: string) => {
  if (!contrato) return;
  try {
    await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'portal_pago', contrato }),
    });
  } catch (err) {
    console.error('Failed to trigger portal pago webhook:', err);
  }
};

interface N8nTicketResponse {
  id: number;
  message: string;
}

const triggerWebhookNoContesto = async (contrato: string): Promise<N8nTicketResponse | null> => {
  if (!contrato) return null;
  try {
    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'no_contesto', contrato }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data[0]) {
        return data.data[0];
      }
    }
  } catch (err) {
    console.error('Failed to trigger no contesto webhook:', err);
  }
  return null;
};

export function useClientes() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteLlamada[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteLlamada | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // WhatsApp States
  const [whatsappMsg, setWhatsappMsg] = useState('');
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Speech modal
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [activeSpeechStage, setActiveSpeechStage] = useState(0);

  // Resumen modal
  const [showResumenModal, setShowResumenModal] = useState(false);
  const [resumenData, setResumenData] = useState<{ clienteNombre: string; duracion: number | null; notas: string } | null>(null);
  // BCV Tasa del Día (global config, only editable by Elisaul)
  const [bcvTasa, setBcvTasaState] = useState<number>(0);

  // Alerta de 1 minuto restante en la llamada
  const [alertaUnMinuto, setAlertaUnMinuto] = useState(false);

  const setBcvTasa = useCallback(async (tasa: number) => {
    setBcvTasaState(tasa);
    try {
      const res = await fetch('/api/tasa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasa }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Failed to save rate');
      }
      showNotification('success', 'Tasa BCV guardada en Supabase con éxito.');
    } catch (err: unknown) {
      console.error('Failed to save BCV rate:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      showNotification('error', `Error al guardar la tasa: ${msg}`);
    }
  }, []);

  // Ticket GLPI creado modal
  const [showTicketCreadoModal, setShowTicketCreadoModal] = useState(false);
  const [ticketCreadoData, setTicketCreadoData] = useState<{ ticketId: string; concepto: string; clienteNombre: string } | null>(null);
  const [pendingNextCliente, setPendingNextCliente] = useState<typeof clientes[0] | null>(null);

  useEffect(() => {

    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          if (next === 240) {
            setAlertaUnMinuto(true);
            setTimeout(() => setAlertaUnMinuto(false), 8000);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOperatorName(localStorage.getItem('user_name'));
    }

    async function loadTasa() {
      try {
        const res = await fetch('/api/tasa');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.tasa === 'number') {
            setBcvTasaState(data.tasa);
          }
        }
      } catch (err) {
        console.error('Failed to load BCV rate:', err);
      }
    }
    loadTasa();
  }, []);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, operatorName]);

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
    setWhatsappMsg('');
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



  const handleFinalizarLlamada = () => {
    setTimerActive(false);
    setDuracionLlamada(secondsElapsed);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSaveDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      intentos_fallidos: selectedCliente.intentos_fallidos || 0,
    };

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCliente.id, cedula: selectedCliente.cedula, ...updatedData }),
      });
      if (!res.ok) throw new Error('API response not ok');
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);
      
      showNotification('success', 'Información guardada con éxito.');
      const updatedList = clientes.map((c) => (c.id === selectedCliente.id ? { ...c, ...updatedData } : c));
      setClientes(updatedList);
      setSelectedCliente({ ...selectedCliente, ...updatedData });
      setTimerActive(false);

      if (informadoVal) {
        setResumenData({
          clienteNombre: `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`.trim(),
          duracion: updatedData.duracion_segundos,
          notas: updatedData.resultado_primer_contacto || 'Sin notas adicionales.'
        });
        setShowResumenModal(true);
      }

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

    let n8nResponse = null;
    if (isVisitaInformativa) {
      n8nResponse = await triggerWebhookNoContesto(selectedCliente.id);
    }

    const updatedData = {
      resultado_primer_contacto: isVisitaInformativa ? 'Agendado para visita informativa' : 'Llamada no contestada',
      reagendar_fecha: null,
      requiere_ticket_glpi: isVisitaInformativa,
      ticket_glpi_detalles: n8nResponse ? `TICKET_ID: ${n8nResponse.id} | MESSAGE: ${n8nResponse.message}` : null,
      informado: false,
      primer_contacto: new Date().toISOString(),
      intentos_fallidos: newIntentos,
      duracion_segundos: selectedCliente.duracion_segundos || null,
    };

    const currentIndex = clientesFiltrados.findIndex((c) => c.id === selectedCliente.id);
    const nextCliente = clientesFiltrados[currentIndex + 1] || clientesFiltrados[0] || null;

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCliente.id, cedula: selectedCliente.cedula, ...updatedData }),
      });
      if (!res.ok) throw new Error('API response not ok');
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);

      showNotification('success', isVisitaInformativa ? 'Registrado: Agendado para visita informativa.' : 'Registrado: No contestó.');
      const updatedList = clientes.map((c) => (c.id === selectedCliente.id ? { ...c, ...updatedData } : c));
      setClientes(updatedList);

      if (isVisitaInformativa) {
        // Store next client, show ticket modal first
        setPendingNextCliente(nextCliente);
        const ticketId = n8nResponse ? String(n8nResponse.id) : 'N/A';
        const concepto = n8nResponse
          ? n8nResponse.message
          : `Visita informativa por no contacto telefónico – Contrato ${selectedCliente.nro_contrato || 'N/A'} - ${selectedCliente.nombre} ${selectedCliente.apellido || ''}`;
        setTicketCreadoData({
          ticketId,
          concepto,
          clienteNombre: `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`.trim()
        });
        setShowTicketCreadoModal(true);
      } else {
        if (nextCliente && nextCliente.id !== selectedCliente.id) {
          setSelectedCliente(nextCliente);
        } else {
          setSelectedCliente(null);
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
      showNotification('error', 'Error al guardar el intento de llamada.');
    } finally {
      setTimerActive(false);
      setActionLoading(false);
    }
  };

  const handleSendWhatsApp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCliente || !whatsappMsg.trim()) return;
    setWhatsappLoading(true);

    try {
      // 1. Verify WhatsApp number
      const checkRes = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', number: selectedCliente.telefono }),
      });

      if (!checkRes.ok) throw new Error('Error al verificar el número en WhatsApp.');
      const checkData = await checkRes.json();

      if (!checkData.success || !checkData.exists) {
        showNotification('error', 'El número de teléfono no cuenta con WhatsApp activo.');
        setWhatsappLoading(false);
        return;
      }

      // 2. Send message
      const sendRes = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', number: selectedCliente.telefono, text: whatsappMsg }),
      });

      if (!sendRes.ok) throw new Error('Error al enviar el mensaje de WhatsApp.');
      const sendData = await sendRes.json();

      if (sendData.success) {
        showNotification('success', 'Mensaje de WhatsApp enviado con éxito.');
        setWhatsappMsg('');
      } else {
        showNotification('error', sendData.error || 'No se pudo enviar el mensaje.');
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Error en la conexión con WhatsApp.';
      showNotification('error', message);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();
    const matched = clientes.find(
      (c) =>
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

  const getSpeechStages = (cliente: ClienteLlamada) => {
    const operName = operatorName || 'el operador';
    const clientFullName = cliente.apellido ? `${cliente.nombre} ${cliente.apellido}` : cliente.nombre;
    const planName = cliente.plan_contratado;
    const planCost = `$${cliente.costo_plan.toFixed(2)}`;
    const planCostHalf = `$${(cliente.costo_plan / 2).toFixed(2)}`;
    const planCostHalfNum = cliente.costo_plan / 2;
    const costBsHalf = bcvTasa > 0
      ? `Bs ${(planCostHalfNum * bcvTasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : (cliente.deuda_bs ? `Bs ${cliente.deuda_bs.toFixed(2)}` : 'Bs —');
    const costBs = cliente.deuda_bs ? `Bs ${cliente.deuda_bs.toFixed(2)}` : 'Bs —';
    const clientPhone = cliente.telefono;
    const clientEmail = cliente.email || 'su correo registrado';
    const tasaTexto = bcvTasa > 0
      ? `Bs ${bcvTasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por dólar`
      : 'la tasa BCV del día';

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
          `— **Ejemplo:** Su plan tiene un costo de **${planCost}**. Para junio pagará **${planCostHalf}**, calculado a **${tasaTexto}**, cuyo equivalente en bolívares es aproximadamente **${costBsHalf}**.`,
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

  // Filter computations
  const myClientes = operatorName && operatorName !== 'Elisaul Reyes'
    ? clientes.filter((c) => c.operador === operatorName)
    : clientes;

  const clientesFiltrados = myClientes.filter((c) => {
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
      )
        return false;
    }
    return true;
  });

  const totalItems = clientesFiltrados.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const sortedClientesFiltrados = [...clientesFiltrados].sort((a, b) => {
    if (a.informado !== b.informado) {
      return a.informado ? 1 : -1;
    }
    if (!a.primer_contacto && b.primer_contacto) return -1;
    if (a.primer_contacto && !b.primer_contacto) return 1;
    if (a.primer_contacto && b.primer_contacto) {
      return new Date(a.primer_contacto).getTime() - new Date(b.primer_contacto).getTime();
    }
    return a.id.localeCompare(b.id);
  });

  const paginatedClientes = sortedClientesFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalInformados = myClientes.filter((c) => c.informado).length;
  const totalPendientes = myClientes.filter((c) => !c.informado).length;

  const handleReagendarSpeech = async (reagendarDateVal: string) => {
    if (!selectedCliente) return;
    if (!reagendarDateVal) {
      showNotification('error', 'Por favor selecciona fecha y hora.');
      return;
    }
    setActionLoading(true);
    const updatedData = {
      resultado_primer_contacto: 'Reagendado desde speech (no disponible)',
      reagendar_fecha: new Date(reagendarDateVal).toISOString(),
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
      setShowSpeechModal(false);
    } catch (err) {
      console.error(err);
      showNotification('success', 'Reagenda guardada localmente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAgendarVisitaSpeech = async (stageIndex: number, dateVal: string) => {
    if (!selectedCliente) return;
    if (!dateVal) {
      showNotification('error', 'Por favor selecciona fecha y hora para la visita.');
      return;
    }
    setActionLoading(true);
    const updatedData = {
      resultado_primer_contacto: `Visita a la oficina programada (Etapa ${stageIndex + 1})`,
      reagendar_fecha: new Date(dateVal).toISOString(),
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
      setShowSpeechModal(false);
    } catch (err) {
      console.error(err);
      showNotification('success', 'Visita guardada localmente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizarSpeech = async () => {
    if (!selectedCliente) return;
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

      setResumenData({
        clienteNombre: `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`.trim(),
        duracion: updatedData.duracion_segundos,
        notas: updatedData.resultado_primer_contacto || 'Informado con éxito desde speech completo'
      });
      setShowResumenModal(true);

    } catch (err) {
      console.error(err);
      showNotification('error', 'Error al guardar la información en Supabase.');
    } finally {
      setActionLoading(false);
    }
  };

  const metaDiaria = 30;
  const todayStr = new Date().toISOString().split('T')[0];
  const atendidosHoy = myClientes.filter((c) => {
    if (!c.primer_contacto) return false;
    const contactDate = c.primer_contacto.split('T')[0] || '';
    return contactDate === todayStr;
  }).length;
  const porcentajeMeta = Math.min(100, Math.round((atendidosHoy / metaDiaria) * 100));

  return {
    loading,
    clientes,
    setClientes,
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
    setDuracionLlamada,
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
    fetchClientes,
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
    setResumenData,
    bcvTasa,
    setBcvTasa,
    alertaUnMinuto,
    showTicketCreadoModal,
    setShowTicketCreadoModal,
    ticketCreadoData,
    pendingNextCliente,
    handleSiguienteTrasTi: () => {
      setShowTicketCreadoModal(false);
      setTicketCreadoData(null);
      if (pendingNextCliente && pendingNextCliente.id !== (selectedCliente?.id ?? '')) {
        setSelectedCliente(pendingNextCliente);
      } else {
        setSelectedCliente(null);
      }
      setPendingNextCliente(null);
    },

  };
}
