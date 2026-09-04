-- Migración: precio mensual personalizado por inscripción

ALTER TABLE inscripciones
ADD COLUMN IF NOT EXISTS precio_mensual_personalizado NUMERIC(10,2);

ALTER TABLE inscripciones
ADD COLUMN IF NOT EXISTS motivo_precio_personalizado TEXT;