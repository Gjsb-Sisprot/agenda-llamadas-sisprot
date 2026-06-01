import { NextResponse } from 'next/server';

const baseURL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://sisprot-evolution-api.x8cfq6.easypanel.host';
const apiKey = process.env.EVOLUTION_API_KEY || '26F9D106EA66-4FE6-96EF-A6057B5131B7';
const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'Sisprot%20GF%20CallCenter%20Definitivo';

function formatNumber(number: string): string {
  let clean = number.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '58' + clean.substring(1);
  } else if (!clean.startsWith('58') && clean.length === 10) {
    clean = '58' + clean;
  }
  return clean;
}

export async function POST(request: Request) {
  try {
    const { action, number, text } = await request.json();

    if (!number) {
      return NextResponse.json({ success: false, error: 'Número de teléfono requerido' }, { status: 400 });
    }

    const cleanNumber = formatNumber(number);

    if (action === 'check') {
      const url = `${baseURL}/chat/whatsappNumbers/${instanceName}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          numbers: [cleanNumber]
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[EVOLUTION_API_CHECK_ERROR]', data);
        return NextResponse.json({ success: false, error: data.message || 'Error al validar número en WhatsApp' }, { status: response.status });
      }

      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ success: true, exists: data[0].exists ?? false });
      }
      return NextResponse.json({ success: true, exists: false });

    } else if (action === 'send') {
      if (!text) {
        return NextResponse.json({ success: false, error: 'Mensaje de texto requerido' }, { status: 400 });
      }

      const url = `${baseURL}/message/sendText/${instanceName}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: cleanNumber,
          text: text,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: false
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[EVOLUTION_API_SEND_ERROR]', data);
        return NextResponse.json({ success: false, error: data.message || 'Error al enviar mensaje por WhatsApp' }, { status: response.status });
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });

  } catch (error: unknown) {
    console.error('[API_WHATSAPP_EXCEPTION]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
