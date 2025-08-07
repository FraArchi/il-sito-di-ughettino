const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/notifications - Get user notifications
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Return mock notifications
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// POST /api/notifications/mark-read - Mark notification as read
router.post('/mark-read', authMiddleware, async (req, res) => {
    try {
        const { notificationId } = req.body;
        
        // Return mock success
        res.json({
            success: true,
            message: 'Notifica segnata come letta'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

module.exports = router;
