// Vercel API Route
const express = require('express');
const authRoutes = require('./api/auth');
const empresasRoutes = require('./api/empresas');
const llamadasRoutes = require('./api/llamadas');
const citasRoutes = require('./api/citas');
const contactosRoutes = require('./api/contactos');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/empresas', empresasRoutes);
app.use('/llamadas', llamadasRoutes);
app.use('/citas', citasRoutes);
app.use('/contactos', contactosRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
