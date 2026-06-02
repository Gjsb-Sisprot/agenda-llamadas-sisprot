/**
 * Session utility using standard Web Crypto API (Edge-compatible)
 * for signing and verifying secure stateless sessions.
 */

const SECRET = process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production-12345';

export interface SessionData {
  email: string;
  name: string;
  expires: number;
}

export async function signSession(data: SessionData): Promise<string> {
  const payload = JSON.stringify(data);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET);
  const payloadData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Base64 encode the payload to make it URL-safe for cookies
  const base64Payload = typeof btoa !== 'undefined'
    ? btoa(payload)
    : Buffer.from(payload).toString('base64');

  return `${base64Payload}.${signatureHex}`;
}

export async function decryptSession(token: string): Promise<SessionData | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [base64Payload, signatureHex] = parts;

    const payload = typeof atob !== 'undefined'
      ? atob(base64Payload)
      : Buffer.from(base64Payload, 'base64').toString('utf-8');

    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET);
    const payloadData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['verify']
    );

    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, payloadData);
    if (!isValid) return null;

    const parsed: SessionData = JSON.parse(payload);
    
    // Check expiration
    if (Date.now() > parsed.expires) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to decrypt session:', err);
    return null;
  }
}
