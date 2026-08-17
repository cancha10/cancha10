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
      return res.status(400).json({
        error: "asistencias debe ser array",
      });
    }

    await query("BEGIN");

    // Obtenemos la información de la sesión una sola vez
    const sesionResult = await query(
      `
      SELECT
        s.id,
        s.fecha,
        c.grupo_id,
        g.tipo AS tipo_grupo
      FROM sesiones s
      JOIN clases c
        ON c.id = s.clase_id
      JOIN grupos g
        ON g.id = c.grupo_id
      WHERE s.id = $1
      `,
      [sesionId],
    );

    if (!sesionResult.rows.length) {
      await query("ROLLBACK");
      return res.status(404).json({
        error: "Sesión no encontrada",
      });
    }

    const sesion = sesionResult.rows[0];

    for (const a of asistencias) {
      // Buscar la inscripción correspondiente al alumno y al grupo
      const inscripcionResult = await query(
        `
        SELECT id
        FROM inscripciones
        WHERE alumno_id = $1
          AND grupo_id = $2
          AND fecha_inicio <= $3::date
          AND (
            fecha_fin IS NULL
            OR fecha_fin >= $3::date
          )
        ORDER BY fecha_inicio DESC
        LIMIT 1
        `,
        [a.alumno_id, sesion.grupo_id, sesion.fecha],
      );

      const inscripcionId =
        inscripcionResult.rows.length > 0 ? inscripcionResult.rows[0].id : null;

      // Registrar o actualizar asistencia
      const asistenciaResult = await query(
        `
        INSERT INTO asistencia (
          sesion_id,
          alumno_id,
          estado,
          inscripcion_id,
          tipo
        )
        VALUES ($1, $2, $3, $4, 'regular')

        ON CONFLICT (sesion_id, alumno_id)
        DO UPDATE SET
          estado = EXCLUDED.estado,
          inscripcion_id = EXCLUDED.inscripcion_id

        RETURNING
          id,
          alumno_id,
          estado,
          inscripcion_id
        `,
        [sesionId, a.alumno_id, a.estado, inscripcionId],
      );

      const asistencia = asistenciaResult.rows[0];

      // =====================================================
      // FALTA EN GRUPO = CREA REPOSICIÓN
      // =====================================================

      if (
        asistencia.estado === "falta" &&
        sesion.tipo_grupo === "grupal" &&
        asistencia.inscripcion_id
      ) {
        await query(
          `
          INSERT INTO reposiciones (
            alumno_id,
            asistencia_id,
            inscripcion_id,
            estado,
            fecha_generada,
            fecha_vencimiento
          )
          VALUES (
            $1,
            $2,
            $3,
            'pendiente',
            $4::date,
            $4::date + INTERVAL '30 days'
          )

          ON CONFLICT (asistencia_id)
          DO UPDATE SET
            estado = 'pendiente',
            inscripcion_id = EXCLUDED.inscripcion_id,
            fecha_generada = EXCLUDED.fecha_generada,
            fecha_vencimiento = EXCLUDED.fecha_vencimiento,
            fecha_utilizada = NULL,
            asistencia_uso_id = NULL
          `,
          [
            asistencia.alumno_id,
            asistencia.id,
            asistencia.inscripcion_id,
            sesion.fecha,
          ],
        );
      }

      // =====================================================
      // FALTA PARTICULAR = NO GENERA REPOSICIÓN
      // =====================================================

      if (asistencia.estado === "falta" && sesion.tipo_grupo === "particular") {
        await query(
          `
          UPDATE reposiciones
          SET estado = 'cancelada'
          WHERE asistencia_id = $1
            AND estado = 'pendiente'
          `,
          [asistencia.id],
        );
      }

      // =====================================================
      // SI UNA FALTA SE CORRIGE A ASISTIÓ
      // CANCELAMOS LA REPOSICIÓN QUE HABÍA GENERADO
      // =====================================================

      if (asistencia.estado === "asistio") {
        await query(
          `
          UPDATE reposiciones
          SET estado = 'cancelada'
          WHERE asistencia_id = $1
            AND estado = 'pendiente'
          `,
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
    } catch (rollbackError) {
      console.error("Error haciendo rollback:", rollbackError);
    }

    console.error("Error registrando asistencia:", err);

    res.status(500).json({
      error: "Error del servidor",
    });
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
const suspenderSesion = async (req, res) => {
  try {
    const { sesionId } = req.params;
    const { motivo } = req.body;

    if (!motivo || !motivo.trim()) {
      return res.status(400).json({
        error: "El motivo de suspensión es obligatorio",
      });
    }

    await query("BEGIN");

    const sesionResult = await query(
      `
      SELECT
        s.id,
        s.fecha,
        s.cancelada,
        c.grupo_id
      FROM sesiones s
      JOIN clases c ON c.id = s.clase_id
      WHERE s.id = $1
      FOR UPDATE
      `,
      [sesionId],
    );

    if (!sesionResult.rows.length) {
      await query("ROLLBACK");
      return res.status(404).json({
        error: "Sesión no encontrada",
      });
    }

    const sesion = sesionResult.rows[0];

    if (sesion.cancelada) {
      await query("ROLLBACK");
      return res.status(409).json({
        error: "La sesión ya está suspendida",
      });
    }

    await query(
      `
      UPDATE sesiones
      SET
        cancelada = TRUE,
        notas = $2
      WHERE id = $1
      `,
      [sesionId, `Suspensión: ${motivo.trim()}`],
    );

    const inscripcionesResult = await query(
      `
      SELECT
        i.id AS inscripcion_id,
        i.alumno_id
      FROM inscripciones i
      WHERE i.grupo_id = $1
        AND i.estado = 'activa'
      `,
      [sesion.grupo_id],
    );

    for (const inscripcion of inscripcionesResult.rows) {
      const existente = await query(
        `
        SELECT id
        FROM reposiciones
        WHERE inscripcion_id = $1
          AND alumno_id = $2
          AND asistencia_id IS NULL
          AND fecha_generada = $3
          AND estado = 'pendiente'
        LIMIT 1
        `,
        [inscripcion.inscripcion_id, inscripcion.alumno_id, sesion.fecha],
      );

      if (!existente.rows.length) {
        await query(
          `
          INSERT INTO reposiciones (
            alumno_id,
            asistencia_id,
            inscripcion_id,
            estado,
            fecha_generada,
            fecha_vencimiento,
            notas
          )
          VALUES (
            $1,
            NULL,
            $2,
            'pendiente',
            $3::date,
            $3::date + INTERVAL '30 days',
            $4
          )
          `,
          [
            inscripcion.alumno_id,
            inscripcion.inscripcion_id,
            sesion.fecha,
            `Reposición por suspensión: ${motivo.trim()}`,
          ],
        );
      }
    }

    await query("COMMIT");

    res.json({
      mensaje: "Sesión suspendida y reposiciones generadas",
      reposiciones_generadas: inscripcionesResult.rows.length,
    });
  } catch (err) {
    try {
      await query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error haciendo rollback:", rollbackError);
    }

    console.error("Error suspendiendo sesión:", err);

    res.status(500).json({
      error: "Error del servidor",
    });
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
  suspenderSesion,
};
