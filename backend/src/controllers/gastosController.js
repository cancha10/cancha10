const { query } = require("../config/database");
const CATEGORIAS = [
  "renta",
  "nomina",
  "mantenimiento",
  "equipo",
  "marketing",
  "servicios",
  "otro",
];

const listar = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const vals = [];
    const conds = [];
    let i = 1;
    if (mes) {
      conds.push(`EXTRACT(MONTH FROM fecha)=$${i++}`);
      vals.push(mes);
    }
    if (anio) {
      conds.push(`EXTRACT(YEAR FROM fecha)=$${i++}`);
      vals.push(anio);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const result = await query(
      `SELECT g.*, u.nombre||' '||u.apellido AS registrado_por_nombre FROM gastos g LEFT JOIN usuarios u ON u.id=g.registrado_por ${where} ORDER BY g.fecha DESC`,
      vals,
    );
    const total = result.rows.reduce((s, g) => s + parseFloat(g.monto), 0);
    res.json({ total, gastos: result.rows });
  } catch (err) {
    console.error("Error listando gastos:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const crear = async (req, res) => {
  try {
    const { concepto, categoria, monto, fecha, notas } = req.body;
    if (!concepto || !monto)
      return res.status(400).json({ error: "Concepto y monto requeridos" });
    const cat = CATEGORIAS.includes(categoria) ? categoria : "otro";
    const result = await query(
      `INSERT INTO gastos (concepto, categoria, monto, fecha, notas, registrado_por) VALUES ($1,$2,$3,COALESCE($4,CURRENT_DATE),$5,$6) RETURNING *`,
      [concepto, cat, monto, fecha || null, notas || null, req.user.id],
    );
    res
      .status(201)
      .json({ mensaje: "Gasto registrado", gasto: result.rows[0] });
  } catch (err) {
    console.error("Error creando gasto:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const eliminar = async (req, res) => {
  try {
    const result = await query("DELETE FROM gastos WHERE id=$1 RETURNING id", [
      req.params.id,
    ]);
    if (!result.rows.length)
      return res.status(404).json({ error: "Gasto no encontrado" });
    res.json({ mensaje: "Gasto eliminado" });
  } catch (err) {
    console.error("Error eliminando gasto:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const resumenFinanciero = async (req, res) => {
  try {
    const m = req.query.mes || new Date().getMonth() + 1;
    const a = req.query.anio || new Date().getFullYear();
    console.log("ENTRE A RESUMEN FINANCIERO");
    const [ingr, porCobrar, gast] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(monto),0) AS total FROM pagos WHERE estado='pagado' AND EXTRACT(MONTH FROM fecha_pago)=$1 AND EXTRACT(YEAR FROM fecha_pago)=$2`,
        [m, a],
      ),
      query(
        `SELECT COALESCE(SUM(monto),0) AS total FROM pagos WHERE estado IN ('pendiente','vencido') AND EXTRACT(MONTH FROM periodo_inicio)=$1 AND EXTRACT(YEAR FROM periodo_inicio)=$2`,
        [m, a],
      ),
      query(
        `SELECT COALESCE(SUM(monto),0) AS total FROM gastos WHERE EXTRACT(MONTH FROM fecha)=$1 AND EXTRACT(YEAR FROM fecha)=$2`,
        [m, a],
      ),
    ]);
    const ingresos = parseFloat(ingr.rows[0].total);
    const pendientes = parseFloat(porCobrar.rows[0].total);
    const gastos = parseFloat(gast.rows[0].total);
    res.json({
      mes: parseInt(m),
      anio: parseInt(a),
      ingresos,
      por_cobrar: pendientes,
      gastos,
      balance: ingresos - gastos,
    });
  } catch (err) {
    console.error("Error en resumen financiero:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = { listar, crear, eliminar, resumenFinanciero };
