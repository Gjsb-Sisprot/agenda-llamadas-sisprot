import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ClienteLlamadaRow {
  id: string;
  nombre?: string;
  apellido?: string;
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
  ciclo?: number | null;
  operador?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

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

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Operadores table
    const operadoresTable = OPERADORES.map((op, idx) => ({
      id_operador: `op_${idx + 1}`,
      nombre_completo: op,
      rol: "Operador"
    }));

    // 2. Clientes table
    const clientesTable = mappedClientes.map(c => {
      let statusMigracion = "Pendiente";
      if (c.resultado_primer_contacto === 'Agendado para visita informativa') {
        statusMigracion = "Visita Informativa";
      } else if (c.informado) {
        statusMigracion = "Informado";
      }

      const fullName = [c.nombre, c.apellido].filter(Boolean).join(' ').trim() || `Contrato ${c.id}`;

      return {
        id_cliente: c.id,
        nombre: fullName,
        ciclo_actual: c.ciclo || 15,
        status_migracion: statusMigracion
      };
    });

    // 3. Metas_Diarias table
    const metasTable = OPERADORES.map((op, idx) => ({
      id_meta: `meta_${idx + 1}_${todayStr}`,
      id_operador: `op_${idx + 1}`,
      fecha: todayStr,
      cantidad_asignada: 30
    }));

    // 4. Registro_Llamadas table
    const llamadasTable = mappedClientes
      .filter(c => c.primer_contacto || (c.intentos_fallidos && c.intentos_fallidos > 0) || c.resultado_primer_contacto)
      .map(c => {
        const opIndex = OPERADORES.indexOf(c.operador || "");
        const id_operador = opIndex > -1 ? `op_${opIndex + 1}` : "op_unknown";

        return {
          id_llamada: `call_${c.id}`,
          id_operador: id_operador,
          id_cliente: c.id,
          fecha_hora: c.primer_contacto || c.updated_at || new Date().toISOString(),
          fue_contacto_efectivo: c.informado ?? false,
          observaciones: c.resultado_primer_contacto || "Sin observaciones"
        };
      });

    // Route response based on query parameter
    if (table === 'operadores') {
      return NextResponse.json(operadoresTable);
    } else if (table === 'clientes') {
      return NextResponse.json(clientesTable);
    } else if (table === 'metas') {
      return NextResponse.json(metasTable);
    } else if (table === 'llamadas') {
      return NextResponse.json(llamadasTable);
    }

    // Default returns all tables in a single payload
    return NextResponse.json({
      operadores: operadoresTable,
      clientes: clientesTable,
      metas_diarias: metasTable,
      registro_llamadas: llamadasTable
    });

  } catch (error: unknown) {
    console.error('Error generating relational Power BI API:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
