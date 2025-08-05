const postService = require('../services/postService');
const logger = require('../utils/logger');

class PostController {
  // Get all posts
  async getPosts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        published,
        featured,
        author,
        tag,
        category,
        search,
        sortBy = 'publishedAt',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        published: published !== undefined ? published === 'true' : true,
        featured: featured !== undefined ? featured === 'true' : undefined,
        authorId: author,
        tag,
        category,
        search,
        sortBy,
        sortOrder
      };

      const result = await postService.getPosts(options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch posts'
      });
    }
  }

  // Get single post by slug
  async getPost(req, res) {
    try {
      const { slug } = req.params;
      const userId = req.user?.id;

      const post = await postService.getPostBySlug(slug, userId);

      res.json({
        success: true,
        data: { post }
      });
    } catch (error) {
      logger.error('Get post error:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch post'
      });
    }
  }

  // Create new post (admin only)
  async createPost(req, res) {
    try {
      const authorId = req.user.id;
      const postData = req.body;

      const post = await postService.createPost(authorId, postData);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: { post }
      });
    } catch (error) {
      logger.error('Create post error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create post'
      });
    }
  }

  // Update post
  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const post = await postService.updatePost(id, userId, updateData);

      res.json({
        success: true,
        message: 'Post updated successfully',
        data: { post }
      });
    } catch (error) {
      logger.error('Update post error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Not authorized') ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update post'
      });
    }
  }

  // Delete post
  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await postService.deletePost(id, userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Delete post error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Not authorized') ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete post'
      });
    }
  }

  // Like/Unlike post
  async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await postService.toggleLike(id, userId);

      res.json({
        success: true,
        message: result.message,
        data: { liked: result.liked }
      });
    } catch (error) {
      logger.error('Toggle like error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to toggle like'
      });
    }
  }

  // Share post
  async sharePost(req, res) {
    try {
      const { id } = req.params;
      const { platform } = req.body;
      const userId = req.user.id;

      const result = await postService.sharePost(id, userId, platform);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Share post error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to share post'
      });
    }
  }

  // Get popular posts
  async getPopularPosts(req, res) {
    try {
      const { limit = 5 } = req.query;
      
      const posts = await postService.getPopularPosts(parseInt(limit));

      res.json({
        success: true,
        data: { posts }
      });
    } catch (error) {
      logger.error('Get popular posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch popular posts'
      });
    }
  }

  // Get related posts
  async getRelatedPosts(req, res) {
    try {
      const { id } = req.params;
      const { limit = 3 } = req.query;

      const posts = await postService.getRelatedPosts(id, parseInt(limit));

      res.json({
        success: true,
        data: { posts }
      });
    } catch (error) {
      logger.error('Get related posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch related posts'
      });
    }
  }

  // Get user's posts
  async getMyPosts(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 10,
        published,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        published: published !== undefined ? published === 'true' : undefined,
        authorId: userId,
        sortBy,
        sortOrder
      };

      const result = await postService.getPosts(options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get my posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch your posts'
      });
    }
  }

  // Get post analytics (admin only)
  async getPostAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const analytics = await prisma.postAnalytics.findMany({
        where: {
          postId: id,
          date: {
            gte: startDate
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      const post = await prisma.post.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          views: true,
          publishedAt: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true
            }
          }
        }
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      const totalViews = analytics.reduce((sum, day) => sum + day.views, 0);
      const avgViewsPerDay = totalViews / Math.max(analytics.length, 1);

      res.json({
        success: true,
        data: {
          post,
          analytics,
          summary: {
            totalViews,
            avgViewsPerDay: Math.round(avgViewsPerDay),
            totalLikes: post._count.likes,
            totalComments: post._count.comments,
            totalShares: post._count.shares,
            engagementRate: post.views > 0 ? 
              ((post._count.likes + post._count.comments + post._count.shares) / post.views * 100).toFixed(2) + '%' 
              : '0%'
          }
        }
      });
    } catch (error) {
      logger.error('Get post analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch post analytics'
      });
    }
  }

  // Preview post (for draft previews)
  async previewPost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          categories: {
            include: {
              category: true
            }
          }
        }
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      // Check if user can preview this post
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (post.authorId !== userId && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to preview this post'
        });
      }

      res.json({
        success: true,
        data: { post }
      });
    } catch (error) {
      logger.error('Preview post error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to preview post'
      });
    }
  }
}

module.exports = new PostController();
