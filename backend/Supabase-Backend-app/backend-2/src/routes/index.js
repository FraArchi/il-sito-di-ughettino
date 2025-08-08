import express from 'express';
import { someControllerFunction } from '../controllers/index.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Define routes
router.get('/some-endpoint', authenticate, someControllerFunction);

// Add more routes as needed

export default router;