const { query } = require("../config/database");

const listar = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.nombre||' '||u.apellido AS alumno_nombre, pa.nombre AS paquete
       FROM pagos p JOIN alumnos a ON a.id = p.alumno_id JOIN usuarios u ON u.id = a.usuario_id
       LEFT JOIN inscripciones i ON i.id = p.inscripcion_id LEFT JOIN paquetes pa ON pa.id = i.paquete_id
       ORDER BY p.created_at DESC`,
    );
    res.json({ pagos: result.rows });
  } catch (err) {
    console.error("Error listando pagos:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const registrar = async (req, res) => {
  try {
    const {
      alumno_id,
      inscripcion_id,
      sesion_id,
      tipo,
      monto,
      periodo_inicio,
      periodo_fin,
      metodo_pago,
      notas,
    } = req.body;
    if (!alumno_id || !monto)
      return res.status(400).json({ error: "alumno_id y monto requeridos" });
    const result = await query(
      `INSERT INTO pagos (alumno_id, inscripcion_id, sesion_id, tipo, monto, periodo_inicio, periodo_fin, estado, fecha_pago, metodo_pago, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pagado',NOW(),$8,$9) RETURNING *`,
      [
        alumno_id,
        inscripcion_id || null,
        sesion_id || null,
        tipo || "mensual",
        monto,
        periodo_inicio || null,
        periodo_fin || null,
        metodo_pago || null,
        notas || null,
      ],
    );
    res.status(201).json({ mensaje: "Pago registrado", pago: result.rows[0] });
  } catch (err) {
    console.error("Error registrando pago:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const pendientes = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.nombre||' '||u.apellido AS alumno_nombre, pa.nombre AS paquete
       FROM pagos p JOIN alumnos a ON a.id = p.alumno_id JOIN usuarios u ON u.id = a.usuario_id
       LEFT JOIN inscripciones i ON i.id = p.inscripcion_id LEFT JOIN paquetes pa ON pa.id = i.paquete_id
       WHERE p.estado IN ('pendiente','vencido') ORDER BY p.created_at DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error listando pendientes:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const misPagos = async (req, res) => {
  try {
    const alumnoRes = await query(
      "SELECT id FROM alumnos WHERE usuario_id=$1",
      [req.user.id],
    );
    if (!alumnoRes.rows.length) return res.json([]);
    const result = await query(
      `SELECT p.*, pa.nombre AS paquete FROM pagos p
       LEFT JOIN inscripciones i ON i.id = p.inscripcion_id LEFT JOIN paquetes pa ON pa.id = i.paquete_id
       WHERE p.alumno_id=$1 ORDER BY p.created_at DESC`,
      [alumnoRes.rows[0].id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error listando mis pagos:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const validos = ["pagado", "pendiente", "vencido", "cancelado"];
    if (!validos.includes(estado))
      return res.status(400).json({ error: "Estado inválido" });
    const result = await query(
      `UPDATE pagos SET estado=$1::varchar, fecha_pago = CASE WHEN $1::varchar='pagado' THEN NOW() ELSE fecha_pago END WHERE id=$2 RETURNING *`,
      [estado, id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Pago no encontrado" });
    res.json({ mensaje: "Pago actualizado", pago: result.rows[0] });
  } catch (err) {
    console.error("Error actualizando pago:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};
const editarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, monto, metodo_pago, periodo_inicio, periodo_fin, notas } =
      req.body;

    if (monto !== undefined && Number(monto) <= 0) {
      return res.status(400).json({
        error: "El monto debe ser mayor a cero",
      });
    }

    const result = await query(
      `
        UPDATE pagos
        SET
          tipo = COALESCE($1, tipo),
          monto = COALESCE($2, monto),
          metodo_pago = COALESCE($3, metodo_pago),
          periodo_inicio = COALESCE($4, periodo_inicio),
          periodo_fin = COALESCE($5, periodo_fin),
          notas = COALESCE($6, notas)
        WHERE id = $7
        RETURNING *
      `,
      [
        tipo || null,
        monto !== undefined ? Number(monto) : null,
        metodo_pago || null,
        periodo_inicio || null,
        periodo_fin || null,
        notas ?? null,
        id,
      ],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: "Pago no encontrado",
      });
    }

    res.json({
      mensaje: "Pago actualizado",
      pago: result.rows[0],
    });
  } catch (err) {
    console.error("Error editando pago:", err);
    res.status(500).json({
      error: "Error del servidor",
    });
  }
};
const eliminarPago = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query("DELETE FROM pagos WHERE id=$1 RETURNING *", [
      id,
    ]);

    if (!result.rows.length) {
      return res.status(404).json({
        error: "Pago no encontrado",
      });
    }

    res.json({
      mensaje: "Pago eliminado",
    });
  } catch (err) {
    console.error("Error eliminando pago:", err);
    res.status(500).json({
      error: "Error del servidor",
    });
  }
};
const subirComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });
    const { subirArchivo } = require("../config/cloudinary");
    const resultado = await subirArchivo(
      req.file.buffer,
      `pago-${id}-${Date.now()}`,
    );
    const update = await query(
      `UPDATE pagos SET comprobante_url=$1, comprobante_nombre=$2, comprobante_fecha=NOW() WHERE id=$3 RETURNING *`,
      [resultado.secure_url, req.file.originalname, id],
    );
    if (!update.rows.length)
      return res.status(404).json({ error: "Pago no encontrado" });
    res.json({ mensaje: "Comprobante recibido", pago: update.rows[0] });
  } catch (err) {
    console.error("Error subiendo comprobante:", err);
    res.status(500).json({ error: "Error al subir el comprobante" });
  }
};

module.exports = {
  listar,
  registrar,
  pendientes,
  misPagos,
  actualizarEstado,
  editarPago,
  eliminarPago,
  subirComprobante,
};
