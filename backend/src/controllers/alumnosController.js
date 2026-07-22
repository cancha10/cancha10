const { query } = require("../config/database");

const listarAlumnos = async (req, res) => {
  try {
    const result = await query("SELECT * FROM resumen_alumnos");
    res.json(result.rows);
  } catch (err) {
    console.error("Error listando alumnos:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const obtenerAlumno = async (req, res) => {
  try {
    const { id } = req.params;

    const alumno = await query(
      `SELECT *
       FROM resumen_alumnos
       WHERE usuario_id = $1`,
      [id],
    );

    if (!alumno.rows.length) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    const historial = await query(
      `SELECT *
       FROM pagos
       WHERE alumno_id = (
         SELECT id
         FROM alumnos
         WHERE usuario_id = $1
       )
       ORDER BY created_at DESC`,
      [id],
    );

    const inscripcion = await query(
      `SELECT *
       FROM inscripciones i
       WHERE i.alumno_id = (
         SELECT id
         FROM alumnos
         WHERE usuario_id = $1
       )
       AND i.estado = 'activa'
       LIMIT 1`,
      [id],
    );

    let estadoPago = "sin_inscripcion";
    let fechaVencimiento = null;
    let dias = null;

    if (inscripcion.rows.length) {
      const ultimoPago = historial.rows.find(
        (pago) => pago.estado === "pagado" && pago.periodo_fin,
      );

      if (!ultimoPago) {
        estadoPago = "sin_pago";
      } else {
        fechaVencimiento = ultimoPago.periodo_fin;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const vence = new Date(fechaVencimiento);
        vence.setHours(0, 0, 0, 0);

        const diferenciaMs = vence.getTime() - hoy.getTime();

        dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

        if (dias >= 0) {
          estadoPago = "al_corriente";
        } else {
          estadoPago = "atrasado";
          dias = Math.abs(dias);
        }
      }
    }

    res.json({
      ...alumno.rows[0],
      historial_pagos: historial.rows,
      inscripcion: inscripcion.rows[0] || null,
      estado_pago: estadoPago,
      fecha_vencimiento: fechaVencimiento,
      dias_estado: dias,
    });
  } catch (err) {
    console.error("Error obteniendo alumno:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};
const actualizarAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, nivel_id, tipo_clase, notas } =
      req.body;
    if (nombre || apellido || telefono) {
      await query(
        "UPDATE usuarios SET nombre=COALESCE($1,nombre), apellido=COALESCE($2,apellido), telefono=COALESCE($3,telefono) WHERE id=$4",
        [nombre, apellido, telefono, id],
      );
    }
    if (nivel_id || tipo_clase || notas !== undefined) {
      await query(
        "UPDATE alumnos SET nivel_id=COALESCE($1,nivel_id), tipo_clase=COALESCE($2,tipo_clase), notas=COALESCE($3,notas) WHERE usuario_id=$4",
        [nivel_id, tipo_clase, notas, id],
      );
    }
    res.json({ mensaje: "Alumno actualizado" });
  } catch (err) {
    console.error("Error actualizando alumno:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const eliminarAlumno = async (req, res) => {
  try {
    const result = await query(
      "DELETE FROM usuarios WHERE id=$1 RETURNING id",
      [req.params.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Alumno no encontrado" });
    res.json({ mensaje: "Alumno eliminado" });
  } catch (err) {
    console.error("Error eliminando alumno:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const obtenerFicha = async (req, res) => {
  try {
    const { id } = req.params;
    const alumnoRes = await query(
      "SELECT id FROM alumnos WHERE usuario_id=$1",
      [id],
    );
    if (!alumnoRes.rows.length)
      return res.status(404).json({ error: "Alumno no encontrado" });
    const alumnoId = alumnoRes.rows[0].id;
    let ficha = await query(
      "SELECT * FROM fichas_tecnicas WHERE alumno_id=$1",
      [alumnoId],
    );
    if (!ficha.rows.length)
      ficha = await query(
        "INSERT INTO fichas_tecnicas (alumno_id) VALUES ($1) RETURNING *",
        [alumnoId],
      );
    res.json(ficha.rows[0]);
  } catch (err) {
    console.error("Error obteniendo ficha:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const actualizarFicha = async (req, res) => {
  try {
    const { id } = req.params;
    const alumnoRes = await query(
      "SELECT id FROM alumnos WHERE usuario_id=$1",
      [id],
    );
    if (!alumnoRes.rows.length)
      return res.status(404).json({ error: "Alumno no encontrado" });
    const alumnoId = alumnoRes.rows[0].id;
    const campos = [
      "derecha",
      "reves",
      "saque",
      "volea",
      "smash",
      "dejada",
      "globo",
      "devolucion",
      "velocidad",
      "resistencia",
      "fuerza",
      "coordinacion",
      "flexibilidad",
      "agilidad",
      "equilibrio",
      "tactica",
      "mental",
      "consistencia",
      "notas_generales",
    ];
    const sets = [];
    const vals = [];
    let i = 1;
    for (const c of campos) {
      if (req.body[c] !== undefined) {
        sets.push(`${c}=$${i++}`);
        vals.push(req.body[c]);
      }
    }
    if (!sets.length) return res.status(400).json({ error: "Sin campos" });
    sets.push(`actualizado_por=$${i++}`);
    vals.push(req.user.id);
    sets.push("updated_at=NOW()");
    vals.push(alumnoId);
    await query(
      `UPDATE fichas_tecnicas SET ${sets.join(",")} WHERE alumno_id=$${i} RETURNING *`,
      vals,
    );
    res.json({ mensaje: "Ficha actualizada" });
  } catch (err) {
    console.error("Error actualizando ficha:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const listarFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const alumnoRes = await query(
      "SELECT id FROM alumnos WHERE usuario_id=$1",
      [id],
    );
    if (!alumnoRes.rows.length)
      return res.status(404).json({ error: "Alumno no encontrado" });
    const result = await query(
      `SELECT f.*, u.nombre||' '||u.apellido AS autor FROM feedback_coach f JOIN usuarios u ON u.id=f.autor_id WHERE f.alumno_id=$1 ORDER BY f.created_at DESC`,
      [alumnoRes.rows[0].id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error listando feedback:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const agregarFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    if (!texto?.trim())
      return res.status(400).json({ error: "Texto requerido" });
    const alumnoRes = await query(
      "SELECT id FROM alumnos WHERE usuario_id=$1",
      [id],
    );
    if (!alumnoRes.rows.length)
      return res.status(404).json({ error: "Alumno no encontrado" });
    const result = await query(
      "INSERT INTO feedback_coach (alumno_id, autor_id, texto) VALUES ($1,$2,$3) RETURNING *",
      [alumnoRes.rows[0].id, req.user.id, texto.trim()],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error agregando feedback:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};
const asistenciaAlumno = async (req, res) => {
  try {
    const { id } = req.params;

    const alumno = await query(
      `
      SELECT id
      FROM alumnos
      WHERE usuario_id = $1
      `,
      [id],
    );

    if (!alumno.rows.length) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    const alumnoId = alumno.rows[0].id;

    const historial = await query(
      `
      SELECT
        s.fecha,
        a.estado,
        c.id AS clase_id
      FROM asistencia a
      INNER JOIN sesiones s
        ON s.id = a.sesion_id
      INNER JOIN clases c
        ON c.id = s.clase_id
      WHERE a.alumno_id = $1
      ORDER BY s.fecha DESC
      `,
      [alumnoId],
    );

    res.json(historial.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  }
};
module.exports = {
  listarAlumnos,
  obtenerAlumno,
  actualizarAlumno,
  eliminarAlumno,
  obtenerFicha,
  actualizarFicha,
  listarFeedback,
  agregarFeedback,
  asistenciaAlumno,
};
