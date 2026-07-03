-- ============================================================
-- Migración: agregar grupo_id y dia_semana a la vista horario_semanal
-- Ejecutar en Supabase SQL Editor
-- ============================================================

DROP VIEW IF EXISTS horario_semanal;

CREATE VIEW horario_semanal AS
SELECT
    g.nombre AS grupo,
    g.id AS grupo_id,
    CASE c.dia_semana
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
        WHEN 7 THEN 'Domingo'
    END AS dia,
    c.dia_semana,
    c.hora_inicio,
    c.hora_fin,
    n.nombre AS nivel,
    g.tipo,
    g.capacidad,
    c.id AS clase_id
FROM clases c
JOIN grupos g   ON g.id = c.grupo_id
LEFT JOIN niveles n ON n.id = g.nivel_id
WHERE c.activo = TRUE AND g.activo = TRUE
ORDER BY c.dia_semana, c.hora_inicio;
