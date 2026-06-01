import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ClienteLlamadaRow {
  id: string;
  cedula?: string | null;
  informado: boolean;
  primer_contacto?: string | null;
  resultado_primer_contacto?: string | null;
  reagendar_fecha?: string | null;
  requiere_ticket_glpi: boolean;
  ticket_glpi_detalles?: string | null;
  duracion_segundos?: number | null;
  intentos_fallidos?: number | null;
  updated_at?: string;
  operador?: string;
}

export async function GET() {
  try {
    const PAGE_SIZE = 1000;
    let allClientes: ClienteLlamadaRow[] = [];
    let from = 0;
    let hasMore = true;

    // Fetch all records from Supabase
    while (hasMore) {
      const { data, error } = await supabase
        .from('clientes_llamadas')
        .select('*')
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allClientes = allClientes.concat(data as ClienteLlamadaRow[]);
        from += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    // Sort to ensure stable assignment matching frontend operator assignment
    allClientes.sort((a, b) => {
      const idA = String(a.id || '');
      const idB = String(b.id || '');
      return idA.localeCompare(idB);
    });

    // Operator mapping matching main route.ts logic
    const OPERADORES = [
      "Georgina Baladi",
      "Khaloa Serrano",
      "Derwing Acevedo",
      "Luis Hidalgo",
      "Sandy Rodriguez",
      "Yhosselyn Perez",
      "Yetzareth Bravo",
      "Paola Guanipa",
      "Guillermo Sanchez",
      "Levi Oliveros",
      "Barbara Rodriguez",
      "Milagros Teran",
      "Jannerys Pirela",
      "Thais Bejas"
    ];

    const N = allClientes.length;
    const K = Math.ceil(N / 14);

    const mappedClientes = allClientes.map((cliente, index) => {
      let operadorIndex = Math.floor(index / K);
      if (operadorIndex >= 13) {
        operadorIndex = 13;
      }
      return {
        ...cliente,
        operador: OPERADORES[operadorIndex]
      };
    });

    // 1. General Metrics
    const totalAgenda = mappedClientes.length;
    
    // Visitas Informativas (clients with resultado_primer_contacto === 'Agendado para visita informativa')
    const visitasInformativas = mappedClientes.filter(
      c => c.resultado_primer_contacto === 'Agendado para visita informativa'
    ).length;

    // Active queue (excluding those scheduled for informative visits)
    const activeClientes = mappedClientes.filter(
      c => c.resultado_primer_contacto !== 'Agendado para visita informativa'
    );
    const totalActivos = activeClientes.length;
    const contactados = activeClientes.filter(c => c.informado).length;
    const noContactados = totalActivos - contactados;
    const tasaContactabilidad = totalActivos > 0 ? Math.round((contactados / totalActivos) * 100) : 0;

    // Call attempts and duration
    let intentosTotales = 0;
    let sumaDuracion = 0;
    let llamadasConDuracion = 0;

    mappedClientes.forEach(c => {
      // attempts count
      intentosTotales += (c.intentos_fallidos || 0) + (c.informado ? 1 : 0);
      if (c.duracion_segundos != null && c.duracion_segundos > 0) {
        sumaDuracion += c.duracion_segundos;
        llamadasConDuracion++;
      }
    });

    const duracionPromedioSegundos = llamadasConDuracion > 0 ? Math.round(sumaDuracion / llamadasConDuracion) : 0;
    const requiereTicketGlpi = mappedClientes.filter(c => c.requiere_ticket_glpi).length;

    // 2. Metrics by Operator
    const breakdownOperadores = OPERADORES.map(op => {
      const opClientes = mappedClientes.filter(c => c.operador === op);
      const opVisitas = opClientes.filter(
        c => c.resultado_primer_contacto === 'Agendado para visita informativa'
      ).length;
      const opActivos = opClientes.filter(
        c => c.resultado_primer_contacto !== 'Agendado para visita informativa'
      );
      
      const opTotalActivos = opActivos.length;
      const opContactados = opActivos.filter(c => c.informado).length;
      const opNoContactados = opTotalActivos - opContactados;
      const opTasa = opTotalActivos > 0 ? Math.round((opContactados / opTotalActivos) * 100) : 0;

      return {
        operador: op,
        total_asignados: opClientes.length,
        activos: opTotalActivos,
        contactados: opContactados,
        no_contactados: opNoContactados,
        visitas_informativas: opVisitas,
        tasa_contactabilidad_porcentaje: opTasa
      };
    });

    // 3. Compile output structure
    const responseData = {
      timestamp: new Date().toISOString(),
      resumen_general: {
        total_agenda_historico: totalAgenda,
        total_clientes_activos: totalActivos,
        clientes_contactados_exito: contactados,
        clientes_no_contactados_pendientes: noContactados,
        agendados_visitas_informativas: visitasInformativas,
        tasa_contactabilidad_general_porcentaje: tasaContactabilidad,
        intentos_llamadas_totales: intentosTotales,
        llamadas_exitosas_con_duracion: llamadasConDuracion,
        duracion_promedio_segundos: duracionPromedioSegundos,
        requiere_ticket_glpi: requiereTicketGlpi
      },
      desglose_operadores: breakdownOperadores
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('Error generating metrics API:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
