const express = require('express');
const authRoutes = require('./auth');
const empresasRoutes = require('./empresas');
const llamadasRoutes = require('./llamadas');
const citasRoutes = require('./citas');
const contactosRoutes = require('./contactos');

const app = express();

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/empresas', empresasRoutes);
app.use('/llamadas', llamadasRoutes);
app.use('/citas', citasRoutes);
app.use('/contactos', contactosRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;
