const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'c10_db',
      user: process.env.DB_USER || 'c10_user',
      password: process.env.DB_PASSWORD || '',
      max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000,
    });

pool.on('error', (err) => console.error('Error inesperado en cliente de DB:', err));

const query = async (text, params) => {
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV === 'development') {
    console.log('Query:', text.substring(0, 80), 'rows:', res.rowCount);
  }
  return res;
};

module.exports = { pool, query };
