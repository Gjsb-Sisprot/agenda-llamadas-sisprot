import { NextResponse } from 'next/server';

const PORTAL_PAGO_WEBHOOK_URL = process.env.PORTAL_PAGO_WEBHOOK_URL || 'https://n8n.sisprottaurus.com/webhook/notificacion_cliente_portal_pago_ciclo_01';
const NO_CONTESTO_WEBHOOK_URL = process.env.NO_CONTESTO_WEBHOOK_URL || 'https://n8n.sisprottaurus.com/webhook/Intento-contacto-sin-respuesta';
const WEBHOOK_SHARED_SECRET = process.env.WEBHOOK_SHARED_SECRET || ''; // Optional authentication key for n8n

export async function POST(request: Request) {
  try {
    const { action, contrato } = await request.json();

    if (!contrato) {
      return NextResponse.json({ success: false, error: 'Número de contrato requerido' }, { status: 400 });
    }

    let url = '';
    if (action === 'portal_pago') {
      url = PORTAL_PAGO_WEBHOOK_URL;
    } else if (action === 'no_contesto') {
      url = NO_CONTESTO_WEBHOOK_URL;
    } else {
      return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // If a shared secret is configured, send it to authorize the request in n8n
    if (WEBHOOK_SHARED_SECRET) {
      headers['Authorization'] = `Bearer ${WEBHOOK_SHARED_SECRET}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ CONTRATO: contrato }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SERVER_WEBHOOK_ERROR] Failed calling webhook ${action}:`, errorText);
      return NextResponse.json({ success: false, error: 'Error al enviar petición al servidor de automatización' }, { status: 502 });
    }

    try {
      const responseData = await response.json();
      return NextResponse.json({ success: true, data: responseData });
    } catch {
      return NextResponse.json({ success: true });
    }
  } catch (error: unknown) {
    console.error('[SERVER_WEBHOOK_EXCEPTION]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
