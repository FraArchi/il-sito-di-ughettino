const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { cache } = require('../config/redis');
const emailService = require('./emailService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class AuthService {
  // Generate JWT tokens
  generateTokens(userId) {
    const payload = { userId };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '15m'
    });
    
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
    
    return { accessToken, refreshToken };
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate secure random token
  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Register new user
  async register(userData) {
    const { email, username, password, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username.toLowerCase()) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = this.generateSecureToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        emailVerificationToken,
        isVerified: process.env.NODE_ENV === 'development' // Auto-verify in dev
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        createdAt: true
      }
    });

    // Send verification email (only in production)
    if (process.env.NODE_ENV === 'production') {
      await emailService.sendVerificationEmail(user, emailVerificationToken);
    }

    // Log user registration
    logger.info('User registered:', { userId: user.id, email: user.email });

    return user;
  }

  // Login user
  async login(email, password, ipAddress, userAgent) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        sessions: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account has been deactivated');
    }

    // Check password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email address');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id);

    // Clean up old sessions (keep only 5 most recent)
    if (user.sessions.length >= 5) {
      const oldSessions = user.sessions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(4);
      
      await prisma.userSession.deleteMany({
        where: {
          id: {
            in: oldSessions.map(s => s.id)
          }
        }
      });
    }

    // Create new session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt,
        ipAddress,
        userAgent
      }
    });

    // Update last login and streak
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newStreak = user.streak;
    if (user.lastLogin) {
      const lastLoginDate = new Date(user.lastLogin);
      const daysDiff = Math.floor((now - lastLoginDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day login
        newStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken
        newStreak = 1;
      }
      // Same day login doesn't change streak
    } else {
      // First login
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: now,
        lastActivity: now,
        streak: newStreak
      }
    });

    // Cache user data
    const userForCache = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      isActive: user.isActive,
      points: user.points,
      level: user.level,
      streak: newStreak
    };

    await cache.setWithPattern(`user:${user.id}`, userForCache, 900);

    // Log successful login
    logger.info('User logged in:', { 
      userId: user.id, 
      email: user.email, 
      ipAddress,
      streak: newStreak
    });

    return {
      user: userForCache,
      tokens: { accessToken, refreshToken }
    };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Find session
      const session = await prisma.userSession.findFirst({
        where: {
          refreshToken,
          userId: decoded.userId,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isAdmin: true,
              isVerified: true,
              isActive: true,
              points: true,
              level: true,
              streak: true
            }
          }
        }
      });

      if (!session || !session.user.isActive || !session.user.isVerified) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(session.userId);

      // Update session
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });

      // Update cache
      await cache.setWithPattern(`user:${session.user.id}`, session.user, 900);

      return {
        user: session.user,
        tokens
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Logout user
  async logout(token, refreshToken) {
    try {
      // Add token to blacklist
      await cache.set(`blacklist:${token}`, true, 900); // 15 minutes

      // Remove session
      if (refreshToken) {
        await prisma.userSession.deleteMany({
          where: { refreshToken }
        });
      }

      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  // Verify email
  async verifyEmail(token) {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    if (user.isVerified) {
      throw new Error('Email already verified');
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null
      }
    });

    // Award registration achievement
    await this.awardAchievement(user.id, 'first-friend');

    logger.info('Email verified:', { userId: user.id, email: user.email });

    return { message: 'Email verified successfully' };
  }

  // Resend verification email
  async resendVerification(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isVerified) {
      throw new Error('Email already verified');
    }

    // Generate new token
    const emailVerificationToken = this.generateSecureToken();

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken }
    });

    // Send verification email
    await emailService.sendVerificationEmail(user, emailVerificationToken);

    return { message: 'Verification email sent' };
  }

  // Forgot password
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = this.generateSecureToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(user, resetToken);

    logger.info('Password reset requested:', { userId: user.id, email: user.email });

    return { message: 'If the email exists, a reset link has been sent' };
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    // Invalidate all sessions
    await prisma.userSession.deleteMany({
      where: { userId: user.id }
    });

    // Remove user from cache
    await cache.del(`ugo:user:${user.id}`);

    logger.info('Password reset successful:', { userId: user.id, email: user.email });

    return { message: 'Password reset successful' };
  }

  // Helper method to award achievements
  async awardAchievement(userId, achievementKey) {
    try {
      const achievement = await prisma.achievement.findFirst({
        where: { name: achievementKey }
      });

      if (!achievement) return;

      // Check if user already has this achievement
      const existing = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementId: achievement.id
        }
      });

      if (!existing) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id
          }
        });

        // Award points
        await prisma.user.update({
          where: { id: userId },
          data: {
            points: {
              increment: achievement.points
            }
          }
        });

        logger.info('Achievement awarded:', { 
          userId, 
          achievement: achievement.name, 
          points: achievement.points 
        });
      }
    } catch (error) {
      logger.error('Award achievement error:', error);
    }
  }
}

module.exports = new AuthService();
