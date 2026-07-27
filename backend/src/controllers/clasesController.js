const { query } = require("../config/database");

const horario = async (req, res) => {
  try {
    const result = await query("SELECT * FROM horario_semanal");
    res.json(result.rows);
  } catch (err) {
    console.error("Error en horario:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const sesionesDelDia = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ error: "fecha requerida" });
    const diaMap = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
    const diaSemana = diaMap[new Date(fecha + "T12:00:00").getDay()];
    const clases = await query(
      `SELECT c.id AS clase_id, c.hora_inicio, c.hora_fin, g.id AS grupo_id, g.nombre AS grupo, g.tipo, g.capacidad, n.nombre AS nivel
       FROM clases c JOIN grupos g ON g.id = c.grupo_id AND g.activo = TRUE
       LEFT JOIN niveles n ON n.id = g.nivel_id
       WHERE c.dia_semana = $1 AND c.activo = TRUE ORDER BY c.hora_inicio`,
      [diaSemana],
    );
    const sesiones = [];
    for (const c of clases.rows) {
      let sesion = await query(
        "SELECT id FROM sesiones WHERE clase_id=$1 AND fecha=$2",
        [c.clase_id, fecha],
      );
      if (!sesion.rows.length)
        sesion = await query(
          "INSERT INTO sesiones (clase_id, fecha) VALUES ($1,$2) RETURNING id",
          [c.clase_id, fecha],
        );
      const sesionId = sesion.rows[0].id;
      const inscritos = await query(
        `SELECT COUNT(*) AS total FROM inscripciones WHERE grupo_id=$1 AND estado='activa'`,
        [c.grupo_id],
      );
      sesiones.push({
        id: sesionId,
        clase_id: c.clase_id,
        grupo_id: c.grupo_id,
        grupo: c.grupo,
        tipo: c.tipo,
        nivel: c.nivel,
        capacidad: c.capacidad,
        hora_inicio: c.hora_inicio,
        hora_fin: c.hora_fin,
        reservas: parseInt(inscritos.rows[0].total),
      });
    }
    res.json(sesiones);
  } catch (err) {
    console.error("Error en sesiones del día:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const alumnosDeSesion = async (req, res) => {
  try {
    const { sesionId } = req.params;
    const sesionInfo = await query(
      `SELECT g.id AS grupo_id FROM sesiones s JOIN clases c ON c.id = s.clase_id JOIN grupos g ON g.id = c.grupo_id WHERE s.id = $1`,
      [sesionId],
    );
    if (!sesionInfo.rows.length)
      return res.status(404).json({ error: "Sesión no encontrada" });
    const grupoId = sesionInfo.rows[0].grupo_id;
    const result = await query(
      `SELECT u.id AS usuario_id, u.nombre, u.apellido, u.telefono, a.id AS alumno_id, n.nombre AS nivel, ast.estado AS asistencia_estado
       FROM inscripciones i JOIN alumnos a ON a.id = i.alumno_id JOIN usuarios u ON u.id = a.usuario_id
       LEFT JOIN niveles n ON n.id = a.nivel_id
       LEFT JOIN asistencia ast ON ast.sesion_id=$1 AND ast.alumno_id=a.id
       WHERE i.grupo_id=$2 AND i.estado='activa' ORDER BY u.apellido, u.nombre`,
      [sesionId, grupoId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error en alumnos de sesión:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const registrarAsistencia = async (req, res) => {
  try {
    const { sesionId } = req.params;
    const { asistencias } = req.body;

    if (!Array.isArray(asistencias)) {
      return res.status(400).json({ error: "asistencias debe ser array" });
    }

    await query("BEGIN");

    for (const a of asistencias) {
      const asistenciaResult = await query(
        `INSERT INTO asistencia (sesion_id, alumno_id, estado)
         VALUES ($1, $2, $3)
         ON CONFLICT (sesion_id, alumno_id)
         DO UPDATE SET estado = EXCLUDED.estado
         RETURNING id, alumno_id, estado`,
        [sesionId, a.alumno_id, a.estado],
      );

      const asistencia = asistenciaResult.rows[0];

      if (asistencia.estado === "falta") {
        await query(
          `INSERT INTO reposiciones (
             alumno_id,
             asistencia_id,
             estado
           )
           VALUES ($1, $2, 'pendiente')
           ON CONFLICT (asistencia_id)
           DO UPDATE SET
             estado = 'pendiente',
             fecha_utilizada = NULL`,
          [asistencia.alumno_id, asistencia.id],
        );
      }

      if (asistencia.estado === "asistio") {
        await query(
          `UPDATE reposiciones
           SET estado = 'cancelada'
           WHERE asistencia_id = $1
             AND estado = 'pendiente'`,
          [asistencia.id],
        );
      }
    }

    await query("COMMIT");

    res.json({
      mensaje: "Asistencia registrada y reposiciones actualizadas",
    });
  } catch (err) {
    try {
      await query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Error haciendo rollback:", rollbackErr);
    }

    console.error("Error registrando asistencia:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const crearClase = async (req, res) => {
  try {
    const { grupo, dias, hi, hf, tipo, nivel_id, capacidad } = req.body;
    if (!grupo || !dias?.length || !hi || !hf)
      return res.status(400).json({ error: "grupo, dias, hi y hf requeridos" });
    const grupoRes = await query(
      "INSERT INTO grupos (nombre, nivel_id, tipo, capacidad) VALUES ($1,$2,$3,$4) RETURNING id",
      [
        grupo,
        nivel_id || null,
        tipo === "Particular" ? "particular" : "grupal",
        capacidad || null,
      ],
    );
    const grupoId = grupoRes.rows[0].id;
    for (const dia of dias)
      await query(
        "INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES ($1,$2,$3,$4)",
        [grupoId, dia, hi, hf],
      );
    res.status(201).json({ mensaje: "Clase creada", grupo_id: grupoId });
  } catch (err) {
    console.error("Error creando clase:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const editarClase = async (req, res) => {
  try {
    const { grupoId } = req.params;
    const { grupo, dias, hi, hf, tipo, nivel_id, capacidad } = req.body;
    await query(
      "UPDATE grupos SET nombre=$1, nivel_id=$2, tipo=$3, capacidad=$4 WHERE id=$5",
      [grupo, nivel_id || null, tipo || "grupal", capacidad || null, grupoId],
    );
    await query("UPDATE clases SET activo=FALSE WHERE grupo_id=$1", [grupoId]);
    for (const dia of dias)
      await query(
        "INSERT INTO clases (grupo_id, dia_semana, hora_inicio, hora_fin) VALUES ($1,$2,$3,$4)",
        [grupoId, dia, hi, hf],
      );
    res.json({ mensaje: "Clase actualizada" });
  } catch (err) {
    console.error("Error editando clase:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const eliminarClase = async (req, res) => {
  try {
    const { grupoId } = req.params;
    await query("UPDATE grupos SET activo=FALSE WHERE id=$1", [grupoId]);
    await query("UPDATE clases SET activo=FALSE WHERE grupo_id=$1", [grupoId]);
    res.json({ mensaje: "Clase eliminada" });
  } catch (err) {
    console.error("Error eliminando clase:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  horario,
  sesionesDelDia,
  alumnosDeSesion,
  registrarAsistencia,
  crearClase,
  editarClase,
  eliminarClase,
};
