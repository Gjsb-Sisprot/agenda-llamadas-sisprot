import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { decryptSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
    });
    const parts = formatter.formatToParts(today);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const currentMonth = `${year}-${month}`;

    const { data } = await supabase
      .from('tasa_bcv_mensual')
      .select('*')
      .eq('mes', currentMonth)
      .maybeSingle();

    if (data) {
      return NextResponse.json({ tasa: Number(data.tasa), mes: data.mes });
    }

    // Fallback: get the most recent month's rate
    const { data: fallbackData } = await supabase
      .from('tasa_bcv_mensual')
      .select('*')
      .order('mes', { ascending: false })
      .limit(1);

    if (fallbackData && fallbackData.length > 0) {
      return NextResponse.json({
        tasa: Number(fallbackData[0].tasa),
        mes: fallbackData[0].mes,
        isFallback: true,
      });
    }

    return NextResponse.json({ tasa: 0, mes: currentMonth });
  } catch (error: unknown) {
    console.error('Error fetching BCV rate:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    let operatorName = '';
    if (sessionToken) {
      const session = await decryptSession(sessionToken);
      if (session) {
        operatorName = session.name;
      }
    }

    if (operatorName !== 'Elisaul Reyes') {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'Acceso denegado: solo Elisaul Reyes puede actualizar la tasa del BCV.'
      }, { status: 403 });
    }

    const { tasa } = await request.json();
    const rate = Number(tasa);
    if (isNaN(rate) || rate <= 0) {
      return NextResponse.json({ error: 'La tasa debe ser un número positivo válido.' }, { status: 400 });
    }

    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
    });
    const parts = formatter.formatToParts(today);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const currentMonth = `${year}-${month}`;

    const { data, error } = await supabase
      .from('tasa_bcv_mensual')
      .upsert({
        mes: currentMonth,
        tasa: rate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'mes' })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error: unknown) {
    console.error('Error saving BCV rate:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
