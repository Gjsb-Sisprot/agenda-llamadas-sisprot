import { NextResponse } from 'next/server';
import { signSession } from '@/lib/session';
import { loginSchema } from '@/lib/validations';

const USERS_DATABASE: Record<string, { name: string; email: string; pass: string }> = {
  "elisaul@sisprot.com": { name: "Elisaul Reyes", email: "elisaul@sisprot.com", pass: "elisaul123" },
  "georgina@sisprot.com": { name: "Georgina Baladi", email: "georgina@sisprot.com", pass: "georgina123" },
  "khaloa@sisprot.com": { name: "Khaloa Serrano", email: "khaloa@sisprot.com", pass: "khaloa123" },
  "derwing@sisprot.com": { name: "Derwing Acevedo", email: "derwing@sisprot.com", pass: "derwing123" },
  "luis@sisprot.com": { name: "Luis Hidalgo", email: "luis@sisprot.com", pass: "luis123" },
  "sandy@sisprot.com": { name: "Sandy Rodriguez", email: "sandy@sisprot.com", pass: "sandy123" },
  "yhosselyn@sisprot.com": { name: "Yhosselyn Perez", email: "yhosselyn@sisprot.com", pass: "yhosselyn123" },
  "yetzareth@sisprot.com": { name: "Yetzareth Bravo", email: "yetzareth@sisprot.com", pass: "yetzareth123" },
  "paola@sisprot.com": { name: "Paola Guanipa", email: "paola@sisprot.com", pass: "paola123" },
  "guillermo@sisprot.com": { name: "Guillermo Sanchez", email: "guillermo@sisprot.com", pass: "guillermo123" },
  "levi@sisprot.com": { name: "Levi Oliveros", email: "levi@sisprot.com", pass: "levi123" },
  "barbara@sisprot.com": { name: "Barbara Rodriguez", email: "barbara@sisprot.com", pass: "barbara123" },
  "milagros@sisprot.com": { name: "Milagros Teran", email: "milagros@sisprot.com", pass: "milagros123" },
  "jannerys@sisprot.com": { name: "Jannerys Pirela", email: "jannerys@sisprot.com", pass: "jannerys123" },
  "thais@sisprot.com": { name: "Thais Bejas", email: "thais@sisprot.com", pass: "thais123" }
};

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
    const user = USERS_DATABASE[email];

    if (!user || user.pass !== password) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas o correo no registrado.' }, { status: 401 });
    }

    // Session valid for 24 hours
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    const sessionToken = await signSession({
      email: user.email,
      name: user.name,
      expires,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email
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
