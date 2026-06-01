'use client';

import { useState, useEffect } from 'react';
import { 
  Search, MessageSquare, AlertCircle, Save, CheckCircle2, 
  Loader2, UserCheck, ArrowLeft, Phone, PhoneOff, Clock, Check, X,
  Mail
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
  duracion_segundos?: number | null;
  intentos_fallidos?: number | null;
}

export default function BuscarPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Loaded client state
  const [cliente, setCliente] = useState<ClienteLlamada | null>(null);

  // Guard: null = not answered yet, true = answered, false = did not answer
  const [contestoLlamada, setContestoLlamada] = useState<boolean | null>(null);

  // WhatsApp States
  const [whatsappMsg, setWhatsappMsg] = useState('');
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  // Form states for client log
  const [resultadoContacto, setResultadoContacto] = useState('');
  const [reagendarDate, setReagendarDate] = useState('');
  const [informadoVal, setInformadoVal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Stopwatch/timer state
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [duracionLlamada, setDuracionLlamada] = useState<number | null>(null);

  // Speech modal states
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [activeSpeechStage, setActiveSpeechStage] = useState(0);
  const [stageAnswers, setStageAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOperatorName(localStorage.getItem('user_name'));
    }
  }, []);

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

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    setLoading(true);
    setErrorMsg('');
    setCliente(null);
    setContestoLlamada(null);

    try {
      const res = await fetch('/api/clientes');
      if (!res.ok) throw new Error('API response not ok');
      const data = await res.json();
      if (data && data.error) throw new Error(data.error);
      
      let matched: ClienteLlamada | undefined = undefined;
      if (data) {
        matched = (data as ClienteLlamada[]).find(c => 
          (c.cedula && c.cedula.toLowerCase() === query) ||
          (c.nro_contrato && c.nro_contrato.toLowerCase() === query) ||
          `${c.nombre} ${c.apellido}`.toLowerCase().includes(query)
        );
      }

      if (!matched) {
        throw new Error('Cliente no encontrado');
      }

      loadClient(matched);

    } catch (err) {
      console.warn('CRM API proxy fetch failed or client not found, searching mock data.', err);
      
      const mockData: ClienteLlamada[] = [
        { id: '1', nombre: 'Juan', apellido: 'Pérez', cedula: 'V-12345678', nro_contrato: 'CTR-0001', telefono: '+584121234567', plan_contratado: 'Plan Fibra 100 Mbps', costo_plan: 20.00, ciclo_actual: 30, informado: false, primer_contacto: null, resultado_primer_contacto: null, reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null },
        { id: '2', nombre: 'María', apellido: 'Gómez', cedula: 'V-87654321', nro_contrato: 'CTR-0002', telefono: '+584149876543', plan_contratado: 'Plan Fibra 200 Mbps', costo_plan: 30.00, ciclo_actual: 30, informado: true, primer_contacto: '2026-05-29 09:30:00-04', resultado_primer_contacto: 'Se le informó la migración al ciclo 1. Está de acuerdo.', reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null },
        { id: '3', nombre: 'Carlos', apellido: 'Rodríguez', cedula: 'V-11112222', nro_contrato: 'CTR-0003', telefono: '+584161112233', plan_contratado: 'Plan Fibra 300 Mbps', costo_plan: 45.00, ciclo_actual: 30, informado: false, primer_contacto: '2026-05-29 14:15:00-04', resultado_primer_contacto: 'Llamada no contestada, buzón de voz.', reagendar_fecha: '2026-06-01T10:00', requiere_ticket_glpi: false, ticket_glpi_detalles: null },
        { id: '4', nombre: 'Ana', apellido: 'Martínez', cedula: 'V-33334444', nro_contrato: 'CTR-0004', telefono: '+584244445566', plan_contratado: 'Plan Fibra 500 Mbps', costo_plan: 60.00, ciclo_actual: 1, informado: true, primer_contacto: '2026-05-28 11:00:00-04', resultado_primer_contacto: 'Confirmada recepción de información.', reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null },
        { id: '5', nombre: 'Luis', apellido: 'Hernández', cedula: 'V-55556666', nro_contrato: 'CTR-0005', telefono: '+584125556677', plan_contratado: 'Plan Fibra 100 Mbps', costo_plan: 20.00, ciclo_actual: 30, informado: false, primer_contacto: '2026-05-28 15:45:00-04', resultado_primer_contacto: 'El cliente no reconoce el cambio de ciclo y exige soporte técnico por lentitud.', reagendar_fecha: null, requiere_ticket_glpi: true, ticket_glpi_detalles: 'GLPI-98432: Cliente se niega a migración y presenta fallas en router ONT.' },
        { id: '6', nombre: 'Sofía', apellido: 'Díaz', cedula: 'V-77778888', nro_contrato: 'CTR-0006', telefono: '+584147778899', plan_contratado: 'Plan Fibra 1 Gbps', costo_plan: 100.00, ciclo_actual: 30, informado: false, primer_contacto: null, resultado_primer_contacto: null, reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null },
        { id: '7', nombre: 'Pedro', apellido: 'Álvarez', cedula: 'V-99990000', nro_contrato: 'CTR-0007', telefono: '+584128889900', plan_contratado: 'Plan Fibra 200 Mbps', costo_plan: 30.00, ciclo_actual: 1, informado: false, primer_contacto: null, resultado_primer_contacto: null, reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null },
        { id: '8', nombre: 'Elena', apellido: 'Torres', cedula: 'V-22223333', nro_contrato: 'CTR-0008', telefono: '+584249990011', plan_contratado: 'Plan Fibra 300 Mbps', costo_plan: 45.00, ciclo_actual: 30, informado: true, primer_contacto: '2026-05-30 08:00:00-04', resultado_primer_contacto: 'Informada de la migración del ciclo 30 al 1.', reagendar_fecha: null, requiere_ticket_glpi: false, ticket_glpi_detalles: null }
      ];

      const savedEdits = localStorage.getItem('clientes_editados');
      let mergedData = mockData;
      if (savedEdits) {
        try {
          const parsed = JSON.parse(savedEdits) as ClienteLlamada[];
          mergedData = mockData.map(c => {
            const saved = parsed.find(p => p.id === c.id);
            return saved ? { ...c, ...saved } : c;
          });
        } catch {}
      }

      const matchedMock = mergedData.find(c => 
        (c.cedula && c.cedula.toLowerCase() === query) ||
        (c.nro_contrato && c.nro_contrato.toLowerCase() === query) ||
        `${c.nombre} ${c.apellido}`.toLowerCase().includes(query)
      );

      if (matchedMock) {
        loadClient(matchedMock);
      } else {
        setErrorMsg('Esta cédula o número de contrato no se encuentra registrado en el sistema de migración.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadClient = (clientItem: ClienteLlamada) => {
    setCliente(clientItem);
    setContestoLlamada(null); // Reset guard on each new search
    setResultadoContacto(clientItem.resultado_primer_contacto || '');
    setReagendarDate(clientItem.reagendar_fecha ? clientItem.reagendar_fecha.slice(0, 16) : '');
    setInformadoVal(clientItem.informado);
    setErrorMsg('');
    setSecondsElapsed(0);
    setTimerActive(false);
    setDuracionLlamada(null);
    setShowSpeechModal(false);
    setActiveSpeechStage(0);
    setStageAnswers({});
    setWhatsappMsg('');
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

  const handleNoContesto = async () => {
    if (!cliente) return;
    setActionLoading(true);

    const newIntentos = (cliente.intentos_fallidos || 0) + 1;
    const autoGLPI = newIntentos >= 3;

    const updatedData = {
      resultado_primer_contacto: autoGLPI 
        ? 'Llamada no contestada (Generado Ticket GLPI automático por 3 intentos fallidos)' 
        : 'Llamada no contestada',
      reagendar_fecha: null,
      requiere_ticket_glpi: autoGLPI,
      ticket_glpi_detalles: autoGLPI ? 'Soporte automático: Cliente no contestó tras 3 intentos de llamada.' : null,
      informado: false,
      primer_contacto: new Date().toISOString(),
      intentos_fallidos: newIntentos,
      duracion_segundos: cliente.duracion_segundos || null
    };

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cliente.id, cedula: cliente.cedula, ...updatedData })
      });

      if (!res.ok) throw new Error('API response not ok');
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);
      
      await triggerWebhookNoContesto(cliente.id);
    } catch (err) {
      console.warn('Save failed, writing to localStorage:', err);
    } finally {
      // Mirror locally regardless
      const savedEdits = localStorage.getItem('clientes_editados');
      let parsedList: ClienteLlamada[] = [];
      if (savedEdits) { try { parsedList = JSON.parse(savedEdits); } catch {} }
      const existingIdx = parsedList.findIndex(p => p.id === cliente.id);
      const newObj: ClienteLlamada = { ...cliente, ...updatedData };
      if (existingIdx > -1) { parsedList[existingIdx] = newObj; } else { parsedList.push(newObj); }
      localStorage.setItem('clientes_editados', JSON.stringify(parsedList));

      setActionLoading(false);
      setContestoLlamada(false);
      setTimerActive(false);
      showNotification('success', 'Registrado: No contestó. Cliente movido al final de la lista.');
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    setActionLoading(true);
    const primerContactoDate = cliente.primer_contacto || new Date().toISOString();

    const updatedData = {
      resultado_primer_contacto: resultadoContacto.trim() || null,
      reagendar_fecha: cliente.reagendar_fecha,
      requiere_ticket_glpi: cliente.requiere_ticket_glpi,
      ticket_glpi_detalles: cliente.ticket_glpi_detalles,
      informado: informadoVal,
      primer_contacto: primerContactoDate,
      duracion_segundos: duracionLlamada !== null ? duracionLlamada : (cliente.duracion_segundos || null),
      intentos_fallidos: cliente.intentos_fallidos || 0
    };

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cliente.id, cedula: cliente.cedula, ...updatedData })
      });

      if (!res.ok) throw new Error('API response not ok');
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);

      showNotification('success', 'Información guardada con éxito.');
      setCliente({ ...cliente, ...updatedData });
      setTimerActive(false);
    } catch (err) {
      console.error('Save to local JSON file failed, saving to localStorage:', err);
      const savedEdits = localStorage.getItem('clientes_editados');
      let parsedList: ClienteLlamada[] = [];
      if (savedEdits) { try { parsedList = JSON.parse(savedEdits); } catch {} }
      const existingIdx = parsedList.findIndex(p => p.id === cliente.id);
      const newObj: ClienteLlamada = { ...cliente, ...updatedData };
      if (existingIdx > -1) { parsedList[existingIdx] = newObj; } else { parsedList.push(newObj); }
      localStorage.setItem('clientes_editados', JSON.stringify(parsedList));
      setCliente(newObj);
      showNotification('success', 'Datos guardados localmente.');
      setTimerActive(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente || !whatsappMsg.trim()) return;
    setWhatsappLoading(true);

    try {
      // 1. Verify WhatsApp number
      const checkRes = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', number: cliente.telefono })
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
        body: JSON.stringify({ action: 'send', number: cliente.telefono, text: whatsappMsg })
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

  const getVisualCycle = (ciclo: number) => {
    return ciclo === 10 ? 15 : ciclo;
  };

  const getSpeechStages = (clienteItem: ClienteLlamada) => {
    const operName = operatorName || 'el operador';
    const clientFullName = clienteItem.apellido ? `${clienteItem.nombre} ${clienteItem.apellido}` : clienteItem.nombre;
    const planName = clienteItem.plan_contratado;
    const planCost = `$${clienteItem.costo_plan.toFixed(2)}`;
    const planCostHalf = `$${(clienteItem.costo_plan / 2).toFixed(2)}`;
    const costBs = clienteItem.deuda_bs ? `Bs ${clienteItem.deuda_bs.toFixed(2)}` : 'Bs —';
    const clientPhone = clienteItem.telefono;
    const clientEmail = clienteItem.email || 'su correo registrado';

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
          `— Actualmente usted tiene un plan de **${planName}**, por un costo mensual de **${planCost}**, y pertenece al **ciclo ${getVisualCycle(clienteItem.ciclo_actual || 0)}**.`,
          `— Bajo la modalidad anterior, su ciclo habitual vencía los días ${getVisualCycle(clienteItem.ciclo_actual || 0)}. Sin embargo, para dar cumplimiento a la adecuación indicada por CONATEL, todos los clientes serán migrados al **nuevo ciclo único 01**.`,
          `— Para este mes de junio, usted recibirá una notificación de cobro desde el **01 de junio**, con oportunidad de pago hasta el **15 de junio**.`,
          `— Esta factura no será una mensualidad completa ni un pago doble. Será un **prorrateo correspondiente a los días restantes del mes de junio**, desde el **${getVisualCycle(clienteItem.ciclo_actual || 0)} de junio hasta el 30 de junio**.`,
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
          `  1. **Factura prorrateada de junio:** por el período del ${getVisualCycle(clienteItem.ciclo_actual || 0)} al 30 de junio (pagar hasta el 15 de junio).`,
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
          `  2. En junio pagará solo el **prorrateo del ${getVisualCycle(clienteItem.ciclo_actual || 0)} al 30 de junio**.`,
          `  3. Desde julio pasará al **ciclo único 01** (pago entre el 01 y 02 de cada mes).`,
          `— También queremos informarle que nuestra asistente virtual se llama **Susana** y está disponible dentro del portal las **24 horas del día, los 7 días de la semana**.`,
          `— El número anterior 0412-0261134 ya no se encuentra disponible. Todo soporte se realiza mediante **Susana** para registrar correctamente su ticket numerado y canalizar su solicitud.`,
          `— **¿Me confirma por favor si la información principal quedó clara?**`,
          `— Agradecemos mucho su atención, comprensión y confianza en Sisprot Global Fiber. ¡Que tenga un excelente día!`
        ]
      }
    ];
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      
      {/* Back button when client is loaded */}
      {cliente && (
        <button
          onClick={() => { setCliente(null); setSearchQuery(''); setContestoLlamada(null); }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold uppercase transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la Búsqueda
        </button>
      )}

      {/* Header */}
      {!cliente ? (
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-secondary/30 text-[#60c0ea] mb-3">
            <UserCheck className="h-8 w-8 text-[#60c0ea]" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Búsqueda Rápida de Clientes</h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Ingresa la Cédula de Identidad o Número de Contrato del cliente para iniciar la llamada y gestionar su migración al ciclo 1.
          </p>
        </div>
      ) : (
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-foreground uppercase">
            {cliente.nombre} {cliente.apellido ? cliente.apellido : ''}
          </h1>
          <div className="flex justify-center gap-3 text-xs text-muted-foreground font-mono">
            {cliente.cedula && <span>C.I: {cliente.cedula}</span>}
            {cliente.nro_contrato && <span>Contrato: {cliente.nro_contrato}</span>}
            <span>Tlf: {cliente.telefono}</span>
          </div>
        </div>
      )}

      {/* Search Form */}
      {!cliente && (
        <form 
          onSubmit={handleSearch} 
          className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6 animate-slide-up"
        >
          <div className="space-y-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">
              Cédula de Identidad o Número de Contrato del Cliente
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={loading}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ingresa cédula o contrato (Ej. V-12345678 o CTR-0001)"
                className="w-full bg-secondary border border-border text-foreground text-lg font-mono rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#60c0ea] focus:ring-1 focus:ring-[#60c0ea] transition-all disabled:opacity-50"
              />
              <Search className="absolute left-4 top-4.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="w-full py-4 bg-[#004e74] hover:bg-[#60c0ea] text-white hover:text-[#002851] font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#004e74]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Buscando Cliente...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Buscar Cliente
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-200 rounded-xl flex items-start gap-3 text-left">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold block">Búsqueda Fallida</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Notification toast */}
      {notification && cliente && (
        <div className={`p-3.5 border font-semibold rounded-xl text-center text-xs ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {notification.message}
        </div>
      )}

      {/* === CALL ANSWER GUARD === */}
      {cliente && contestoLlamada === null && (
        <div className="bg-card border border-[#004e74]/40 rounded-2xl p-8 shadow-xl space-y-6 animate-slide-up text-center">
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#004e74]/20 border border-[#004e74]/30 mb-2">
              <Phone className="h-7 w-7 text-[#60c0ea]" />
            </div>
            <h2 className="text-base font-black text-foreground uppercase tracking-wider">¿El cliente contestó la llamada?</h2>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto">
              Debes confirmar si el cliente atendió antes de continuar con el registro de datos o el speech.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setContestoLlamada(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-4 rounded-xl transition-all text-sm uppercase shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Sí contestó
            </button>
            <button
              type="button"
              onClick={handleNoContesto}
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-xl transition-all text-sm uppercase shadow-md shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <PhoneOff className="h-4 w-4" />
              {actionLoading ? 'Registrando...' : 'No contestó'}
            </button>
          </div>
        </div>
      )}

      {/* === NO ANSWER CONFIRMATION === */}
      {cliente && contestoLlamada === false && (
        <div className="bg-card border border-red-500/20 rounded-2xl p-8 shadow-xl space-y-4 animate-slide-up text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 mb-2">
            <PhoneOff className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="text-base font-black text-red-400 uppercase tracking-wider">Llamada No Contestada</h2>
          <p className="text-muted-foreground text-xs max-w-sm mx-auto">
            Se registró el intento de contacto. <strong className="text-foreground">Cliente movido al final de la lista.</strong>
          </p>
          <button
            type="button"
            onClick={() => { setCliente(null); setSearchQuery(''); setContestoLlamada(null); }}
            className="mt-2 px-6 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold rounded-xl transition-all uppercase"
          >
            Buscar Otro Cliente
          </button>
        </div>
      )}

      {/* === ACTIVE CALL DETAIL (only if answered) === */}
      {cliente && contestoLlamada === true && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-slide-up text-left">

          {/* Left: Call Details (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6">
              
              {/* Header inside card */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="h-4.5 w-4.5 text-[#60c0ea]" /> Detalles del Cliente
                </h2>

                {/* Timer indicator */}
                {timerActive ? (
                  <div className="flex items-center gap-3 bg-[#004e74]/30 px-3 py-1 rounded-xl border border-[#60c0ea]/20 animate-pulse">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-mono text-xs font-black text-[#60c0ea]">{formatTime(secondsElapsed)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFinalizarLlamada();
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-0.5 px-2 rounded-lg text-[8px] uppercase tracking-wider transition-all"
                    >
                      Finalizar
                    </button>
                  </div>
                ) : duracionLlamada !== null ? (
                  <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-emerald-400">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span className="font-mono text-xs font-black">{formatTime(duracionLlamada)}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSecondsElapsed(0);
                      setTimerActive(true);
                    }}
                    className="text-[9px] bg-[#004e74]/30 border border-[#60c0ea]/30 text-[#60c0ea] hover:bg-[#60c0ea] hover:text-[#002851] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all"
                  >
                    Iniciar Cronómetro
                  </button>
                )}
              </div>

              {/* Client detailed lists */}
              <div className="space-y-4">
                
                {/* Tech Plan Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-secondary/20 p-4 rounded-xl border border-border/40">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Plan Contratado</span>
                    <span className="text-xs font-extrabold text-[#60c0ea] mt-0.5 block">{cliente.plan_contratado}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Costo del plan</span>
                    <span className="text-xs font-mono font-black text-foreground mt-0.5 block">${cliente.costo_plan.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Prorrateo</span>
                    <span className="text-xs font-mono font-black text-emerald-400 mt-0.5 block">${(cliente.costo_plan / 2).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Intentos de llamada</span>
                    <span className="text-xs font-mono font-black text-amber-400 mt-0.5 block">{cliente.intentos_fallidos || 0}</span>
                  </div>
                </div>

                {/* Billing Cycle visually showing Ciclo 15 when database has Ciclo 10 */}
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">Ciclo de Facturación (Origen)</span>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                      Migración tecnológica programada al nuevo **Ciclo 01**
                    </p>
                  </div>
                  <span className="bg-indigo-500/10 text-indigo-300 font-mono font-black border border-indigo-500/30 px-3 py-1 rounded-xl text-xs shrink-0">
                    Ciclo {getVisualCycle(cliente.ciclo_actual || 0)}
                  </span>
                </div>

                {/* Retention and Tags */}
                <div className="flex flex-wrap gap-2">
                  {cliente.retaining_client && (
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                      Cliente en Retención
                    </span>
                  )}
                  {cliente.contract_tag && (
                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                      Etiqueta: {cliente.contract_tag}
                    </span>
                  )}
                  {cliente.migrate && (
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                      Migración Activa
                    </span>
                  )}
                </div>

                {/* Direct Contacts list */}
                <div className="space-y-2 border-t border-border pt-4 text-xs font-medium text-foreground/90">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-[#60c0ea] shrink-0" />
                    <span>Teléfono Móvil: <strong className="text-foreground font-mono">{cliente.telefono}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 text-[#60c0ea] shrink-0" />
                    <span>Correo Electrónico: <strong className="text-foreground">{cliente.email || '—'}</strong></span>
                  </div>
                  {cliente.direccion && (
                    <div className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                      <AlertCircle className="h-4.5 w-4.5 text-[#60c0ea] shrink-0 mt-0.5" />
                      <span>Dirección: <strong className="text-foreground">{cliente.direccion}{cliente.sector ? `, ${cliente.sector}` : ''}{cliente.parroquia ? `, ${cliente.parroquia}` : ''}</strong></span>
                    </div>
                  )}
                </div>

              </div>

              {/* Action: Open Speech Modal Trigger */}
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    if (!timerActive && duracionLlamada === null) {
                      setSecondsElapsed(0);
                      setTimerActive(true);
                    }
                    setShowSpeechModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-[#004e74] to-[#122b51] hover:from-[#60c0ea] hover:to-[#004e74] text-white hover:text-[#002851] font-bold py-4 px-4 rounded-xl shadow-lg border border-[#60c0ea]/30 flex items-center justify-center gap-2.5 transition-all group uppercase tracking-wider text-xs"
                >
                  <MessageSquare className="h-5 w-5 group-hover:scale-115 transition-transform text-inherit" />
                  <span>Ver Speech de Llamada (7 Etapas)</span>
                </button>
              </div>

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

            </div>
          </div>

          {/* Right: Operations Form (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xl space-y-5">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
                Bitácora de Operación
              </h2>

              <form onSubmit={handleSaveDetails} className="space-y-4">
                
                {/* Informed toggle */}
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
                    <CheckCircle2 className="h-5 w-5 mb-1 text-inherit" />
                    <span className="text-[9px] uppercase tracking-wider block">¿Informado de la Migración?</span>
                    <span className="text-xs font-black block mt-0.5">{informadoVal ? 'SÍ' : 'NO'}</span>
                  </button>
                </div>

                {cliente.primer_contacto && (
                  <div className="bg-[#0e1726]/40 p-2.5 rounded-xl border border-[#1e2d4a] text-xs text-gray-300">
                    <span className="text-[9px] text-gray-500 block uppercase font-bold">Último Contacto</span>
                    <span>{new Date(cliente.primer_contacto).toLocaleString('es-ES')}</span>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                    Notas de Contacto
                  </label>
                  <textarea
                    rows={4}
                    value={resultadoContacto}
                    onChange={(e) => setResultadoContacto(e.target.value)}
                    placeholder="Bitácora de la llamada o visita..."
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-xs focus:outline-none focus:border-[#60c0ea] text-foreground placeholder-gray-500"
                  />
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-[#60c0ea] hover:bg-[#4eaad4] text-[#002851] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{actionLoading ? 'Guardando...' : 'Guardar Bitácora'}</span>
                </button>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Speech Modal */}
      {showSpeechModal && cliente && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSpeechModal(false)}
        >
          <div
            className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl animate-slide-up flex flex-col max-h-[90vh] overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-border bg-gradient-to-br from-[#0a1628] to-[#0d1f3c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#60c0ea] animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Libreto de Llamada Oficial</h3>
                  <p className="text-[10px] text-slate-300 font-semibold">Cliente: {cliente.nombre} {cliente.apellido ? cliente.apellido : ''}</p>
                </div>
              </div>

              {/* Stopwatch display inside modal */}
              {timerActive ? (
                <div className="flex items-center gap-3 bg-[#004e74]/40 px-3 py-1.5 rounded-xl border border-[#60c0ea]/20 animate-pulse">
                  <span className="font-mono text-xs font-black text-[#60c0ea] flex items-center gap-1">
                    <Clock className="h-4 w-4 text-[#60c0ea]" />
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
                const stages = getSpeechStages(cliente);
                return stages.map((stg, idx) => {
                  const isActive = activeSpeechStage === idx;
                  return (
                    <button
                      key={stg.id}
                      onClick={() => {
                        if (idx === 3 && activeSpeechStage === 2 && stageAnswers[2] === true) {
                          triggerWebhookPortalPago(cliente.id);
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
              const stages = getSpeechStages(cliente);
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
                                  if (!cliente) return;
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
                                    primer_contacto: cliente.primer_contacto || new Date().toISOString(),
                                    intentos_fallidos: cliente.intentos_fallidos || 0,
                                    duracion_segundos: cliente.duracion_segundos || null
                                  };
                                  try {
                                    const res = await fetch('/api/clientes', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: cliente.id, cedula: cliente.cedula, ...updatedData })
                                    });
                                    if (!res.ok) throw new Error('API error');
                                    showNotification('success', 'Llamada reagendada con éxito.');
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('success', 'Reagenda guardada localmente.');
                                  } finally {
                                    const savedEdits = localStorage.getItem('clientes_editados');
                                    let parsedList: ClienteLlamada[] = [];
                                    if (savedEdits) { try { parsedList = JSON.parse(savedEdits); } catch {} }
                                    const existingIdx = parsedList.findIndex(p => p.id === cliente.id);
                                    const newObj: ClienteLlamada = { ...cliente, ...updatedData };
                                    if (existingIdx > -1) { parsedList[existingIdx] = newObj; } else { parsedList.push(newObj); }
                                    localStorage.setItem('clientes_editados', JSON.stringify(parsedList));
                                    
                                    setCliente(newObj);
                                    setResultadoContacto(newObj.resultado_primer_contacto || '');
                                    setReagendarDate(newObj.reagendar_fecha ? newObj.reagendar_fecha.slice(0, 16) : '');
                                    
                                    setShowSpeechModal(false);
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
                                  if (!cliente) return;
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
                                    primer_contacto: cliente.primer_contacto || new Date().toISOString(),
                                    intentos_fallidos: cliente.intentos_fallidos || 0,
                                    duracion_segundos: cliente.duracion_segundos || null
                                  };
                                  try {
                                    const res = await fetch('/api/clientes', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: cliente.id, cedula: cliente.cedula, ...updatedData })
                                    });
                                    if (!res.ok) throw new Error('API error');
                                    showNotification('success', 'Visita a la oficina agendada con éxito.');
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('success', 'Visita guardada localmente.');
                                  } finally {
                                    const savedEdits = localStorage.getItem('clientes_editados');
                                    let parsedList: ClienteLlamada[] = [];
                                    if (savedEdits) { try { parsedList = JSON.parse(savedEdits); } catch {} }
                                    const existingIdx = parsedList.findIndex(p => p.id === cliente.id);
                                    const newObj: ClienteLlamada = { ...cliente, ...updatedData };
                                    if (existingIdx > -1) { parsedList[existingIdx] = newObj; } else { parsedList.push(newObj); }
                                    localStorage.setItem('clientes_editados', JSON.stringify(parsedList));
                                    
                                    setCliente(newObj);
                                    setResultadoContacto(newObj.resultado_primer_contacto || '');
                                    setReagendarDate(newObj.reagendar_fecha ? newObj.reagendar_fecha.slice(0, 16) : '');
                                    
                                    setShowSpeechModal(false);
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
                        triggerWebhookPortalPago(cliente.id);
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
                      if (!cliente) return;
                      setActionLoading(true);
                      const updatedData = {
                        resultado_primer_contacto: 'Informado con éxito desde speech completo',
                        reagendar_fecha: null,
                        requiere_ticket_glpi: false,
                        ticket_glpi_detalles: null,
                        informado: true,
                        primer_contacto: cliente.primer_contacto || new Date().toISOString(),
                        intentos_fallidos: cliente.intentos_fallidos || 0,
                        duracion_segundos: duracionLlamada !== null ? duracionLlamada : (cliente.duracion_segundos || null)
                      };
                      try {
                        const res = await fetch('/api/clientes', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: cliente.id, cedula: cliente.cedula, ...updatedData })
                        });
                        if (!res.ok) throw new Error('API error');
                        await triggerWebhookPortalPago(cliente.id);
                        showNotification('success', 'Cliente informado con éxito.');
                      } catch (err) {
                        console.error(err);
                        showNotification('success', 'Registro guardado localmente.');
                      } finally {
                        const savedEdits = localStorage.getItem('clientes_editados');
                        let parsedList: ClienteLlamada[] = [];
                        if (savedEdits) { try { parsedList = JSON.parse(savedEdits); } catch {} }
                        const existingIdx = parsedList.findIndex(p => p.id === cliente.id);
                        const newObj: ClienteLlamada = { ...cliente, ...updatedData };
                        if (existingIdx > -1) { parsedList[existingIdx] = newObj; } else { parsedList.push(newObj); }
                        localStorage.setItem('clientes_editados', JSON.stringify(parsedList));
                        
                        setCliente(newObj);
                        setResultadoContacto(newObj.resultado_primer_contacto || '');
                        setReagendarDate(newObj.reagendar_fecha ? newObj.reagendar_fecha.slice(0, 16) : '');
                        
                        setShowSpeechModal(false);
                        setActionLoading(false);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Finalizar y Registrar Éxito
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
