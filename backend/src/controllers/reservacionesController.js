const { query } = require('../config/database');

const crear = async (req, res) => {
  try {
    const { sesion_id } = req.body;
    const alumnoRes = await query('SELECT id FROM alumnos WHERE usuario_id=$1', [req.user.id]);
    if (!alumnoRes.rows.length) return res.status(404).json({ error: 'Alumno no encontrado' });
    const result = await query(
      'INSERT INTO reservaciones (alumno_id, sesion_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING *',
      [alumnoRes.rows[0].id, sesion_id]
    );
    res.status(201).json({ mensaje: 'Reserva creada', reserva: result.rows[0] });
  } catch (err) {
    console.error('Error creando reserva:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const cancelar = async (req, res) => {
  try {
    await query(`UPDATE reservaciones SET estado='cancelada' WHERE id=$1`, [req.params.id]);
    res.json({ mensaje: 'Reserva cancelada' });
  } catch (err) {
    console.error('Error cancelando reserva:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const misReservas = async (req, res) => {
  try {
    const alumnoRes = await query('SELECT id FROM alumnos WHERE usuario_id=$1', [req.user.id]);
    if (!alumnoRes.rows.length) return res.json([]);
    const result = await query(
      `SELECT r.id, s.fecha, c.hora_inicio, c.hora_fin, g.nombre AS grupo
       FROM reservaciones r
       JOIN sesiones s ON s.id = r.sesion_id
       JOIN clases c ON c.id = s.clase_id
       JOIN grupos g ON g.id = c.grupo_id
       WHERE r.alumno_id=$1 AND r.estado='confirmada' AND s.fecha >= CURRENT_DATE
       ORDER BY s.fecha, c.hora_inicio`,
      [alumnoRes.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listando mis reservas:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { crear, cancelar, misReservas };
