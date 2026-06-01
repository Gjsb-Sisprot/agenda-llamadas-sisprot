-- Tabla simplificada para la bitácora de llamadas y visitas (Sisprot Global Fiber)
CREATE TABLE IF NOT EXISTS clientes_llamadas (
    id TEXT PRIMARY KEY,                       -- ID del contrato de la API del CRM
    cedula TEXT,                               -- Cédula del cliente para búsquedas rápidas
    informado BOOLEAN DEFAULT FALSE NOT NULL,  -- Si ya fue informado del cambio
    primer_contacto TIMESTAMPTZ,              -- Fecha y hora del contacto realizado
    resultado_primer_contacto TEXT,            -- Detalles y notas de la llamada
    reagendar_fecha TIMESTAMPTZ,              -- Fecha de llamada reagendada (si aplica)
    requiere_ticket_glpi BOOLEAN DEFAULT FALSE NOT NULL, -- Si requiere soporte en GLPI
    ticket_glpi_detalles TEXT,                 -- Detalles del ticket GLPI
    duracion_segundos INTEGER,                 -- Duración de la llamada en segundos
    intentos_fallidos INTEGER DEFAULT 0,       -- Número de intentos de llamada fallidos
    updated_at TIMESTAMPTZ DEFAULT now()       -- Última actualización del registro
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE clientes_llamadas ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso completo a clientes_llamadas
CREATE POLICY "Permitir acceso completo a clientes_llamadas" 
ON clientes_llamadas 
FOR ALL 
USING (true) 
WITH CHECK (true);
