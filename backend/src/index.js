const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Global db reference
let db = null;

// CORS - allow localhost and Vercel/Railway domains
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3001',
    /\.vercel\.app$/,
    /\.railway\.app$/,
    'https://kfohysmglpsdmobldsnk.supabase.co'
  ],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Make db available to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Initialize database and then start server
async function startServer() {
  try {
    // Initialize database
    db = initDatabase();
    console.log('✅ Database connected');
    
    // Import routes after db is ready
    const authRoutes = require('./routes/auth');
    const empresasRoutes = require('./routes/empresas');
    const contactosRoutes = require('./routes/contactos');
    const llamadasRoutes = require('./routes/llamadas');
    const citasRoutes = require('./routes/citas');
    const gamificacionRoutes = require('./routes/gamificacion');
    const dashboardRoutes = require('./routes/dashboard');
    const notasRoutes = require('./routes/notas');

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/empresas', empresasRoutes);
    app.use('/api/contactos', contactosRoutes);
    app.use('/api/llamadas', llamadasRoutes);
    app.use('/api/citas', citasRoutes);
    app.use('/api/gamificacion', gamificacionRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/notas', notasRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'Teknao CRM API running' });
    });

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../../frontend/dist')));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
      });
    }

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Teknao CRM API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
module.exports.getDb = () => db;