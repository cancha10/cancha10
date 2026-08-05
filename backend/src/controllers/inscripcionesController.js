const { query } = require("../config/database");

const listar = async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.nombre||' '||u.apellido AS alumno, p.nombre AS paquete, g.nombre AS grupo
       FROM inscripciones i JOIN alumnos a ON a.id = i.alumno_id JOIN usuarios u ON u.id = a.usuario_id
       LEFT JOIN paquetes p ON p.id = i.paquete_id LEFT JOIN grupos g ON g.id = i.grupo_id
       WHERE i.estado = 'activa' ORDER BY u.apellido, u.nombre`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error listando inscripciones:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const crear = async (req, res) => {
  try {
    const { alumno_id, grupo_id, paquete_id, fecha_inicio, dia_pago } =
      req.body;
    if (!alumno_id)
      return res.status(400).json({ error: "alumno_id requerido" });
    const result = await query(
      `INSERT INTO inscripciones (alumno_id, grupo_id, paquete_id, fecha_inicio, dia_pago) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        alumno_id,
        grupo_id || null,
        paquete_id || null,
        fecha_inicio || new Date().toISOString().split("T")[0],
        dia_pago || null,
      ],
    );
    res
      .status(201)
      .json({ mensaje: "Inscripción creada", inscripcion: result.rows[0] });
  } catch (err) {
    console.error("Error creando inscripción:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const renovar = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_inicio } = req.body;
    const result = await query(
      `UPDATE inscripciones SET fecha_inicio=$1, estado='activa' WHERE id=$2 RETURNING *`,
      [fecha_inicio || new Date().toISOString().split("T")[0], id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Inscripción no encontrada" });
    res.json({ mensaje: "Renovada", inscripcion: result.rows[0] });
  } catch (err) {
    console.error("Error renovando inscripción:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const darDeBaja = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_fin, motivo } = req.body;

    const fechaBaja = fecha_fin || new Date().toISOString().split("T")[0];

    const result = await query(
      `
        UPDATE inscripciones
        SET
          estado = 'cancelada',
          fecha_fin = $1,
          notas = CASE
            WHEN $2::text IS NULL OR TRIM($2::text) = ''
              THEN notas
            WHEN notas IS NULL OR TRIM(notas) = ''
              THEN $2
            ELSE notas || E'\nBaja: ' || $2
          END
        WHERE id = $3
          AND estado = 'activa'
        RETURNING *
      `,
      [fechaBaja, motivo || null, id],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: "Inscripción activa no encontrada",
      });
    }

    res.json({
      mensaje: "Inscripción dada de baja",
      inscripcion: result.rows[0],
    });
  } catch (err) {
    console.error("Error dando de baja la inscripción:", err);

    res.status(500).json({
      error: "Error del servidor",
    });
  }
};
const actualizarDiaPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { dia_pago } = req.body;
    if (!dia_pago || dia_pago < 1 || dia_pago > 31)
      return res
        .status(400)
        .json({ error: "Día de pago debe ser entre 1 y 31" });
    const result = await query(
      "UPDATE inscripciones SET dia_pago=$1 WHERE id=$2 RETURNING *",
      [dia_pago, id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Inscripción no encontrada" });
    res.json({
      mensaje: "Día de pago actualizado",
      inscripcion: result.rows[0],
    });
  } catch (err) {
    console.error("Error actualizando día de pago:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const listarPaquetes = async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM paquetes WHERE activo = TRUE ORDER BY tipo, clases_semana",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error listando paquetes:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const crearPaquete = async (req, res) => {
  try {
    const {
      nombre,
      tipo,
      clases_semana,
      precio_mensual,
      precio_clase,
      precio_cancha,
      descripcion,
    } = req.body;
    if (!nombre || !tipo)
      return res.status(400).json({ error: "Nombre y tipo requeridos" });
    if (tipo === "grupal" && !precio_mensual)
      return res
        .status(400)
        .json({ error: "precio_mensual requerido para paquetes grupales" });
    if (tipo === "particular" && !precio_clase)
      return res
        .status(400)
        .json({ error: "precio_clase requerido para paquetes particulares" });
    const result = await query(
      `INSERT INTO paquetes (nombre, tipo, clases_semana, precio_mensual, precio_clase, precio_cancha, descripcion) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        nombre,
        tipo,
        clases_semana || null,
        precio_mensual || null,
        precio_clase || null,
        precio_cancha || 0,
        descripcion || null,
      ],
    );
    res
      .status(201)
      .json({ mensaje: "Paquete creado", paquete: result.rows[0] });
  } catch (err) {
    console.error("Error creando paquete:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const editarPaquete = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      tipo,
      clases_semana,
      precio_mensual,
      precio_clase,
      precio_cancha,
      descripcion,
    } = req.body;
    const result = await query(
      `UPDATE paquetes SET nombre=$1, tipo=$2, clases_semana=$3, precio_mensual=$4, precio_clase=$5, precio_cancha=$6, descripcion=$7 WHERE id=$8 RETURNING *`,
      [
        nombre,
        tipo,
        clases_semana || null,
        precio_mensual || null,
        precio_clase || null,
        precio_cancha || 0,
        descripcion || null,
        id,
      ],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Paquete no encontrado" });
    res.json({ mensaje: "Paquete actualizado", paquete: result.rows[0] });
  } catch (err) {
    console.error("Error editando paquete:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const eliminarPaquete = async (req, res) => {
  try {
    await query("UPDATE paquetes SET activo=FALSE WHERE id=$1", [
      req.params.id,
    ]);
    res.json({ mensaje: "Paquete desactivado" });
  } catch (err) {
    console.error("Error eliminando paquete:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  listar,
  crear,
  renovar,
  darDeBaja,
  actualizarDiaPago,
  listarPaquetes,
  crearPaquete,
  editarPaquete,
  eliminarPaquete,
};
