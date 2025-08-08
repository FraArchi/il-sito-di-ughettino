const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

const socketService = {
  init(server) {
    io = new Server(server, {
      cors: {
        origin: [
          'https://fraarchi.github.io',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:5500'
        ],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      logger.info(`Socket client connected: ${socket.id}`);

      socket.on('disconnect', (reason) => {
        logger.info(`Socket client disconnected: ${socket.id}, reason: ${reason}`);
      });

      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });

    return io;
  },

  getIO() {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  },

  emit(event, data) {
    if (io) {
      io.emit(event, data);
    }
  },

  emitToUser(userId, event, data) {
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
    }
  }
};

module.exports = socketService;
