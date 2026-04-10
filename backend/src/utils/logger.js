/**
 * Logging utilities - Winston based
 */

const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    // File transports (optional - only in production or if LOG_DIR set)
    ...(process.env.LOG_DIR ? [
      new winston.transports.File({ filename: path.join(process.env.LOG_DIR, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(process.env.LOG_DIR, 'combined.log') })
    ] : [])
  ]
});

// Legacy API compatibility
logger.info = (message, meta) => logger.log('info', message, meta);
logger.warn = (message, meta) => logger.log('warn', message, meta);
logger.error = (message, meta) => logger.log('error', message, meta);
logger.success = (message, meta) => logger.log('info', message, meta);

// Request timing middleware
const requestTimer = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.id
    };
    
    if (res.statusCode >= 400) {
      logger.error(`${req.method} ${req.path} ${res.statusCode}`, logData);
    } else {
      logger.info(`${req.method} ${req.path} ${res.statusCode}`, logData);
    }
  });
  next();
};

module.exports = { logger, requestTimer };