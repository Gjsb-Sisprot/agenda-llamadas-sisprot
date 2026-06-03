import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getPowerBI } from './powerbi/route';
import { GET as getClientes } from './clientes/route';
import { signSession } from '@/lib/session';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        range: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('API Route - /api/powerbi', () => {
  beforeEach(() => {
    vi.stubEnv('POWERBI_TOKEN', 'test-powerbi-secret-token');
  });

  it('should return 401 Unauthorized if authorization header is missing', async () => {
    const req = new Request('http://localhost/api/powerbi');
    const res = await getPowerBI(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 401 Unauthorized if authorization header does not match expected token', async () => {
    const req = new Request('http://localhost/api/powerbi', {
      headers: {
        'Authorization': 'Bearer wrong-token',
      },
    });
    const res = await getPowerBI(req);
    expect(res.status).toBe(401);
  });

  it('should return 200 OK with correct Bearer token', async () => {
    const req = new Request('http://localhost/api/powerbi', {
      headers: {
        'Authorization': 'Bearer test-powerbi-secret-token',
      },
    });
    const res = await getPowerBI(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBeTypeOf('string');
  });

  it('should return 304 Not Modified if ETag matches If-None-Match header', async () => {
    const req1 = new Request('http://localhost/api/powerbi', {
      headers: {
        'Authorization': 'Bearer test-powerbi-secret-token',
      },
    });
    const res1 = await getPowerBI(req1);
    const etag = res1.headers.get('ETag');
    expect(etag).not.toBeNull();

    const req2 = new Request('http://localhost/api/powerbi', {
      headers: {
        'Authorization': 'Bearer test-powerbi-secret-token',
        'If-None-Match': etag || '',
      },
    });
    const res2 = await getPowerBI(req2);
    expect(res2.status).toBe(304);
  });
});

describe('API Route - /api/clientes Access Control', () => {
  it('should return 403 Forbidden when no session cookie is present', async () => {
    const req = new Request('http://localhost/api/clientes');
    const res = await getClientes(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('should return 403 Forbidden for operators other than Yetzareth Bravo', async () => {
    const token = await signSession({
      email: 'another@sisprot.com',
      name: 'Another Operator',
      expires: Date.now() + 60000,
    });
    const req = new Request('http://localhost/api/clientes', {
      headers: {
        'Cookie': `session_token=${token}`,
      },
    });
    const res = await getClientes(req);
    expect(res.status).toBe(403);
  });

  it('should allow access and return data for Yetzareth Bravo (ybravo@sisprotgf.com)', async () => {
    const token = await signSession({
      email: 'ybravo@sisprotgf.com',
      name: 'Yetzareth Bravo',
      expires: Date.now() + 60000,
    });
    const req = new Request('http://localhost/api/clientes', {
      headers: {
        'Cookie': `session_token=${token}`,
      },
    });
    const res = await getClientes(req);
    // Access is allowed (Supabase mock returns empty data, which resolves to 200 OK)
    expect(res.status).toBe(200);
  });
});
