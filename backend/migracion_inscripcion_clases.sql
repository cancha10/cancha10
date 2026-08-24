BEGIN;

CREATE TABLE IF NOT EXISTS inscripcion_clases (
    id SERIAL PRIMARY KEY,
    inscripcion_id UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
    clase_id INTEGER NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (inscripcion_id, clase_id)
);

CREATE INDEX IF NOT EXISTS idx_inscripcion_clases_inscripcion
    ON inscripcion_clases(inscripcion_id);

CREATE INDEX IF NOT EXISTS idx_inscripcion_clases_clase
    ON inscripcion_clases(clase_id);

COMMIT;