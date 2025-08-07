const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/users/profile - Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // Get user info from token (set by middleware)
        const userId = req.user.id;
        
        // Return user profile data
        res.json({
            success: true,
            data: {
                id: userId,
                username: req.user.username,
                email: req.user.email,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email } = req.body;
        
        // Here you would update user in database
        // For now, just return success
        res.json({
            success: true,
            message: 'Profilo aggiornato con successo',
            data: {
                id: userId,
                username: username || req.user.username,
                email: email || req.user.email
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        // Return mock user statistics
        res.json({
            success: true,
            data: {
                postsCount: 0,
                commentsCount: 0,
                likesReceived: 0,
                joinDate: req.user.createdAt
            }
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

module.exports = router;
