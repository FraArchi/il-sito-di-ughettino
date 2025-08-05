const { PrismaClient } = require('@prisma/client');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class CommentService {
  // Create a new comment
  async createComment(authorId, postId, content, parentId = null) {
    // Check if post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, published: true, title: true }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (!post.published) {
      throw new Error('Cannot comment on unpublished posts');
    }

    // If it's a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: parentId,
          postId: postId
        }
      });

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId,
        postId,
        parentId,
        isApproved: process.env.NODE_ENV === 'development' // Auto-approve in development
      },
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
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Award points for commenting
    await prisma.user.update({
      where: { id: authorId },
      data: {
        points: {
          increment: 10
        }
      }
    });

    // Clear post cache to update comment count
    await this.clearPostCommentCache(postId);

    // Create notification for post author (if different from commenter)
    if (post.authorId !== authorId) {
      await this.createCommentNotification(post, comment, 'comment');
    }

    // If it's a reply, notify the parent comment author
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { author: true }
      });

      if (parentComment && parentComment.authorId !== authorId) {
        await this.createCommentNotification(post, comment, 'reply', parentComment);
      }
    }

    logger.info('Comment created:', { 
      commentId: comment.id, 
      postId, 
      authorId, 
      isReply: !!parentId 
    });

    return comment;
  }

  // Get comments for a post
  async getPostComments(postId, options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeReplies = true,
      approved = true
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      postId,
      parentId: null, // Only top-level comments
      ...(approved !== undefined && { isApproved: approved })
    };

    // Generate cache key
    const cacheKey = `comments:${postId}:${JSON.stringify(options)}`;
    
    // Try cache first
    let cachedResult = await cache.getWithPattern(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
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
          ...(includeReplies && {
            replies: {
              where: {
                isApproved: approved
              },
              orderBy: {
                createdAt: 'asc'
              },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            }
          })
        }
      }),
      prisma.comment.count({ where })
    ]);

    const result = {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    // Cache for 5 minutes
    await cache.setWithPattern(cacheKey, result, 300);

    return result;
  }

  // Update comment
  async updateComment(commentId, userId, content) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user owns the comment or is admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (comment.authorId !== userId && !user.isAdmin) {
      throw new Error('Not authorized to update this comment');
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date()
      },
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
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Clear cache
    await this.clearPostCommentCache(comment.postId);

    logger.info('Comment updated:', { commentId, userId });

    return updatedComment;
  }

  // Delete comment
  async deleteComment(commentId, userId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { 
        author: true,
        replies: true
      }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user owns the comment or is admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (comment.authorId !== userId && !user.isAdmin) {
      throw new Error('Not authorized to delete this comment');
    }

    // Delete comment and all its replies (cascade)
    await prisma.comment.delete({
      where: { id: commentId }
    });

    // Clear cache
    await this.clearPostCommentCache(comment.postId);

    logger.info('Comment deleted:', { 
      commentId, 
      userId, 
      repliesCount: comment.replies.length 
    });

    return { message: 'Comment deleted successfully' };
  }

  // Approve comment (admin only)
  async approveComment(commentId, userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.isAdmin) {
      throw new Error('Admin access required');
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { isApproved: true },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Clear cache
    await this.clearPostCommentCache(comment.postId);

    logger.info('Comment approved:', { commentId, userId });

    return comment;
  }

  // Reject comment (admin only)
  async rejectComment(commentId, userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.isAdmin) {
      throw new Error('Admin access required');
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    // Clear cache
    await this.clearPostCommentCache(comment.postId);

    logger.info('Comment rejected and deleted:', { commentId, userId });

    return { message: 'Comment rejected and deleted' };
  }

  // Get pending comments (admin only)
  async getPendingComments(options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { isApproved: false },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
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
          post: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      }),
      prisma.comment.count({ where: { isApproved: false } })
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Get user's comments
  async getUserComments(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          replies: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              author: {
                select: {
                  username: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }),
      prisma.comment.count({ where: { authorId: userId } })
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Get comment statistics
  async getCommentStats() {
    const cacheKey = 'comment-stats';
    
    let stats = await cache.getWithPattern(cacheKey);
    if (stats) {
      return stats;
    }

    const [
      totalComments,
      approvedComments,
      pendingComments,
      todayComments,
      thisWeekComments
    ] = await Promise.all([
      prisma.comment.count(),
      prisma.comment.count({ where: { isApproved: true } }),
      prisma.comment.count({ where: { isApproved: false } }),
      prisma.comment.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.comment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    stats = {
      totalComments,
      approvedComments,
      pendingComments,
      todayComments,
      thisWeekComments,
      approvalRate: totalComments > 0 ? 
        ((approvedComments / totalComments) * 100).toFixed(2) + '%' : '0%'
    };

    // Cache for 10 minutes
    await cache.setWithPattern(cacheKey, stats, 600);

    return stats;
  }

  // Helper methods
  async clearPostCommentCache(postId) {
    const keys = [
      `ugo:comments:${postId}:*`,
      `ugo:comment-stats`,
      `ugo:post:*` // Clear post caches to update comment counts
    ];

    for (const pattern of keys) {
      const matchingKeys = await cache.keys(pattern);
      if (matchingKeys.length > 0) {
        await cache.del(matchingKeys);
      }
    }
  }

  async createCommentNotification(post, comment, type, parentComment = null) {
    try {
      let recipientId, title, message;

      if (type === 'comment') {
        recipientId = post.authorId;
        title = 'Nuovo commento sul tuo post';
        message = `${comment.author.firstName} ha commentato il tuo post "${post.title}"`;
      } else if (type === 'reply') {
        recipientId = parentComment.authorId;
        title = 'Risposta al tuo commento';
        message = `${comment.author.firstName} ha risposto al tuo commento su "${post.title}"`;
      }

      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: type === 'comment' ? 'NEW_COMMENT' : 'NEW_COMMENT',
          title,
          message,
          data: {
            postId: post.id,
            postTitle: post.title,
            commentId: comment.id,
            commentAuthor: comment.author.firstName,
            ...(parentComment && { parentCommentId: parentComment.id })
          }
        }
      });
    } catch (error) {
      logger.error('Error creating comment notification:', error);
    }
  }
}

module.exports = new CommentService();
