import express from 'express';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { logger } from './utils/logger.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Start the server
const PORT = env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on http://${env.HOST}:${PORT}`);
});

export default app;