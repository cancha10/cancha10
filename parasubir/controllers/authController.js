const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../config/database');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    const result = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.rol_id, u.activo, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const usuario = result.rows[0];
    if (!usuario.activo) return res.status(403).json({ error: 'Cuenta inactiva' });
    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, rol: usuario.rol } });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const registrar = async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, rol_id } = req.body;
    if (!nombre || !apellido || !email || !password) return res.status(400).json({ error: 'Datos incompletos' });
    const existe = await query('SELECT id FROM usuarios WHERE email=$1', [email.toLowerCase()]);
    if (existe.rows.length) return res.status(409).json({ error: 'Email ya registrado' });
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO usuarios (nombre,apellido,email,password_hash,telefono,rol_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,nombre,apellido,email,rol_id',
      [nombre, apellido, email.toLowerCase(), hash, telefono||null, rol_id||3]
    );
    res.status(201).json({ mensaje: 'Usuario creado', usuario: result.rows[0] });
  } catch (err) {
    console.error('Error registrando:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const perfil = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, r.nombre AS rol,
              a.id AS alumno_id, a.tipo_clase, n.nombre AS nivel
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       LEFT JOIN alumnos a ON a.usuario_id = u.id
       LEFT JOIN niveles n ON n.id = a.nivel_id WHERE u.id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en perfil:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    if (!password_actual || !password_nuevo) return res.status(400).json({ error: 'Ambas contraseñas requeridas' });
    if (password_nuevo.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });
    const u = await query('SELECT password_hash FROM usuarios WHERE id=$1', [req.user.id]);
    const ok = await bcrypt.compare(password_actual, u.rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(password_nuevo, 12);
    await query('UPDATE usuarios SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error('Error cambiando contraseña:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const inscripcionPublica = async (req, res) => {
  const client = await pool.connect();
  try {
    const { nombre, apellido, email, password, telefono, tipo_clase, nivel_id, grupo_id, paquete_id, dia_pago } = req.body;
    if (!nombre || !apellido || !email || !password) return res.status(400).json({ error: 'Datos incompletos' });
    const existe = await query('SELECT id FROM usuarios WHERE email=$1', [email.toLowerCase()]);
    if (existe.rows.length) return res.status(409).json({ error: 'Email ya registrado' });
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 12);
    const usuarioRes = await client.query(
      'INSERT INTO usuarios (nombre,apellido,email,password_hash,telefono,rol_id) VALUES ($1,$2,$3,$4,$5,3) RETURNING id',
      [nombre.trim(), apellido.trim(), email.toLowerCase().trim(), hash, telefono||null]
    );
    const usuarioId = usuarioRes.rows[0].id;
    const alumnoRes = await client.query(
      'INSERT INTO alumnos (usuario_id, nivel_id, tipo_clase) VALUES ($1,$2,$3) RETURNING id',
      [usuarioId, nivel_id||null, tipo_clase||'grupal']
    );
    const alumnoId = alumnoRes.rows[0].id;
    await client.query('INSERT INTO fichas_tecnicas (alumno_id) VALUES ($1)', [alumnoId]);
    if (grupo_id || paquete_id) {
      await client.query(
        'INSERT INTO inscripciones (alumno_id, grupo_id, paquete_id, dia_pago) VALUES ($1,$2,$3,$4)',
        [alumnoId, grupo_id||null, paquete_id||null, dia_pago||null]
      );
    }
    await client.query('COMMIT');
    const token = jwt.sign({ id: usuarioId, rol_id: 3 }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ mensaje: '¡Bienvenido a Cancha 10!', token, usuario: { id: usuarioId, nombre, apellido, email, rol: 'alumno' } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en inscripción pública:', err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
};

const resetearPassword = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const temp = 'C10-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const hash = await bcrypt.hash(temp, 12);
    const result = await query('UPDATE usuarios SET password_hash=$1 WHERE id=$2 RETURNING id,nombre,apellido', [hash, usuarioId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Contraseña restablecida', password_temporal: temp, usuario: result.rows[0] });
  } catch (err) {
    console.error('Error restableciendo contraseña:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { login, registrar, perfil, cambiarPassword, inscripcionPublica, resetearPassword };
