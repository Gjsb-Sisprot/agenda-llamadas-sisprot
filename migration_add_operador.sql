-- =============================================================================
-- MIGRACIÓN: Agregar campo operador de forma persistente
-- =============================================================================

ALTER TABLE clientes_llamadas 
ADD COLUMN IF NOT EXISTS operador TEXT;

-- Crear índice para mejorar consultas filtradas por operador
CREATE INDEX IF NOT EXISTS idx_clientes_llamadas_operador 
ON clientes_llamadas (operador);
