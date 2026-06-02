import { NextResponse } from 'next/server';
import { signSession } from '@/lib/session';
import { loginSchema } from '@/lib/validations';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
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
      return NextResponse.json({ 
        success: false, 
        error: error?.message || 'Credenciales inválidas o correo no registrado.' 
      }, { status: 401 });
    }

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
