// Vercel API Route
const express = require('express');
const authRoutes = require('./api/auth');
const empresasRoutes = require('./api/empresas');
const llamadasRoutes = require('./api/llamadas');
const citasRoutes = require('./api/citas');
const contactosRoutes = require('./api/contactos');

const app = express();
app.use(express.json());

// Routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/llamadas', llamadasRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/contactos', contactosRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
