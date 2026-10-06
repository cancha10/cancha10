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
      horas_compradas,
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
    // Si el pago corresponde a un paquete de horas, crear el saldo de horas
    if (horas_compradas && Number(horas_compradas) > 0) {
      await query(
        `
    INSERT INTO paquetes_horas (
      alumno_id,
      pago_id,
      horas_compradas,
      horas_disponibles,
      precio_total
    )
    VALUES ($1, $2, $3, $3, $4)
    `,
        [alumno_id, result.rows[0].id, Number(horas_compradas), monto],
      );
    }
    res.status(201).json({ mensaje: "Pago registrado", pago: result.rows[0] });
  } catch (err) {
    console.error("Error registrando pago:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const pendientes = async (req, res) => {
  try {
    const result = await query(
      `
      SELECT
        i.id AS inscripcion_id,
        a.id AS alumno_id,
        u.nombre || ' ' || u.apellido AS alumno_nombre,
        pa.nombre AS paquete,
        i.dia_pago,
        COALESCE(i.precio_mensual_personalizado, pa.precio_mensual, 0) AS monto,
        CASE
          WHEN EXTRACT(DAY FROM CURRENT_DATE) > i.dia_pago
            THEN 'vencido'
          ELSE 'pendiente'
        END AS estado
      FROM inscripciones i
      JOIN alumnos a ON a.id = i.alumno_id
      JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN paquetes pa ON pa.id = i.paquete_id
      WHERE i.estado = 'activa'
        AND i.dia_pago IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM pagos p
          WHERE p.inscripcion_id = i.id
            AND p.estado = 'pagado'
            AND EXTRACT(MONTH FROM p.fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM p.fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE)
        )
      ORDER BY i.dia_pago ASC, alumno_nombre ASC
      `,
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
      `SELECT p.*, pa.nombre AS paquete
   FROM pagos p
   LEFT JOIN inscripciones i ON i.id = p.inscripcion_id
   LEFT JOIN paquetes pa ON pa.id = i.paquete_id
   WHERE p.alumno_id = $1
   ORDER BY p.periodo_fin DESC NULLS LAST, p.created_at DESC`,
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
    const {
      tipo,
      monto,
      metodo_pago,
      periodo_inicio,
      periodo_fin,
      notas,
      inscripcion_id,
    } = req.body;

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
          notas = COALESCE($6, notas),
          inscripcion_id = COALESCE($7, inscripcion_id)
        WHERE id = $8
        RETURNING *
      `,
      [
        tipo || null,
        monto !== undefined ? Number(monto) : null,
        metodo_pago || null,
        periodo_inicio || null,
        periodo_fin || null,
        notas ?? null,
        inscripcion_id || null,
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
const reporteFinanciero = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        DATE_TRUNC('month', p.fecha_pago) AS mes,

        COALESCE(
          SUM(p.monto) FILTER (
            WHERE p.estado = 'pagado'
          ), 0
        ) AS ingresos_totales,

        COALESCE(
          SUM(p.monto) FILTER (
            WHERE p.estado = 'pagado'
            AND g.tipo = 'grupal'
          ), 0
        ) AS ingresos_grupales,

        COALESCE(
          SUM(p.monto) FILTER (
            WHERE p.estado = 'pagado'
            AND g.tipo = 'particular'
          ), 0
        ) AS ingresos_particulares,

        COALESCE(
          SUM(p.monto) FILTER (
            WHERE p.estado = 'pagado'
            AND g.tipo IS NULL
          ), 0
        ) AS otros

      FROM pagos p

      LEFT JOIN inscripciones i
        ON i.id = p.inscripcion_id

      LEFT JOIN grupos g
        ON g.id = i.grupo_id

      WHERE p.fecha_pago IS NOT NULL

      GROUP BY DATE_TRUNC('month', p.fecha_pago)
      ORDER BY mes DESC
      LIMIT 12
    `);

    res.json({
      meses: result.rows,
    });
  } catch (err) {
    console.error("Error generando reporte financiero:", err);
    res.status(500).json({
      error: "Error generando reporte financiero",
    });
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
  reporteFinanciero,
};
