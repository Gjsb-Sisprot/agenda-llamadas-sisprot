import { describe, it, expect } from 'vitest';
import { signSession, decryptSession, SessionData } from './session';
import { loginSchema, callLogSchema } from './validations';

describe('Cryptographic Session Tests', () => {
  it('should sign and successfully decrypt a valid session', async () => {
    const data: SessionData = {
      email: 'test@sisprot.com',
      name: 'Test Operator',
      expires: Date.now() + 60000, // 1 minute from now
    };

    const token = await signSession(data);
    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(2);

    const decrypted = await decryptSession(token);
    expect(decrypted).not.toBeNull();
    expect(decrypted?.email).toBe(data.email);
    expect(decrypted?.name).toBe(data.name);
    expect(decrypted?.expires).toBe(data.expires);
  });

  it('should return null for expired sessions', async () => {
    const data: SessionData = {
      email: 'test@sisprot.com',
      name: 'Test Operator',
      expires: Date.now() - 1000, // Expired 1 second ago
    };

    const token = await signSession(data);
    const decrypted = await decryptSession(token);
    expect(decrypted).toBeNull();
  });

  it('should return null for tampered/invalid signatures', async () => {
    const data: SessionData = {
      email: 'test@sisprot.com',
      name: 'Test Operator',
      expires: Date.now() + 60000,
    };

    const token = await signSession(data);
    const [, signature] = token.split('.');
    
    // Tamper with payload (change data in base64 without changing signature)
    const tamperedPayload = Buffer.from(JSON.stringify({ ...data, name: 'Hacker' })).toString('base64');
    const tamperedToken = `${tamperedPayload}.${signature}`;

    const decrypted = await decryptSession(tamperedToken);
    expect(decrypted).toBeNull();
  });
});

describe('Zod Schema Payload Validation Tests', () => {
  describe('loginSchema', () => {
    it('should validate correct login formats', () => {
      const valid = { email: '  ELISAUL@SISPROT.COM  ', password: 'password123' };
      const parsed = loginSchema.safeParse(valid);
      
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.email).toBe('elisaul@sisprot.com'); // normalization check
        expect(parsed.data.password).toBe('password123');
      }
    });

    it('should fail invalid emails', () => {
      const invalid = { email: 'not-an-email', password: 'pass' };
      const parsed = loginSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('callLogSchema', () => {
    it('should parse valid call logs and apply defaults', () => {
      const log = { id: 12345, informado: true };
      const parsed = callLogSchema.safeParse(log);

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.id).toBe('12345'); // transformed to string
        expect(parsed.data.informado).toBe(true);
        expect(parsed.data.requiere_ticket_glpi).toBe(false); // default value
        expect(parsed.data.intentos_fallidos).toBe(0); // default value
      }
    });

    it('should reject invalid datatypes', () => {
      const log = { id: 12345, intentos_fallidos: -5 }; // negative integers not allowed
      const parsed = callLogSchema.safeParse(log);
      expect(parsed.success).toBe(false);
    });
  });
});
