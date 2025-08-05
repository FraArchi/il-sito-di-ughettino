const { PrismaClient } = require('@prisma/client');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class PostService {
  // Create a new post
  async createPost(authorId, postData) {
    const { title, content, excerpt, coverImage, published, tags, categories, seoTitle, seoDescription, scheduledFor } = postData;

    // Generate slug from title
    const slug = this.generateSlug(title);

    // Ensure slug is unique
    const uniqueSlug = await this.ensureUniqueSlug(slug);

    // Calculate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const post = await prisma.post.create({
      data: {
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        slug: uniqueSlug,
        coverImage,
        published: published || false,
        publishedAt: published ? new Date() : null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        readingTime,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt,
        authorId,
        tags: {
          connectOrCreate: tags?.map(tagName => ({
            where: { name: tagName },
            create: {
              name: tagName,
              slug: this.generateSlug(tagName)
            }
          })) || []
        },
        categories: {
          connectOrCreate: categories?.map(categoryName => ({
            where: { name: categoryName },
            create: {
              name: categoryName,
              slug: this.generateSlug(categoryName)
            }
          })) || []
        }
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
        tags: {
          include: {
            tag: true
          }
        },
        categories: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    });

    // Clear related caches
    await this.clearPostCaches();

    logger.info('Post created:', { postId: post.id, title: post.title, authorId });

    return post;
  }

  // Get all posts with pagination and filters
  async getPosts(options = {}) {
    const {
      page = 1,
      limit = 10,
      published = true,
      featured,
      authorId,
      tag,
      category,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (published !== undefined) {
      where.published = published;
    }
    
    if (featured !== undefined) {
      where.featured = featured;
    }
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag
          }
        }
      };
    }
    
    if (category) {
      where.categories = {
        some: {
          category: {
            name: category
          }
        }
      };
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Generate cache key
    const cacheKey = `posts:${JSON.stringify({ ...options, page, limit })}`;
    
    // Try to get from cache
    let cachedResult = await cache.getWithPattern(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Get posts from database
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
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
          tags: {
            include: {
              tag: true
            }
          },
          categories: {
            include: {
              category: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true
            }
          }
        }
      }),
      prisma.post.count({ where })
    ]);

    const result = {
      posts,
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

  // Get single post by slug
  async getPostBySlug(slug, userId = null) {
    const cacheKey = `post:${slug}:${userId || 'anonymous'}`;
    
    // Try cache first
    let post = await cache.getWithPattern(cacheKey);
    if (post) {
      return post;
    }

    post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true
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
        },
        comments: {
          where: {
            isApproved: true,
            parentId: null
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
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
        },
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
      throw new Error('Post not found');
    }

    // Check if user has liked this post
    if (userId) {
      const like = await prisma.like.findFirst({
        where: {
          userId,
          postId: post.id
        }
      });
      post.isLiked = !!like;
    }

    // Increment view count (async)
    this.incrementViewCount(post.id).catch(err => 
      logger.error('Error incrementing view count:', err)
    );

    // Cache for 10 minutes
    await cache.setWithPattern(cacheKey, post, 600);

    return post;
  }

  // Update post
  async updatePost(postId, userId, updateData) {
    const { title, content, excerpt, coverImage, published, tags, categories, seoTitle, seoDescription, scheduledFor } = updateData;

    // Check if user owns the post or is admin
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true }
    });

    if (!existingPost) {
      throw new Error('Post not found');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (existingPost.authorId !== userId && !user.isAdmin) {
      throw new Error('Not authorized to update this post');
    }

    // Update slug if title changed
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      slug = await this.ensureUniqueSlug(this.generateSlug(title), postId);
    }

    // Calculate reading time
    let readingTime = existingPost.readingTime;
    if (content && content !== existingPost.content) {
      const wordCount = content.split(/\s+/).length;
      readingTime = Math.ceil(wordCount / 200);
    }

    const updatedPost = await prisma.$transaction(async (prisma) => {
      // Remove existing tag and category relations
      if (tags) {
        await prisma.postTag.deleteMany({
          where: { postId }
        });
      }
      
      if (categories) {
        await prisma.postCategory.deleteMany({
          where: { postId }
        });
      }

      // Update the post
      return await prisma.post.update({
        where: { id: postId },
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(excerpt !== undefined && { excerpt }),
          ...(coverImage !== undefined && { coverImage }),
          ...(published !== undefined && { 
            published, 
            publishedAt: published && !existingPost.published ? new Date() : existingPost.publishedAt 
          }),
          ...(scheduledFor !== undefined && { scheduledFor: scheduledFor ? new Date(scheduledFor) : null }),
          ...(seoTitle && { seoTitle }),
          ...(seoDescription && { seoDescription }),
          slug,
          readingTime,
          updatedAt: new Date(),
          // Reconnect tags and categories
          ...(tags && {
            tags: {
              create: tags.map(tagName => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: {
                      name: tagName,
                      slug: this.generateSlug(tagName)
                    }
                  }
                }
              }))
            }
          }),
          ...(categories && {
            categories: {
              create: categories.map(categoryName => ({
                category: {
                  connectOrCreate: {
                    where: { name: categoryName },
                    create: {
                      name: categoryName,
                      slug: this.generateSlug(categoryName)
                    }
                  }
                }
              }))
            }
          })
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
          tags: {
            include: {
              tag: true
            }
          },
          categories: {
            include: {
              category: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true
            }
          }
        }
      });
    });

    // Clear caches
    await this.clearPostCaches();
    await cache.del(`ugo:post:${existingPost.slug}`);
    if (slug !== existingPost.slug) {
      await cache.del(`ugo:post:${slug}`);
    }

    logger.info('Post updated:', { postId, userId, title: updatedPost.title });

    return updatedPost;
  }

  // Delete post
  async deletePost(postId, userId) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (post.authorId !== userId && !user.isAdmin) {
      throw new Error('Not authorized to delete this post');
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    // Clear caches
    await this.clearPostCaches();
    await cache.del(`ugo:post:${post.slug}`);

    logger.info('Post deleted:', { postId, userId, title: post.title });

    return { message: 'Post deleted successfully' };
  }

  // Like/Unlike post
  async toggleLike(postId, userId) {
    const existingLike = await prisma.like.findFirst({
      where: {
        postId,
        userId
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      
      // Clear post cache
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (post) {
        await cache.del(`ugo:post:${post.slug}:${userId}`);
      }

      return { liked: false, message: 'Post unliked' };
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId,
          userId
        }
      });

      // Clear post cache
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (post) {
        await cache.del(`ugo:post:${post.slug}:${userId}`);
      }

      // Award points for liking
      await prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: 5
          }
        }
      });

      return { liked: true, message: 'Post liked' };
    }
  }

  // Share post
  async sharePost(postId, userId, platform = null) {
    await prisma.share.create({
      data: {
        postId,
        userId,
        platform
      }
    });

    // Award points for sharing
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: 10
        }
      }
    });

    // Clear post cache
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post) {
      await cache.del(`ugo:post:${post.slug}:${userId}`);
    }

    logger.info('Post shared:', { postId, userId, platform });

    return { message: 'Post shared successfully' };
  }

  // Get popular posts
  async getPopularPosts(limit = 5) {
    const cacheKey = `popular-posts:${limit}`;
    
    let posts = await cache.getWithPattern(cacheKey);
    if (posts) {
      return posts;
    }

    // Get posts with most likes in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    posts = await prisma.post.findMany({
      where: {
        published: true,
        publishedAt: {
          gte: thirtyDaysAgo
        }
      },
      take: limit,
      orderBy: [
        { likes: { _count: 'desc' } },
        { views: 'desc' },
        { publishedAt: 'desc' }
      ],
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
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    });

    // Cache for 1 hour
    await cache.setWithPattern(cacheKey, posts, 3600);

    return posts;
  }

  // Get related posts
  async getRelatedPosts(postId, limit = 3) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
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
      return [];
    }

    const tagNames = post.tags.map(pt => pt.tag.name);
    const categoryNames = post.categories.map(pc => pc.category.name);

    const relatedPosts = await prisma.post.findMany({
      where: {
        id: { not: postId },
        published: true,
        OR: [
          {
            tags: {
              some: {
                tag: {
                  name: { in: tagNames }
                }
              }
            }
          },
          {
            categories: {
              some: {
                category: {
                  name: { in: categoryNames }
                }
              }
            }
          }
        ]
      },
      take: limit,
      orderBy: {
        publishedAt: 'desc'
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
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    return relatedPosts;
  }

  // Helper methods
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')  
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  async ensureUniqueSlug(baseSlug, excludeId = null) {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingPost = await prisma.post.findFirst({
        where: {
          slug,
          ...(excludeId && { id: { not: excludeId } })
        }
      });

      if (!existingPost) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async incrementViewCount(postId) {
    await prisma.post.update({
      where: { id: postId },
      data: {
        views: {
          increment: 1
        }
      }
    });

    // Update analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.postAnalytics.upsert({
      where: {
        postId_date: {
          postId,
          date: today
        }
      },
      update: {
        views: {
          increment: 1
        }
      },
      create: {
        postId,
        date: today,
        views: 1
      }
    });
  }

  async clearPostCaches() {
    // Clear all post-related caches
    const keys = await cache.keys('ugo:posts:*');
    if (keys.length > 0) {
      await cache.del(keys);
    }
  }
}

module.exports = new PostService();
