const app = require('./app');
const { PrismaClient } = require('@prisma/client');
const logger = require('./utils/logger');
const socketService = require('./services/socketService');
const redisClient = require('./config/redis');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Test Redis connection
    await redisClient.ping();
    logger.info('✅ Redis connected successfully');

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
      logger.info(`📚 API Documentation: http://${HOST}:${PORT}/api-docs`);
      logger.info(`🏥 Health Check: http://${HOST}:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Initialize Socket.io
    socketService.init(server);
    logger.info('✅ Socket.io initialized');

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await prisma.$disconnect();
          logger.info('Database disconnected');
          
          await redisClient.quit();
          logger.info('Redis disconnected');
          
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server only if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
