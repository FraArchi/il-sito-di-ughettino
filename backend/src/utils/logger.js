const winston = require('winston');
const path = require('path');
const http = require('http');
const https = require('https');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'ugo-backend',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    )
  }));
}

// Optional HTTP transport
if (process.env.LOG_HTTP_ENDPOINT) {
  class HttpJsonTransport extends winston.Transport {
    log(info, callback) {
      const payload = JSON.stringify(info);
      try {
        const url = new URL(process.env.LOG_HTTP_ENDPOINT);
        const lib = url.protocol === 'https:' ? https : http;
        const req = lib.request({ method: 'POST', hostname: url.hostname, port: url.port || (url.protocol==='https:'?443:80), path: url.pathname, headers: { 'Content-Type': 'application/json' } }, res => {
          res.resume();
          callback();
        });
        req.on('error', () => callback());
        req.write(payload);
        req.end();
      } catch (e) {
        // swallow errors to avoid crashing logger
        callback();
      }
    }
  }
  logger.add(new HttpJsonTransport());
}

// Create a stream object for Morgan
logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  }
};

module.exports = logger;
