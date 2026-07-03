-- ============================================================
--  C10 · Cancha 10 – Esquema de Base de Datos PostgreSQL
--  Versión 1.0 · Junio 2026
--  Control de Alumnos, Reservaciones, Asistencia y Pagos
-- ============================================================

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: roles
-- Define los tipos de usuario en el sistema
-- ============================================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,  -- 'alumno', 'admin', 'instructor'
    descripcion TEXT
);

INSERT INTO roles (nombre, descripcion) VALUES
    ('admin',      'Acceso total al sistema'),
    ('instructor', 'Puede ver y registrar asistencia'),
    ('alumno',     'Puede reservar y ver sus propios datos');


-- ============================================================
-- TABLA: usuarios
-- Todos los usuarios del sistema (alumnos, admins, instructores)
-- ============================================================
CREATE TABLE usuarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    telefono        VARCHAR(20),
    password_hash   TEXT NOT NULL,
    rol_id          INTEGER NOT NULL REFERENCES roles(id) DEFAULT 3, -- alumno por defecto
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol   ON usuarios(rol_id);


-- ============================================================
-- TABLA: niveles
-- Niveles de juego disponibles en la academia
-- ============================================================
CREATE TABLE niveles (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(50) NOT NULL UNIQUE  -- 'principiante', 'intermedio', 'avanzado'
);

INSERT INTO niveles (nombre) VALUES
    ('principiante'),
    ('intermedio'),
    ('avanzado');


-- ============================================================
-- TABLA: alumnos
-- Perfil específico del alumno (extiende usuarios)
-- ============================================================
CREATE TABLE alumnos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nivel_id        INTEGER REFERENCES niveles(id),
    tipo            VARCHAR(20) CHECK (tipo IN ('niño', 'adulto')) NOT NULL,
    fecha_nac       DATE,
    notas           TEXT,         -- notas internas del instructor
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alumnos_usuario ON alumnos(usuario_id);


-- ============================================================
-- TABLA: paquetes
-- Paquetes mensuales de clases grupales e individuales
-- ============================================================
CREATE TABLE paquetes (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL,
    tipo                VARCHAR(20) NOT NULL CHECK (tipo IN ('grupal', 'individual')),
    horas_semana        NUMERIC(4,1) NOT NULL,  -- horas por semana
    clases_mes          INTEGER NOT NULL,        -- total de clases al mes
    precio_mensual      NUMERIC(10,2) NOT NULL,  -- precio base del paquete
    renta_cancha        NUMERIC(10,2) DEFAULT 0, -- aplica solo a individuales
    precio_total        NUMERIC(10,2) NOT NULL,  -- precio_mensual + renta_cancha (calculado)
    capacidad_max       INTEGER,                  -- NULL = sin límite (grupales flexibles)
    activo              BOOLEAN DEFAULT TRUE,
    descripcion         TEXT
);

-- Paquetes grupales
INSERT INTO paquetes (nombre, tipo, horas_semana, clases_mes, precio_mensual, renta_cancha, precio_total, capacidad_max, descripcion) VALUES
    ('Paquete 1 – 1 hora/semana',  'grupal', 1, 4,  900.00,  0, 900.00,  NULL, '1 clase por semana, 4 clases al mes'),
    ('Paquete 2 – 2 horas/semana', 'grupal', 2, 8,  1600.00, 0, 1600.00, NULL, '2 clases por semana, 8 clases al mes'),
    ('Paquete 3 – 3 horas/semana', 'grupal', 3, 12, 2200.00, 0, 2200.00, NULL, '3 clases por semana, 12 clases al mes'),
    ('Paquete 4 – 4 horas/semana', 'grupal', 4, 16, 3000.00, 0, 3000.00, NULL, '4 clases por semana, 16 clases al mes'),
    ('Paquete 5 – 5 horas/semana', 'grupal', 5, 20, 3800.00, 0, 3800.00, NULL, '5 clases por semana, 20 clases al mes');

-- Clases individuales (precio por clase + renta de cancha)
INSERT INTO paquetes (nombre, tipo, horas_semana, clases_mes, precio_mensual, renta_cancha, precio_total, capacidad_max, descripcion) VALUES
    ('Individual – 1 clase/semana',  'individual', 1, 4,  500.00, 250.00, 750.00,  1, '500/clase + 250 renta de cancha'),
    ('Individual – 2 clases/semana', 'individual', 2, 8,  450.00, 250.00, 700.00,  1, '450/clase + 250 renta de cancha'),
    ('Individual – 3+ clases/semana','individual', 3, 12, 400.00, 250.00, 650.00,  1, '400/clase + 250 renta de cancha');


-- ============================================================
-- TABLA: grupos
-- Grupos de clase (nombre descriptivo para cada grupo)
-- ============================================================
CREATE TABLE grupos (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,       -- ej. "Niños Principiantes"
    nivel_id    INTEGER REFERENCES niveles(id),
    tipo        VARCHAR(20) CHECK (tipo IN ('niño', 'adulto', 'particular')),
    capacidad   INTEGER,                      -- NULL = sin límite fijo
    activo      BOOLEAN DEFAULT TRUE
);

INSERT INTO grupos (nombre, nivel_id, tipo, capacidad) VALUES
    ('Niños Principiantes',     1, 'niño',      NULL),
    ('Niños Avanzados',         3, 'niño',      6),
    ('Mujeres Principiantes',   1, 'adulto',    NULL),
    ('Adultos Intermedios',     2, 'adulto',    6),
    ('Adultos Avanzados',       3, 'adulto',    6),
    ('Clase Particular Patoni', NULL, 'particular', 1),
    ('Clase Particular Tony',   NULL, 'particular', 1),
    ('Clase Particular Hanai',  NULL, 'particular', 1);


-- ============================================================
-- TABLA: clases
-- Horarios recurrentes de cada grupo
-- ============================================================
CREATE TABLE clases (
    id              SERIAL PRIMARY KEY,
    grupo_id        INTEGER NOT NULL REFERENCES grupos(id),
    dia_semana      INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    --  1=Lunes 2=Martes 3=Miércoles 4=Jueves 5=Viernes 6=Sábado 7=Domingo
    hora_inicio     TIME NOT NULL,
    hora_fin        TIME NOT NULL,
    activo          BOOLEAN DEFAULT TRUE
);

-- Niños Principiantes – Lunes y Miércoles 5-6pm
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES
    (1, 1, '17:00', '18:00'),  -- Lunes
    (1, 3, '17:00', '18:00');  -- Miércoles

-- Niños Avanzados – Martes y Jueves 5-6pm
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES
    (2, 2, '17:00', '18:00'),  -- Martes
    (2, 4, '17:00', '18:00');  -- Jueves

-- Mujeres Principiantes – Lunes y Miércoles 6-7pm
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES
    (3, 1, '18:00', '19:00'),  -- Lunes
    (3, 3, '18:00', '19:00');  -- Miércoles

-- Adultos Intermedios – Martes y Jueves 6-7pm y 7-8pm
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES
    (4, 2, '18:00', '19:00'),  -- Martes 6-7pm
    (4, 2, '19:00', '20:00'),  -- Martes 7-8pm
    (4, 4, '18:00', '19:00'),  -- Jueves 6-7pm
    (4, 4, '19:00', '20:00');  -- Jueves 7-8pm

-- Adultos Avanzados – Viernes 7-8pm
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES
    (5, 5, '19:00', '20:00');  -- Viernes

-- Particular Patoni – Martes y Jueves 6-7pm
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES
    (6, 2, '18:00', '19:00'),  -- Martes
    (6, 4, '18:00', '19:00');  -- Jueves

-- Particular Tony – Lunes y Miércoles 7-8pm
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES
    (7, 1, '19:00', '20:00'),  -- Lunes
    (7, 3, '19:00', '20:00');  -- Miércoles

-- Particular Hanai – Miércoles y Viernes 8-9pm
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES
    (8, 3, '20:00', '21:00'),  -- Miércoles
    (8, 5, '20:00', '21:00');  -- Viernes


-- ============================================================
-- TABLA: inscripciones
-- Relación alumno ↔ paquete ↔ grupo (membresía activa)
-- ============================================================
CREATE TABLE inscripciones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id       UUID NOT NULL REFERENCES alumnos(id),
    paquete_id      INTEGER NOT NULL REFERENCES paquetes(id),
    grupo_id        INTEGER REFERENCES grupos(id),
    fecha_inicio    DATE NOT NULL,
    fecha_fin       DATE NOT NULL,
    estado          VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'vencida', 'cancelada', 'pendiente_pago')),
    notas           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inscripciones_alumno  ON inscripciones(alumno_id);
CREATE INDEX idx_inscripciones_estado  ON inscripciones(estado);
CREATE INDEX idx_inscripciones_fechas  ON inscripciones(fecha_inicio, fecha_fin);


-- ============================================================
-- TABLA: sesiones
-- Instancias reales de clases por fecha (generadas desde clases)
-- ============================================================
CREATE TABLE sesiones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clase_id    INTEGER NOT NULL REFERENCES clases(id),
    fecha       DATE NOT NULL,
    cancelada   BOOLEAN DEFAULT FALSE,
    notas       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clase_id, fecha)
);

CREATE INDEX idx_sesiones_fecha    ON sesiones(fecha);
CREATE INDEX idx_sesiones_clase    ON sesiones(clase_id);


-- ============================================================
-- TABLA: asistencia
-- Registro de asistencia por alumno y sesión
-- ============================================================
CREATE TABLE asistencia (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sesion_id       UUID NOT NULL REFERENCES sesiones(id),
    alumno_id       UUID NOT NULL REFERENCES alumnos(id),
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('asistio', 'falta', 'justificado', 'pendiente')),
    registrado_por  UUID REFERENCES usuarios(id),  -- quién registró la asistencia
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sesion_id, alumno_id)
);

CREATE INDEX idx_asistencia_sesion ON asistencia(sesion_id);
CREATE INDEX idx_asistencia_alumno ON asistencia(alumno_id);


-- ============================================================
-- TABLA: reservaciones
-- Reservas de alumnos para sesiones específicas
-- ============================================================
CREATE TABLE reservaciones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id       UUID NOT NULL REFERENCES alumnos(id),
    sesion_id       UUID NOT NULL REFERENCES sesiones(id),
    estado          VARCHAR(20) DEFAULT 'confirmada'
                    CHECK (estado IN ('confirmada', 'cancelada', 'lista_espera')),
    fecha_reserva   TIMESTAMPTZ DEFAULT NOW(),
    notas           TEXT,
    UNIQUE(alumno_id, sesion_id)
);

CREATE INDEX idx_reservaciones_alumno ON reservaciones(alumno_id);
CREATE INDEX idx_reservaciones_sesion ON reservaciones(sesion_id);


-- ============================================================
-- TABLA: pagos
-- Registro de pagos de mensualidades e individuales
-- ============================================================
CREATE TABLE pagos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inscripcion_id      UUID NOT NULL REFERENCES inscripciones(id),
    alumno_id           UUID NOT NULL REFERENCES alumnos(id),
    monto               NUMERIC(10,2) NOT NULL,
    metodo_pago         VARCHAR(30) CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
    estado              VARCHAR(20) DEFAULT 'pendiente'
                        CHECK (estado IN ('pagado', 'pendiente', 'vencido', 'reembolsado')),
    periodo_inicio      DATE NOT NULL,   -- mes que cubre este pago
    periodo_fin         DATE NOT NULL,
    fecha_pago          TIMESTAMPTZ,     -- cuándo se recibió el pago
    referencia          VARCHAR(100),    -- número de transferencia o referencia
    registrado_por      UUID REFERENCES usuarios(id),
    notas               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pagos_alumno     ON pagos(alumno_id);
CREATE INDEX idx_pagos_estado     ON pagos(estado);
CREATE INDEX idx_pagos_periodo    ON pagos(periodo_inicio);


-- ============================================================
-- TABLA: fichas_tecnicas
-- Evaluación técnica/física/táctica del jugador (5-10)
-- ============================================================
CREATE TABLE fichas_tecnicas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id       UUID NOT NULL UNIQUE REFERENCES alumnos(id) ON DELETE CASCADE,
    -- Golpes básicos (5.0 - 10.0)
    derecha         NUMERIC(3,1) DEFAULT 7.0,
    reves           NUMERIC(3,1) DEFAULT 7.0,
    saque           NUMERIC(3,1) DEFAULT 7.0,
    volea           NUMERIC(3,1) DEFAULT 7.0,
    smash           NUMERIC(3,1) DEFAULT 7.0,
    dejada          NUMERIC(3,1) DEFAULT 7.0,
    globo           NUMERIC(3,1) DEFAULT 7.0,
    devolucion      NUMERIC(3,1) DEFAULT 7.0,
    -- Cualidades físicas (5.0 - 10.0)
    velocidad       NUMERIC(3,1) DEFAULT 7.0,
    resistencia     NUMERIC(3,1) DEFAULT 7.0,
    fuerza          NUMERIC(3,1) DEFAULT 7.0,
    coordinacion    NUMERIC(3,1) DEFAULT 7.0,
    flexibilidad    NUMERIC(3,1) DEFAULT 7.0,
    agilidad        NUMERIC(3,1) DEFAULT 7.0,
    equilibrio      NUMERIC(3,1) DEFAULT 7.0,
    -- Táctico / mental (5.0 - 10.0)
    tactica         NUMERIC(3,1) DEFAULT 7.0,
    mental          NUMERIC(3,1) DEFAULT 7.0,
    consistencia    NUMERIC(3,1) DEFAULT 7.0,
    -- Notas generales
    notas_generales TEXT,
    actualizado_por UUID REFERENCES usuarios(id),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fichas_alumno ON fichas_tecnicas(alumno_id);

-- ============================================================
-- TABLA: feedback_coach
-- Comentarios/retroalimentación de instructores hacia alumnos
-- ============================================================
CREATE TABLE feedback_coach (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id   UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    autor_id    UUID NOT NULL REFERENCES usuarios(id),
    texto       TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_alumno ON feedback_coach(alumno_id);
CREATE INDEX idx_feedback_fecha  ON feedback_coach(created_at);

-- ============================================================
-- ALTER: pagos — agregar columna de comprobante adjunto
-- ============================================================
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS comprobante_url TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS comprobante_nombre VARCHAR(255);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS comprobante_subido_en TIMESTAMPTZ;


CREATE VIEW resumen_alumnos AS
SELECT
    u.id AS usuario_id,
    u.nombre || ' ' || u.apellido AS nombre_completo,
    u.email,
    u.telefono,
    n.nombre AS nivel,
    a.tipo,
    p.nombre AS paquete_activo,
    p.precio_total AS costo_mensual,
    g.nombre AS grupo,
    i.fecha_inicio,
    i.fecha_fin,
    i.estado AS estado_inscripcion,
    COALESCE(
        (SELECT pa.estado FROM pagos pa
         WHERE pa.alumno_id = a.id
         ORDER BY pa.created_at DESC LIMIT 1),
        'sin_pago'
    ) AS ultimo_pago_estado
FROM usuarios u
JOIN alumnos a         ON a.usuario_id = u.id
LEFT JOIN niveles n    ON n.id = a.nivel_id
LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'activa'
LEFT JOIN paquetes p   ON p.id = i.paquete_id
LEFT JOIN grupos g     ON g.id = i.grupo_id
WHERE u.rol_id = 3  -- solo alumnos
ORDER BY u.apellido, u.nombre;


-- ============================================================
-- VISTA: horario_semanal
-- Vista del horario de la semana por grupo y día
-- ============================================================
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


-- ============================================================
-- FUNCIÓN: vencer_inscripciones
-- Actualiza automáticamente inscripciones vencidas
-- ============================================================
CREATE OR REPLACE FUNCTION vencer_inscripciones()
RETURNS void AS $$
BEGIN
    UPDATE inscripciones
    SET estado = 'vencida'
    WHERE estado = 'activa'
      AND fecha_fin < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Trigger automático (opcional si usas pg_cron o un cron job externo)
-- SELECT vencer_inscripciones(); -- ejecutar diariamente


-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
