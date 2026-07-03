-- ============================================================
-- CANCHA 10 — ESQUEMA COMPLETO v3 (desde cero)
-- Academia de Tenis · Cancún · Junio 2026
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP VIEW IF EXISTS resumen_alumnos CASCADE;
DROP VIEW IF EXISTS horario_semanal CASCADE;
DROP VIEW IF EXISTS proximos_pagos CASCADE;

DROP TABLE IF EXISTS gastos CASCADE;
DROP TABLE IF EXISTS feedback_coach CASCADE;
DROP TABLE IF EXISTS fichas_tecnicas CASCADE;
DROP TABLE IF EXISTS asistencia CASCADE;
DROP TABLE IF EXISTS reservaciones CASCADE;
DROP TABLE IF EXISTS sesiones CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS inscripciones CASCADE;
DROP TABLE IF EXISTS clases CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS paquetes CASCADE;
DROP TABLE IF EXISTS alumnos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS niveles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO roles (nombre) VALUES ('admin'), ('instructor'), ('alumno');

CREATE TABLE niveles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO niveles (nombre) VALUES ('principiante'), ('intermedio'), ('avanzado');

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    telefono VARCHAR(20),
    rol_id INTEGER NOT NULL REFERENCES roles(id) DEFAULT 3,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alumnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nivel_id INTEGER REFERENCES niveles(id),
    tipo_clase VARCHAR(20) NOT NULL DEFAULT 'grupal' CHECK (tipo_clase IN ('grupal', 'particular')),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE paquetes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('grupal', 'particular')),
    clases_semana INTEGER,
    precio_mensual NUMERIC(10,2),
    precio_clase NUMERIC(10,2),
    precio_cancha NUMERIC(10,2),
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO paquetes (nombre, tipo, clases_semana, precio_mensual, descripcion) VALUES
    ('Grupal 1 día/semana', 'grupal', 1, 900.00, '1 clase grupal por semana'),
    ('Grupal 2 días/semana', 'grupal', 2, 1600.00, '2 clases grupales por semana'),
    ('Grupal 3 días/semana', 'grupal', 3, 2200.00, '3 clases grupales por semana'),
    ('Grupal 4 días/semana', 'grupal', 4, 3000.00, '4 clases grupales por semana'),
    ('Grupal 5 días/semana', 'grupal', 5, 3800.00, '5 clases grupales por semana');

INSERT INTO paquetes (nombre, tipo, precio_clase, precio_cancha, descripcion) VALUES
    ('Particular 1 clase/semana', 'particular', 750.00, 0, 'Clase particular, 1 vez por semana'),
    ('Particular 2 clases/semana', 'particular', 700.00, 0, 'Clase particular, 2 veces por semana'),
    ('Particular 3+ clases/semana', 'particular', 650.00, 0, 'Clase particular, 3 o más veces por semana');

CREATE TABLE grupos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nivel_id INTEGER REFERENCES niveles(id),
    tipo VARCHAR(20) NOT NULL DEFAULT 'grupal' CHECK (tipo IN ('grupal', 'particular')),
    capacidad INTEGER,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO grupos (nombre, nivel_id, tipo, capacidad) VALUES
    ('Niños Principiantes', (SELECT id FROM niveles WHERE nombre='principiante'), 'grupal', NULL),
    ('Niños Intermedios', (SELECT id FROM niveles WHERE nombre='intermedio'), 'grupal', NULL),
    ('Mujeres Principiantes', (SELECT id FROM niveles WHERE nombre='principiante'), 'grupal', NULL),
    ('Adultos Intermedios/Avanzados Lun-Mié', (SELECT id FROM niveles WHERE nombre='intermedio'), 'grupal', NULL),
    ('Adultos Intermedios/Avanzados Mar-Jue', (SELECT id FROM niveles WHERE nombre='intermedio'), 'grupal', NULL),
    ('Adultos Avanzados Viernes', (SELECT id FROM niveles WHERE nombre='avanzado'), 'grupal', NULL),
    ('Clase Particular', NULL, 'particular', 1);

CREATE TABLE clases (
    id SERIAL PRIMARY KEY,
    grupo_id INTEGER NOT NULL REFERENCES grupos(id),
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 1, '17:00', '18:00' FROM grupos WHERE nombre='Niños Principiantes';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 3, '17:00', '18:00' FROM grupos WHERE nombre='Niños Principiantes';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 2, '17:00', '18:00' FROM grupos WHERE nombre='Niños Intermedios';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 4, '17:00', '18:00' FROM grupos WHERE nombre='Niños Intermedios';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 1, '18:00', '19:00' FROM grupos WHERE nombre='Mujeres Principiantes';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 3, '18:00', '19:00' FROM grupos WHERE nombre='Mujeres Principiantes';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 1, '18:00', '19:00' FROM grupos WHERE nombre='Adultos Intermedios/Avanzados Lun-Mié';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 3, '18:00', '19:00' FROM grupos WHERE nombre='Adultos Intermedios/Avanzados Lun-Mié';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 2, '19:00', '20:00' FROM grupos WHERE nombre='Adultos Intermedios/Avanzados Mar-Jue';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 4, '19:00', '20:00' FROM grupos WHERE nombre='Adultos Intermedios/Avanzados Mar-Jue';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 5, '19:00', '20:00' FROM grupos WHERE nombre='Adultos Avanzados Viernes';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 1, '19:00', '20:00' FROM grupos WHERE nombre='Clase Particular';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 3, '19:00', '20:00' FROM grupos WHERE nombre='Clase Particular';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 1, '20:00', '21:00' FROM grupos WHERE nombre='Clase Particular';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 2, '20:00', '21:00' FROM grupos WHERE nombre='Clase Particular';
INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) SELECT id, 4, '20:00', '21:00' FROM grupos WHERE nombre='Clase Particular';

CREATE TABLE inscripciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    grupo_id INTEGER REFERENCES grupos(id),
    paquete_id INTEGER REFERENCES paquetes(id),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    dia_pago INTEGER CHECK (dia_pago BETWEEN 1 AND 31),
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'cancelada')),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clase_id INTEGER NOT NULL REFERENCES clases(id),
    fecha DATE NOT NULL,
    cancelada BOOLEAN DEFAULT FALSE,
    notas TEXT,
    UNIQUE (clase_id, fecha)
);

CREATE TABLE asistencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sesion_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('asistio', 'falta', 'justificada', 'pendiente')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (sesion_id, alumno_id)
);

CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    inscripcion_id UUID REFERENCES inscripciones(id),
    sesion_id UUID REFERENCES sesiones(id),
    tipo VARCHAR(20) NOT NULL DEFAULT 'mensual' CHECK (tipo IN ('mensual', 'por_sesion')),
    monto NUMERIC(10,2) NOT NULL,
    periodo_inicio DATE,
    periodo_fin DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'vencido', 'cancelado')),
    fecha_pago TIMESTAMPTZ,
    metodo_pago VARCHAR(50),
    comprobante_url TEXT,
    comprobante_nombre VARCHAR(255),
    comprobante_fecha TIMESTAMPTZ,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reservaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    sesion_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada', 'completada')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (alumno_id, sesion_id)
);

CREATE TABLE fichas_tecnicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID NOT NULL UNIQUE REFERENCES alumnos(id) ON DELETE CASCADE,
    derecha NUMERIC(3,1) DEFAULT 7.0 CHECK (derecha BETWEEN 5 AND 10),
    reves NUMERIC(3,1) DEFAULT 7.0 CHECK (reves BETWEEN 5 AND 10),
    saque NUMERIC(3,1) DEFAULT 7.0 CHECK (saque BETWEEN 5 AND 10),
    volea NUMERIC(3,1) DEFAULT 7.0 CHECK (volea BETWEEN 5 AND 10),
    smash NUMERIC(3,1) DEFAULT 7.0 CHECK (smash BETWEEN 5 AND 10),
    dejada NUMERIC(3,1) DEFAULT 7.0 CHECK (dejada BETWEEN 5 AND 10),
    globo NUMERIC(3,1) DEFAULT 7.0 CHECK (globo BETWEEN 5 AND 10),
    devolucion NUMERIC(3,1) DEFAULT 7.0 CHECK (devolucion BETWEEN 5 AND 10),
    velocidad NUMERIC(3,1) DEFAULT 7.0 CHECK (velocidad BETWEEN 5 AND 10),
    resistencia NUMERIC(3,1) DEFAULT 7.0 CHECK (resistencia BETWEEN 5 AND 10),
    fuerza NUMERIC(3,1) DEFAULT 7.0 CHECK (fuerza BETWEEN 5 AND 10),
    coordinacion NUMERIC(3,1) DEFAULT 7.0 CHECK (coordinacion BETWEEN 5 AND 10),
    flexibilidad NUMERIC(3,1) DEFAULT 7.0 CHECK (flexibilidad BETWEEN 5 AND 10),
    agilidad NUMERIC(3,1) DEFAULT 7.0 CHECK (agilidad BETWEEN 5 AND 10),
    equilibrio NUMERIC(3,1) DEFAULT 7.0 CHECK (equilibrio BETWEEN 5 AND 10),
    tactica NUMERIC(3,1) DEFAULT 7.0 CHECK (tactica BETWEEN 5 AND 10),
    mental NUMERIC(3,1) DEFAULT 7.0 CHECK (mental BETWEEN 5 AND 10),
    consistencia NUMERIC(3,1) DEFAULT 7.0 CHECK (consistencia BETWEEN 5 AND 10),
    notas_generales TEXT,
    actualizado_por UUID REFERENCES usuarios(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feedback_coach (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    autor_id UUID NOT NULL REFERENCES usuarios(id),
    texto TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gastos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concepto VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'otro' CHECK (categoria IN ('renta','nomina','mantenimiento','equipo','marketing','servicios','otro')),
    monto NUMERIC(10,2) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    notas TEXT,
    registrado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inscripciones_alumno ON inscripciones(alumno_id);
CREATE INDEX idx_inscripciones_grupo ON inscripciones(grupo_id);
CREATE INDEX idx_sesiones_clase_fecha ON sesiones(clase_id, fecha);
CREATE INDEX idx_asistencia_sesion ON asistencia(sesion_id);
CREATE INDEX idx_asistencia_alumno ON asistencia(alumno_id);
CREATE INDEX idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_feedback_alumno ON feedback_coach(alumno_id);
CREATE INDEX idx_gastos_fecha ON gastos(fecha);

CREATE VIEW horario_semanal AS
SELECT g.id AS grupo_id, g.nombre AS grupo, g.tipo, g.capacidad, n.nombre AS nivel,
    c.id AS clase_id, c.dia_semana,
    CASE c.dia_semana WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes' WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes' WHEN 6 THEN 'Sábado' WHEN 7 THEN 'Domingo' END AS dia,
    c.hora_inicio, c.hora_fin
FROM clases c JOIN grupos g ON g.id = c.grupo_id LEFT JOIN niveles n ON n.id = g.nivel_id
WHERE c.activo = TRUE AND g.activo = TRUE ORDER BY c.dia_semana, c.hora_inicio;

CREATE VIEW resumen_alumnos AS
SELECT u.id AS usuario_id, u.nombre || ' ' || u.apellido AS nombre_completo, u.email, u.telefono, u.activo,
    a.id AS alumno_id, a.tipo_clase, n.nombre AS nivel, g.nombre AS grupo, g.id AS grupo_id,
    p.id AS paquete_id, p.nombre AS paquete, p.tipo AS paquete_tipo, p.precio_mensual, p.precio_clase, p.precio_cancha,
    CASE p.tipo WHEN 'grupal' THEN p.precio_mensual WHEN 'particular' THEN COALESCE(p.precio_clase,0)+COALESCE(p.precio_cancha,0) END AS precio_sesion_o_mes,
    i.id AS inscripcion_id, i.fecha_inicio, i.dia_pago,
    COALESCE(i.dia_pago, EXTRACT(DAY FROM i.fecha_inicio)::INTEGER) AS dia_pago_efectivo,
    i.estado AS estado_inscripcion,
    COALESCE((SELECT pa.estado FROM pagos pa WHERE pa.alumno_id = a.id ORDER BY pa.created_at DESC LIMIT 1), 'sin_pago') AS ultimo_pago_estado
FROM usuarios u
JOIN alumnos a ON a.usuario_id = u.id
LEFT JOIN niveles n ON n.id = a.nivel_id
LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'activa'
LEFT JOIN paquetes p ON p.id = i.paquete_id
LEFT JOIN grupos g ON g.id = i.grupo_id
WHERE u.rol_id = 3
ORDER BY u.apellido, u.nombre;

INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol_id)
VALUES ('Roberto', 'Estrada', 'admin@cancha10.mx', '$2a$12$.ODF3StxIqh3gWe5Bujsoe8.k7G.NKCkSjs6vmGTMh2p1V8SDsQr2', '5532226765', 1);
