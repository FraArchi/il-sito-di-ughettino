const express = require('express');
const router = express.Router();

// GET /api/quiz - Get available quizzes
router.get('/', async (req, res) => {
    try {
        // Return mock quiz data
        res.json({
            success: true,
            data: [
                {
                    id: 1,
                    title: 'Quiz di Benvenuto',
                    description: 'Un quiz per conoscere meglio Ugo!',
                    questions: 5,
                    difficulty: 'facile'
                }
            ]
        });
    } catch (error) {
        console.error('Error getting quizzes:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/quiz/:id - Get specific quiz
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Return mock quiz
        res.json({
            success: true,
            data: {
                id: parseInt(id),
                title: 'Quiz di Benvenuto',
                questions: [
                    {
                        id: 1,
                        question: 'Chi è Ugo?',
                        options: ['Un AI', 'Un cane', 'Un gatto', 'Un pesce'],
                        correct: 0
                    }
                ]
            }
        });
    } catch (error) {
        console.error('Error getting quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

module.exports = router;
