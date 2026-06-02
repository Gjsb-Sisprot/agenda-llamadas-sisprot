import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callLogSchema } from '@/lib/validations';

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

    // Sort by ID
    allClientes.sort((a, b) => {
      const idA = String(a.id || '');
      const idB = String(b.id || '');
      return idA.localeCompare(idB);
    });

    return NextResponse.json(allClientes);
  } catch (error: unknown) {
    console.error('Error fetching clients in API Route:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Strict validation using Zod
    const result = callLogSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const validatedData = result.data;

    const logToSave: CallLog = {
      id: validatedData.id,
      cedula: validatedData.cedula || null,
      informado: validatedData.informado,
      primer_contacto: validatedData.primer_contacto || new Date().toISOString(),
      resultado_primer_contacto: validatedData.resultado_primer_contacto || null,
      reagendar_fecha: validatedData.reagendar_fecha || null,
      visita_oficina_fecha: validatedData.visita_oficina_fecha || null,
      requiere_ticket_glpi: validatedData.requiere_ticket_glpi,
      ticket_glpi_detalles: validatedData.requiere_ticket_glpi ? validatedData.ticket_glpi_detalles : null,
      duracion_segundos: validatedData.duracion_segundos || null,
      intentos_fallidos: validatedData.intentos_fallidos || 0
    };

    const savedInSupabase = await saveCallLog(logToSave);

    return NextResponse.json({ success: true, savedInSupabase, log: logToSave });
  } catch (error: unknown) {
    console.error('Error saving call log in API Route:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
