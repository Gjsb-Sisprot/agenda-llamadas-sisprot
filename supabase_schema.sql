-- =============================================================================
-- ESQUEMA SQL — Agenda de Llamadas y Visitas (Sisprot Global Fiber)
-- Actualizado: 2026-06-01
-- =============================================================================

-- =============================================================================
-- 1. TABLA: clientes_llamadas
--    Registro central de contratos sincronizados desde la API del CRM.
--    También almacena la bitácora de llamadas y el estado de cada gestión.
--
--    CAMPOS CRM (sincronizados vía sync-data.ts / upsert desde la API pública):
--      id, cliente_id, cedula, nombre, telefono, email,
--      plan_contratado, costo_plan, ciclo, provisional, client_type,
--      sector, parroquia, direccion, deuda_bs, retaining_client,
--      contract_tag, banco_nombre, banco_nro_cuenta, created_by, activo
--
--    CAMPOS DE GESTIÓN (escritos por la app al registrar llamadas/visitas):
--      informado, primer_contacto, resultado_primer_contacto,
--      reagendar_fecha, visita_oficina_fecha,
--      requiere_ticket_glpi, ticket_glpi_detalles,
--      duracion_segundos, intentos_fallidos, updated_at
-- =============================================================================
CREATE TABLE IF NOT EXISTS clientes_llamadas (

    -- -------------------------------------------------------------------------
    -- Identificadores
    -- -------------------------------------------------------------------------
    id              TEXT        PRIMARY KEY,            -- ID del contrato en el CRM
    cliente_id      INTEGER,                            -- ID del cliente en el CRM
    cedula          TEXT,                               -- Cédula de identidad

    -- -------------------------------------------------------------------------
    -- Datos de contacto del cliente
    -- -------------------------------------------------------------------------
    nombre          TEXT        NOT NULL DEFAULT '',    -- Nombre completo del cliente
    telefono        TEXT        NOT NULL DEFAULT '',    -- Teléfono móvil principal
    email           TEXT,                               -- Correo electrónico

    -- -------------------------------------------------------------------------
    -- Datos del contrato / plan
    -- -------------------------------------------------------------------------
    plan_contratado TEXT        NOT NULL DEFAULT 'Plan Desconocido',
    plan_id         INTEGER,                            -- ID interno del plan en el CRM
    costo_plan      NUMERIC(10,2) NOT NULL DEFAULT 0,   -- Costo mensual en USD
    ciclo           INTEGER     DEFAULT 10,             -- Ciclo de facturación (10 = ciclo 15, 1 = ciclo 1)
    provisional     BOOLEAN     DEFAULT TRUE,           -- Si el contrato es provisional
    client_type     INTEGER[],                          -- Array de IDs de tipo de cliente

    -- -------------------------------------------------------------------------
    -- Datos geográficos / servicio
    -- -------------------------------------------------------------------------
    sector          TEXT,
    parroquia       TEXT,
    direccion       TEXT,
    deuda_bs        NUMERIC(14,2),                      -- Deuda en bolívares (prorrateo)
    retaining_client BOOLEAN    DEFAULT FALSE,          -- Si es cliente a retener
    contract_tag    TEXT,                               -- Etiqueta especial del contrato

    -- -------------------------------------------------------------------------
    -- Datos bancarios
    -- -------------------------------------------------------------------------
    banco_nombre    TEXT,
    banco_nro_cuenta TEXT,

    -- -------------------------------------------------------------------------
    -- Metadatos del CRM
    -- -------------------------------------------------------------------------
    created_by      TEXT,                               -- Usuario que creó el contrato
    activo          BOOLEAN     DEFAULT TRUE NOT NULL,  -- FALSE = el contrato ya no aplica en el ciclo activo

    -- -------------------------------------------------------------------------
    -- Bitácora de llamadas (escrita por los operadores desde la app)
    -- -------------------------------------------------------------------------
    informado                   BOOLEAN     DEFAULT FALSE NOT NULL,  -- Si el cliente fue informado de la migración
    primer_contacto             TIMESTAMPTZ,                          -- Fecha/hora del primer contacto realizado
    resultado_primer_contacto   TEXT,                                 -- Notas/resultado de la llamada
    reagendar_fecha             TIMESTAMPTZ,                          -- Fecha de rellamada (si aplica)
    visita_oficina_fecha        TIMESTAMPTZ,                          -- Fecha agendada para visita en oficina
    requiere_ticket_glpi        BOOLEAN     DEFAULT FALSE NOT NULL,   -- Si requiere ticket de soporte GLPI
    ticket_glpi_detalles        TEXT,                                 -- Número y descripción del ticket GLPI
    duracion_segundos           INTEGER,                              -- Duración de la llamada en segundos
    intentos_fallidos           INTEGER     DEFAULT 0,                -- Intentos de llamada sin respuesta

    -- -------------------------------------------------------------------------
    -- Auditoría
    -- -------------------------------------------------------------------------
    updated_at                  TIMESTAMPTZ DEFAULT now()             -- Última actualización del registro
);

-- Índices de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_clientes_llamadas_cedula      ON clientes_llamadas (cedula);
CREATE INDEX IF NOT EXISTS idx_clientes_llamadas_nombre      ON clientes_llamadas (nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_llamadas_telefono    ON clientes_llamadas (telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_llamadas_activo      ON clientes_llamadas (activo);
CREATE INDEX IF NOT EXISTS idx_clientes_llamadas_informado   ON clientes_llamadas (informado);
CREATE INDEX IF NOT EXISTS idx_clientes_llamadas_ciclo       ON clientes_llamadas (ciclo);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE clientes_llamadas ENABLE ROW LEVEL SECURITY;

-- Política de acceso completo (la app usa anon key con backend propio en Next.js)
CREATE POLICY "Permitir acceso completo a clientes_llamadas"
    ON clientes_llamadas FOR ALL
    USING (true) WITH CHECK (true);
