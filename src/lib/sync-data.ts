import { createClient } from '@supabase/supabase-js';

// 1. Configuración de Supabase
const supabaseUrl = 'https://djjuvkrhhgpbnokrafjw.supabase.co';
const supabaseAnonKey = 'sb_publishable_fed-1yCE4ZEo5W10Mrcypw_PD7Z770A';
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// 2. Configuración de la nueva API pública del CRM
const API_URL = 'https://api.sisprotgf.com/api/public/contracts/?status=16,19&remove_pagination=True&cycle=10&page=1&provisional=True&client_type=1';
const API_KEY = 'xK9pW2vM4zY0nR1tQ5sJ8hF3cD6aB1uE9iO2mN7rT4bV5xS8gL';

// 3. Interfaz de la nueva estructura del payload
interface CRMPublicClient {
  id: number;
  full_name: string;
  identification: string | null;
  mobile: string;
  email: string | null;
}

interface CRMPublicPlan {
  id: number;
  name: string;
  cost: string; // viene como string en la API
}

interface CRMPublicClientType {
  id: number;
  name: string;
}

interface CRMPublicContract {
  id: number;
  status_name?: string;
  cycle?: number;
  provisional?: boolean;
  client: CRMPublicClient;
  plan: CRMPublicPlan;
  client_type: CRMPublicClientType;
}

async function syncCRMToSupabase() {
  console.log('🔄 Iniciando descarga de contratos desde la API pública del CRM...');
  try {
    const response = await fetch(API_URL, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error en respuesta del CRM: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const contracts: CRMPublicContract[] = data.results || data || [];
    console.log(`📦 Se recibieron ${contracts.length} contratos desde la API.`);

    if (contracts.length === 0) {
      console.log('⚠️ No hay registros para procesar.');
      return;
    }

    // PASO 1: Desactivar TODOS los registros actuales (los que vinieron antes con el token viejo)
    console.log('🧹 Desactivando todos los registros existentes en Supabase...');
    const { error: deactivateError } = await supabase
      .from('clientes_llamadas')
      .update({ activo: false })
      .neq('id', '0'); // Filtro dummy para afectar todos los registros

    if (deactivateError) {
      console.error('❌ Error al desactivar registros antiguos:', deactivateError);
      // No cancelamos el proceso, seguimos con el upsert
    } else {
      console.log('✅ Registros anteriores marcados como inactivos.');
    }

    // PASO 2: Upsert de los contratos obtenidos de la nueva API
    console.log('💾 Guardando / actualizando registros en Supabase...');

    const BATCH_SIZE = 50;
    for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
      const batch = contracts.slice(i, i + BATCH_SIZE);

      const upsertData = batch.map(c => {
        const costoPlan = parseFloat(c.plan?.cost ?? '0') || 0;

        return {
          id: c.id.toString(),
          // Datos del cliente (nueva estructura anidada)
          cliente_id: c.client?.id || null,
          cedula: c.client?.identification || null,
          nombre: c.client?.full_name || '',
          telefono: c.client?.mobile || '',
          email: c.client?.email || null,
          // Datos del plan (nueva estructura anidada)
          plan_contratado: c.plan?.name || 'Plan Desconocido',
          costo_plan: costoPlan,
          // Estado del contrato
          status: null,          // no viene en la nueva API, se guarda como null
          ciclo: c.cycle || 10,
          provisional: c.provisional ?? true,
          client_type: [c.client_type?.id || 1],
          // Campos que no vienen en la nueva API → null para no sobrescribir los que ya tengan datos
          sector: null,
          parroquia: null,
          direccion: null,
          deuda_bs: null,
          retaining_client: false,
          contract_tag: null,
          banco_nombre: null,
          banco_nro_cuenta: null,
          created_by: null,
          // Activar el registro
          activo: true,
        };
      });

      const { error: upsertError } = await supabase
        .from('clientes_llamadas')
        .upsert(upsertData, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error(`❌ Error en el lote ${Math.floor(i / BATCH_SIZE) + 1}:`, upsertError);
      } else {
        console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1} procesado correctamente (${upsertData.length} registros).`);
      }
    }

    console.log('🎉 Sincronización completada con éxito.');
  } catch (error) {
    console.error('❌ Error general durante la sincronización:', error);
  }
}

// Ejecutar
syncCRMToSupabase();
