const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' });
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, rol_id, activo FROM usuarios WHERE id=$1', [decoded.id]);
    if (!result.rows.length || !result.rows[0].activo) return res.status(401).json({ error: 'Usuario inválido' });
    req.user = { id: result.rows[0].id, rol_id: result.rows[0].rol_id };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const soloAdmin = (req, res, next) => {
  if (req.user.rol_id !== 1) return res.status(403).json({ error: 'Solo administradores' });
  next();
};

const adminOInstructor = (req, res, next) => {
  if (![1,2].includes(req.user.rol_id)) return res.status(403).json({ error: 'Sin permisos' });
  next();
};

module.exports = { authMiddleware, soloAdmin, adminOInstructor };
