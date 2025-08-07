const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/gamification/leaderboard - Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        // Return mock leaderboard
        res.json({
            success: true,
            data: [
                {
                    rank: 1,
                    username: 'UgoFan1',
                    points: 1000,
                    level: 5
                }
            ]
        });
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/gamification/user-stats - Get user stats
router.get('/user-stats', authMiddleware, async (req, res) => {
    try {
        // Return mock user stats
        res.json({
            success: true,
            data: {
                points: 100,
                level: 2,
                badges: ['Primo Post', 'Quiz Master'],
                achievements: []
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
