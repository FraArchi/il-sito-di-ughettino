const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../utils/logger');
const config = require('./index');

// Sentry (lazy-load only if DSN provided and module available)
let Sentry = null;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
  } catch (e) {
    console.warn('[@sentry/node] not installed, skipping Sentry init');
  }
}

module.exports = (app) => {
  // Request timing metric
  const client = require('prom-client');
  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
  });

  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
      end({ method: req.method, route: req.route ? req.route.path : req.path, code: res.statusCode });
    });
    next();
  });

  // Sentry request handler
  if (Sentry) {
    app.use(Sentry.Handlers.requestHandler());
  }

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors(config.cors));

  // Compression (gzip)
  app.use(compression());

  // Logging
  app.use(morgan('combined', {
    stream: {
      write: message => logger.info(message.trim())
    }
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting and speed limiting (disabled in test environment)
  if (config.env !== 'test') {
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    app.use('/api/', limiter);

    const speedLimiter = slowDown({
      windowMs: config.slowDown.windowMs,
      delayAfter: config.slowDown.delayAfter,
      delayMs: () => config.slowDown.delayMs,
      maxDelayMs: config.slowDown.maxDelayMs,
      validate: { delayMs: false }
    });

    app.use('/api/', speedLimiter);
  }
};
