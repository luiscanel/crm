const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initDatabase } = require('./models/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { logger, requestTimer } = require('./utils/logger');
const { swaggerUi, specs } = require('./utils/swagger');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Demasiadas solicitudes, intenta más tarde' }
});
app.use('/api/', limiter);

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

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestTimer);

// Make db available to routes
app.use((req, res, next) => {
  req.db = req.app.locals.db;
  next();
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    const db = initDatabase();
    app.locals.db = db;
    logger.success('Database connected');
    
    // Import routes
    const authRoutes = require('./routes/auth');
    const empresasRoutes = require('./routes/empresas');
    const contactosRoutes = require('./routes/contactos');
    const llamadasRoutes = require('./routes/llamadas');
    const citasRoutes = require('./routes/citas');
    const gamificacionRoutes = require('./routes/gamificacion');
    const dashboardRoutes = require('./routes/dashboard');
    const notasRoutes = require('./routes/notas');
    const plantillasRoutes = require('./routes/plantillas');

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/empresas', empresasRoutes);
    app.use('/api/contactos', contactosRoutes);
    app.use('/api/llamadas', llamadasRoutes);
    app.use('/api/citas', citasRoutes);
    app.use('/api/gamificacion', gamificacionRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/notas', notasRoutes);
    app.use('/api/plantillas', plantillasRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ success: true, message: 'Teknao CRM API running', timestamp: new Date().toISOString() });
    });

    // Swagger documentation
    app.use('/api/docs', swaggerUi.serve);
    app.get('/api/docs', swaggerUi.setup(specs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Teknao CRM API Docs'
    }));

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../../frontend/dist')));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
      });
    }

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.success(`🚀 Teknao CRM API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();

module.exports = app;