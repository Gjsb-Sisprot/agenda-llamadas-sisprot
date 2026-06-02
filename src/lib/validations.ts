import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('El correo electrónico no es válido').transform(e => e.toLowerCase()),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const callLogSchema = z.object({
  id: z.string().or(z.number()).transform(val => val.toString()),
  cedula: z.string().nullable().optional(),
  informado: z.boolean().default(false),
  primer_contacto: z.string().nullable().optional(),
  resultado_primer_contacto: z.string().nullable().optional(),
  reagendar_fecha: z.string().nullable().optional(),
  visita_oficina_fecha: z.string().nullable().optional(),
  requiere_ticket_glpi: z.boolean().default(false),
  ticket_glpi_detalles: z.string().nullable().optional(),
  duracion_segundos: z.number().nullable().optional(),
  intentos_fallidos: z.number().int().nonnegative().optional().default(0),
});
