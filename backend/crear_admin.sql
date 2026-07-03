-- ============================================================
-- Crear usuario administrador real para Roca
-- Email: admin@cancha10.mx
-- Contraseña temporal: CambiaEstaClave2026
-- IMPORTANTE: Cambia la contraseña después de tu primer login
-- ============================================================

INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol_id, activo)
VALUES (
  'Roberto',
  'Estrada',
  'admin@cancha10.mx',
  '$2a$12$.ODF3StxIqh3gWe5Bujsoe8.k7G.NKCkSjs6vmGTMh2p1V8SDsQr2',
  '5532226765',
  1,  -- rol admin
  TRUE
);
