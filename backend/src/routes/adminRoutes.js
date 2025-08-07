const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
    // For now, just let any authenticated user be admin
    // In production, check user role from database
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Accesso negato'
        });
    }
    next();
};

// GET /api/admin/stats - Get admin statistics
router.get('/stats', authMiddleware, checkAdmin, async (req, res) => {
    try {
        // Return mock admin stats
        res.json({
            success: true,
            data: {
                totalUsers: 1,
                totalPosts: 0,
                totalComments: 0,
                serverStatus: 'online',
                systemHealth: 'good'
            }
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/admin/users - Get all users
router.get('/users', authMiddleware, checkAdmin, async (req, res) => {
    try {
        // Return mock users list
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

module.exports = router;
