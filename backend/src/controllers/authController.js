const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const userData = req.body;
      const user = await authService.register(userData);

      res.status(201).json({
        success: true,
        message: process.env.NODE_ENV === 'development' 
          ? 'User registered and verified successfully' 
          : 'User registered successfully. Please check your email to verify your account.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified
          }
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await authService.login(email, password, ipAddress, userAgent);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  // Refresh access token
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token not provided'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      // Set new refresh token as cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken
        }
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      const token = req.token;
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      await authService.logout(token, refreshToken);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      const result = await authService.verifyEmail(token);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Resend verification email
  async resendVerification(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerification(email);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Resend verification error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Request password reset
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request'
      });
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get current user info
  async me(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      logger.error('Me endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user information'
      });
    }
  }

  // Check if email is available
  async checkEmail(req, res) {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      res.json({
        success: true,
        data: {
          available: !existingUser
        }
      });
    } catch (error) {
      logger.error('Check email error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check email availability'
      });
    }
  }

  // Check if username is available
  async checkUsername(req, res) {
    try {
      const { username } = req.query;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          error: 'Username is required'
        });
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const existingUser = await prisma.user.findUnique({
        where: { username: username.toLowerCase() }
      });

      res.json({
        success: true,
        data: {
          available: !existingUser
        }
      });
    } catch (error) {
      logger.error('Check username error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check username availability'
      });
    }
  }
}

module.exports = new AuthController();
