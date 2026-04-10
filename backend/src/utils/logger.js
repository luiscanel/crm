/**
 * Logging utilities
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  green: '\x1b[32m'
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
};

const logger = {
  info: (message, meta) => {
    console.log(colors.blue + formatMessage('INFO', message, meta) + colors.reset);
  },
  
  warn: (message, meta) => {
    console.warn(colors.yellow + formatMessage('WARN', message, meta) + colors.reset);
  },
  
  error: (message, meta) => {
    console.error(colors.red + formatMessage('ERROR', message, meta) + colors.reset);
  },
  
  success: (message, meta) => {
    console.log(colors.green + formatMessage('SUCCESS', message, meta) + colors.reset);
  },
  
  // Request logging
  request: (req) => {
    logger.info(`${req.method} ${req.path}`, { 
      query: req.query, 
      params: req.params,
      user: req.user?.id 
    });
  },
  
  // Response logging
  response: (req, statusCode, duration) => {
    const level = statusCode >= 400 ? 'error' : 'info';
    logger[level](`${req.method} ${req.path}`, { 
      status: statusCode, 
      duration: `${duration}ms` 
    });
  }
};

// Request timing middleware
const requestTimer = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.response(req, res.statusCode, duration);
  });
  next();
};

module.exports = { logger, requestTimer };