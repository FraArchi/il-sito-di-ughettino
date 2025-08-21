const express = require('express');
require('express-async-errors');
const client = require('prom-client');
const { verifySupabaseBucket } = require('./config/supabase-startup');
const logger =require('./utils/logger');

// Initialize Sentry
let Sentry = null;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  } catch (e) {
    console.warn('[@sentry/node] not installed, skipping Sentry init');
  }
}

// Perform async startup tasks
verifySupabaseBucket();

// Prometheus metrics
client.collectDefaultMetrics();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const photoBoothRoutes = require('./routes/photoBoothRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ugoAIRoutes = require('./routes/ugoAI');
const ugoChat = require('./routes/ugoChat');
const aiRoutes = require('./routes/aiRoutes');
const publicIntegrationRoutes = require('./routes/publicIntegrationRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Setup Express middleware
require('./config/express')(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// API Documentation
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/photo-booth', photoBoothRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ugo-ai', ugoAIRoutes);
app.use('/api/ugo', ugoChat);
app.use('/api/ai', aiRoutes);
app.use('/api/public', publicIntegrationRoutes);

// Sentry error handler
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown handlers
const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled rejections and exceptions
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  if (Sentry) Sentry.captureException(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  if (Sentry) Sentry.captureException(err);
  process.exit(1);
});

module.exports = app;
