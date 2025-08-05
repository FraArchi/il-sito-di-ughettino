const Joi = require('joi');

// Create post validation
const createPostSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  
  content: Joi.string()
    .min(50)
    .required()
    .messages({
      'string.min': 'Content must be at least 50 characters long',
      'any.required': 'Content is required'
    }),
  
  excerpt: Joi.string()
    .max(300)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Excerpt cannot exceed 300 characters'
    }),
  
  coverImage: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Cover image must be a valid URL'
    }),
  
  published: Joi.boolean()
    .optional()
    .default(false),
  
  featured: Joi.boolean()
    .optional()
    .default(false),
  
  scheduledFor: Joi.date()
    .optional()
    .allow(null)
    .min('now')
    .messages({
      'date.min': 'Scheduled date must be in the future'
    }),
  
  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed',
      'string.max': 'Each tag cannot exceed 30 characters'
    }),
  
  categories: Joi.array()
    .items(Joi.string().max(50))
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 categories allowed',
      'string.max': 'Each category cannot exceed 50 characters'
    }),
  
  seoTitle: Joi.string()
    .max(60)
    .optional()
    .allow('')
    .messages({
      'string.max': 'SEO title cannot exceed 60 characters'
    }),
  
  seoDescription: Joi.string()
    .max(160)
    .optional()
    .allow('')
    .messages({
      'string.max': 'SEO description cannot exceed 160 characters'
    })
});

// Update post validation (all fields optional)
const updatePostSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  content: Joi.string()
    .min(50)
    .optional()
    .messages({
      'string.min': 'Content must be at least 50 characters long'
    }),
  
  excerpt: Joi.string()
    .max(300)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Excerpt cannot exceed 300 characters'
    }),
  
  coverImage: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Cover image must be a valid URL'
    }),
  
  published: Joi.boolean()
    .optional(),
  
  featured: Joi.boolean()
    .optional(),
  
  scheduledFor: Joi.date()
    .optional()
    .allow(null)
    .messages({
      'date.base': 'Scheduled date must be a valid date'
    }),
  
  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed',
      'string.max': 'Each tag cannot exceed 30 characters'
    }),
  
  categories: Joi.array()
    .items(Joi.string().max(50))
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 categories allowed',
      'string.max': 'Each category cannot exceed 50 characters'
    }),
  
  seoTitle: Joi.string()
    .max(60)
    .optional()
    .allow('')
    .messages({
      'string.max': 'SEO title cannot exceed 60 characters'
    }),
  
  seoDescription: Joi.string()
    .max(160)
    .optional()
    .allow('')
    .messages({
      'string.max': 'SEO description cannot exceed 160 characters'
    })
});

// Share post validation
const sharePostSchema = Joi.object({
  platform: Joi.string()
    .valid('facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'email', 'copy')
    .optional()
    .messages({
      'any.only': 'Platform must be one of: facebook, twitter, linkedin, whatsapp, telegram, email, copy'
    })
});

// Query params validation for getting posts
const getPostsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50'
    }),
  
  published: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'Published must be true or false'
    }),
  
  featured: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'Featured must be true or false'
    }),
  
  author: Joi.string()
    .optional(),
  
  tag: Joi.string()
    .optional(),
  
  category: Joi.string()
    .optional(),
  
  search: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query must be at least 2 characters long',
      'string.max': 'Search query cannot exceed 100 characters'
    }),
  
  sortBy: Joi.string()
    .valid('publishedAt', 'createdAt', 'updatedAt', 'title', 'views')
    .optional()
    .default('publishedAt')
    .messages({
      'any.only': 'Sort by must be one of: publishedAt, createdAt, updatedAt, title, views'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc'
    })
});

// Validation middleware factory
const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : req.body;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace the source with sanitized data
    if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }
    
    next();
  };
};

// Individual validation middleware
const validateCreatePost = validateRequest(createPostSchema);
const validateUpdatePost = validateRequest(updatePostSchema);
const validateSharePost = validateRequest(sharePostSchema);
const validateGetPostsQuery = validateRequest(getPostsQuerySchema, 'query');

// Slug validation middleware
const validateSlug = (req, res, next) => {
  const { slug } = req.params;
  
  if (!slug || slug.length < 1 || slug.length > 200) {
    return res.status(400).json({
      success: false,
      error: 'Invalid slug format'
    });
  }
  
  // Check if slug contains only valid characters
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    return res.status(400).json({
      success: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens'
    });
  }
  
  next();
};

// ID validation middleware
const validateId = (req, res, next) => {
  const { id } = req.params;
  
  // Check if it's a valid CUID (Prisma default)
  const cuidRegex = /^c[a-z0-9]{24}$/;
  if (!cuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid post ID format'
    });
  }
  
  next();
};

module.exports = {
  createPostSchema,
  updatePostSchema,
  sharePostSchema,
  getPostsQuerySchema,
  validateCreatePost,
  validateUpdatePost,
  validateSharePost,
  validateGetPostsQuery,
  validateSlug,
  validateId,
  validateRequest
};
