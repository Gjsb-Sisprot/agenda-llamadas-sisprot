import { NextResponse } from 'next/server';
import { signSession } from '@/lib/session';
import { loginSchema } from '@/lib/validations';
import { supabase } from '@/lib/supabase';

// Rate limit simple en memoria (por IP)
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const LIMIT_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minuto

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const rateLimit = rateLimitMap.get(ip);

    if (rateLimit) {
      if (now - rateLimit.lastRequest < WINDOW_MS) {
        if (rateLimit.count >= LIMIT_ATTEMPTS) {
          return NextResponse.json({
            success: false,
            error: 'Demasiados intentos fallidos. Inténtalo de nuevo en un minuto.'
          }, { status: 429 });
        }
      } else {
        // Resetear ventana
        rateLimit.count = 0;
      }
    }

    const body = await request.json();
    
    // Strict payload validation using Zod
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation failed', 
        details: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { email, password } = result.data;

    // Authenticate using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      const current = rateLimitMap.get(ip) || { count: 0, lastRequest: now };
      current.count++;
      current.lastRequest = now;
      rateLimitMap.set(ip, current);

      return NextResponse.json({ 
        success: false, 
        error: error?.message || 'Credenciales inválidas o correo no registrado.' 
      }, { status: 401 });
    }

    // Login exitoso -> resetear intentos
    rateLimitMap.delete(ip);


    const userEmail = data.user.email || email;
    
    // Get name from user metadata or fallback to email prefix
    const rawName = data.user.user_metadata?.name || data.user.user_metadata?.full_name || userEmail.split('@')[0];
    const userName = rawName
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Session valid for 24 hours
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    const sessionToken = await signSession({
      email: userEmail,
      name: userName,
      expires,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        name: userName,
        email: userEmail
      }
    });

    // Set cookie on server
    const isHttps = request.url.startsWith('https:');
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
    });

    return response;
  } catch (error: unknown) {
    console.error('[AUTH_LOGIN_ERROR]', error);
    const msg = error instanceof Error ? error.message : 'Error interno de autenticación';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
