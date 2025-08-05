const express = require('express');
const postController = require('../controllers/postController');
const { authMiddleware, adminOnly, optionalAuth } = require('../middleware/authMiddleware');
const {
  validateCreatePost,
  validateUpdatePost,
  validateSharePost,
  validateGetPostsQuery,
  validateSlug,
  validateId
} = require('../validators/postValidators');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         excerpt:
 *           type: string
 *         slug:
 *           type: string
 *         coverImage:
 *           type: string
 *         published:
 *           type: boolean
 *         featured:
 *           type: boolean
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         views:
 *           type: integer
 *         readingTime:
 *           type: integer
 *         author:
 *           $ref: '#/components/schemas/User'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *         _count:
 *           type: object
 *           properties:
 *             likes:
 *               type: integer
 *             comments:
 *               type: integer
 *             shares:
 *               type: integer
 *     
 *     CreatePostRequest:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *         content:
 *           type: string
 *           minLength: 50
 *         excerpt:
 *           type: string
 *           maxLength: 300
 *         coverImage:
 *           type: string
 *           format: uri
 *         published:
 *           type: boolean
 *           default: false
 *         featured:
 *           type: boolean
 *           default: false
 *         scheduledFor:
 *           type: string
 *           format: date-time
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 10
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 5
 *         seoTitle:
 *           type: string
 *           maxLength: 60
 *         seoDescription:
 *           type: string
 *           maxLength: 160
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: published
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: featured
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [publishedAt, createdAt, updatedAt, title, views]
 *           default: publishedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 */
router.get('/', validateGetPostsQuery, optionalAuth, postController.getPosts);

/**
 * @swagger
 * /api/posts/popular:
 *   get:
 *     summary: Get popular posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *     responses:
 *       200:
 *         description: Popular posts retrieved successfully
 */
router.get('/popular', postController.getPopularPosts);

/**
 * @swagger
 * /api/posts/my:
 *   get:
 *     summary: Get current user's posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: published
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: User posts retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/my', authMiddleware, postController.getMyPosts);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post (Admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostRequest'
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.post('/', authMiddleware, adminOnly, validateCreatePost, postController.createPost);

/**
 * @swagger
 * /api/posts/{slug}:
 *   get:
 *     summary: Get post by slug
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     post:
 *                       $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 */
router.get('/:slug', validateSlug, optionalAuth, postController.getPost);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostRequest'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to update this post
 *       404:
 *         description: Post not found
 */
router.put('/:id', validateId, authMiddleware, validateUpdatePost, postController.updatePost);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to delete this post
 *       404:
 *         description: Post not found
 */
router.delete('/:id', validateId, authMiddleware, postController.deletePost);

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Like/Unlike post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *       401:
 *         description: Authentication required
 */
router.post('/:id/like', validateId, authMiddleware, postController.toggleLike);

/**
 * @swagger
 * /api/posts/{id}/share:
 *   post:
 *     summary: Share post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [facebook, twitter, linkedin, whatsapp, telegram, email, copy]
 *     responses:
 *       200:
 *         description: Post shared successfully
 *       401:
 *         description: Authentication required
 */
router.post('/:id/share', validateId, authMiddleware, validateSharePost, postController.sharePost);

/**
 * @swagger
 * /api/posts/{id}/related:
 *   get:
 *     summary: Get related posts
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 3
 *     responses:
 *       200:
 *         description: Related posts retrieved successfully
 */
router.get('/:id/related', validateId, postController.getRelatedPosts);

/**
 * @swagger
 * /api/posts/{id}/analytics:
 *   get:
 *     summary: Get post analytics (Admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *     responses:
 *       200:
 *         description: Post analytics retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Post not found
 */
router.get('/:id/analytics', validateId, authMiddleware, adminOnly, postController.getPostAnalytics);

/**
 * @swagger
 * /api/posts/{id}/preview:
 *   get:
 *     summary: Preview post (including drafts)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post preview retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to preview this post
 *       404:
 *         description: Post not found
 */
router.get('/:id/preview', validateId, authMiddleware, postController.previewPost);

module.exports = router;
