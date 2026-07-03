require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'C10 API', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🎾  C10 API corriendo en http://localhost:${PORT}`);
  console.log(`📋  Health check: http://localhost:${PORT}/health`);
  console.log(`🌎  Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});
