// Migración automática (idempotente).
// Se ejecuta al arrancar el servidor y agrega columnas faltantes
// en la tabla `paquetes` si no existen. No borra ni modifica datos.
const { query } = require('./database');

async function runAutoMigrations() {
  try {
    await query(`
      ALTER TABLE paquetes
        ADD COLUMN IF NOT EXISTS precio_sesion NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS tipo_cobro    VARCHAR(20) DEFAULT 'mensual',
        ADD COLUMN IF NOT EXISTS tipo          VARCHAR(20) DEFAULT 'grupal',
        ADD COLUMN IF NOT EXISTS horas_semana  INTEGER,
        ADD COLUMN IF NOT EXISTS activo        BOOLEAN DEFAULT TRUE;
    `);
    // Asegura que filas viejas tengan valores por defecto coherentes
    await query(`UPDATE paquetes SET tipo_cobro = 'mensual' WHERE tipo_cobro IS NULL;`);
    await query(`UPDATE paquetes SET tipo       = 'grupal'  WHERE tipo       IS NULL;`);
    await query(`UPDATE paquetes SET activo     = TRUE      WHERE activo     IS NULL;`);
    console.log('✅ Migraciones automáticas aplicadas (paquetes OK)');
  } catch (err) {
    console.error('⚠️  Error en migraciones automáticas:', err.message);
  }
}

module.exports = { runAutoMigrations };
