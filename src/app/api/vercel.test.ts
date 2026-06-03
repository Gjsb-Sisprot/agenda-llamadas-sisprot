import { describe, it, expect } from 'vitest';

const BASE_URL = 'https://agenda-llamadas-sisprot.vercel.app';

describe('Vercel Remote Deployment API Integration Tests', () => {
  
  describe('/api/powerbi endpoint', () => {
    it('should return 401 Unauthorized for requests without token', async () => {
      const res = await fetch(`${BASE_URL}/api/powerbi`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 Unauthorized for requests with invalid token', async () => {
      const res = await fetch(`${BASE_URL}/api/powerbi`, {
        headers: {
          'Authorization': 'Bearer wrong-secret-token'
        }
      });
      expect(res.status).toBe(401);
    });
  });

  describe('/api/clientes endpoint', () => {
    it('should return 401 Unauthorized for requests without session cookie (blocked by Middleware)', async () => {
      const res = await fetch(`${BASE_URL}/api/clientes`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toContain('Inicie sesión para acceder');
    });
  });

});
