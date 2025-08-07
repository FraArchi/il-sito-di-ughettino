const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/comments/:postId - Get comments for a post
router.get('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        
        // Return mock comments
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('Error getting comments:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// POST /api/comments - Create new comment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { postId, content } = req.body;
        
        if (!postId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Post ID e contenuto sono richiesti'
            });
        }
        
        // Return mock success
        res.status(201).json({
            success: true,
            message: 'Commento creato con successo',
            data: {
                id: Date.now(),
                postId,
                content,
                author: req.user.username,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

module.exports = router;
