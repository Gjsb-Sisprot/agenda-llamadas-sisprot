import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface CallLog {
  id: string;
  cedula?: string | null;
  informado: boolean;
  primer_contacto: string;
  resultado_primer_contacto?: string | null;
  reagendar_fecha?: string | null;
  visita_oficina_fecha?: string | null;
  requiere_ticket_glpi: boolean;
  ticket_glpi_detalles?: string | null;
  updated_at?: string;
  duracion_segundos?: number | null;
  intentos_fallidos?: number | null;
}

interface BankAssociated {
  id?: number;
  nro_cta?: string;
  rlf?: string;
  bank_name?: string;
  bank_code?: string;
  identification?: string;
}


// Helper to save call log to Supabase
async function saveCallLog(log: CallLog): Promise<boolean> {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder';

  let savedInSupabase = false;

  const logPayload = {
    id: log.id.toString(),
    cedula: log.cedula || null,
    informado: log.informado ?? false,
    primer_contacto: log.primer_contacto || new Date().toISOString(),
    resultado_primer_contacto: log.resultado_primer_contacto || null,
    reagendar_fecha: log.reagendar_fecha || null,
    requiere_ticket_glpi: log.requiere_ticket_glpi ?? false,
    ticket_glpi_detalles: log.requiere_ticket_glpi ? log.ticket_glpi_detalles : null,
    duracion_segundos: log.duracion_segundos || null,
    intentos_fallidos: log.intentos_fallidos || 0,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('clientes_llamadas')
        .upsert(logPayload);

      if (error) {
        console.error('Error upserting to Supabase:', error);
      } else {
        savedInSupabase = true;
      }
    } catch (e) {
      console.error('Exception upserting to Supabase:', e);
    }
  }

  return savedInSupabase;
}

export async function GET() {
  try {
    // Supabase caps results at 1000 rows per request.
    // We paginate in chunks of 1000 until we get everything.
    const PAGE_SIZE = 1000;
    let allClientes: Record<string, unknown>[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('clientes_llamadas')
        .select('*')
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allClientes = allClientes.concat(data);
        from += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE; // si devolvió menos de PAGE_SIZE, ya no hay más
      } else {
        hasMore = false;
      }
    }

    // Sort by ID to ensure stable assignment
    allClientes.sort((a, b) => {
      const idA = String(a.id || '');
      const idB = String(b.id || '');
      return idA.localeCompare(idB);
    });

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
      "Thais Bejas" // Thais Bejas is 14th (index 13), so she gets the remainder
    ];

    const N = allClientes.length;
    const K = Math.ceil(N / 14);

    const mappedClientes = allClientes.map((cliente, index) => {
      let operadorIndex = Math.floor(index / K);
      if (operadorIndex >= 13) {
        operadorIndex = 13; // Thais Bejas gets the rest
      }
      return {
        ...cliente,
        operador: OPERADORES[operadorIndex]
      };
    });

    return NextResponse.json(mappedClientes);
  } catch (error: unknown) {
    console.error('Error fetching clients in API Route:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, informado, primer_contacto, resultado_primer_contacto, reagendar_fecha, visita_oficina_fecha, requiere_ticket_glpi, ticket_glpi_detalles, cedula, duracion_segundos, intentos_fallidos } = body;

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const logToSave: CallLog = {
      id: id.toString(),
      cedula: cedula || null,
      informado: informado ?? false,
      primer_contacto: primer_contacto || new Date().toISOString(),
      resultado_primer_contacto: resultado_primer_contacto || null,
      reagendar_fecha: reagendar_fecha || null,
      visita_oficina_fecha: visita_oficina_fecha || null,
      requiere_ticket_glpi: requiere_ticket_glpi ?? false,
      ticket_glpi_detalles: requiere_ticket_glpi ? ticket_glpi_detalles : null,
      duracion_segundos: duracion_segundos || null,
      intentos_fallidos: intentos_fallidos || 0
    };

    const savedInSupabase = await saveCallLog(logToSave);

    return NextResponse.json({ success: true, savedInSupabase, log: logToSave });
  } catch (error: unknown) {
    console.error('Error saving call log in API Route:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
