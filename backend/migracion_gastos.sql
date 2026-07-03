-- ============================================================
-- Migración: tabla de gastos + resumen financiero
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLA: gastos
-- Registro de gastos operativos de la academia
-- ============================================================
CREATE TABLE IF NOT EXISTS gastos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concepto        VARCHAR(150) NOT NULL,
    categoria       VARCHAR(50) NOT NULL DEFAULT 'otro',
    -- categorías sugeridas: renta, nómina, mantenimiento, equipo, marketing, servicios, otro
    monto           NUMERIC(10,2) NOT NULL,
    fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
    notas           TEXT,
    registrado_por  UUID REFERENCES usuarios(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
