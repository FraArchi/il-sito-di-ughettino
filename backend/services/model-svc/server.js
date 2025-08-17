const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class LlamaCppModelService {
  constructor() {
    this.app = express();
    this.port = process.env.MODEL_SVC_PORT || 9000;
    this.modelPath = process.env.MODEL_PATH || '/models/mistral-7b-q4.gguf';
    this.nThreads = parseInt(process.env.N_THREADS) || this.getOptimalThreads();
    this.maxTokens = parseInt(process.env.MAX_TOKENS) || 120;
    this.temperature = parseFloat(process.env.TEMPERATURE) || 0.7;
    this.topP = parseFloat(process.env.TOP_P) || 0.9;
    this.topK = parseInt(process.env.TOP_K) || 40;
    this.repeatPenalty = parseFloat(process.env.REPEAT_PENALTY) || 1.1;
    this.contextSize = parseInt(process.env.CONTEXT_SIZE) || 2048;
    
    this.llamaCppPath = process.env.LLAMA_CPP_PATH || '/usr/local/bin/llama-cpp-server';
    this.isModelLoaded = false;
    this.llamaProcess = null;
    this.modelStats = {
      requests: 0,
      avgLatency: 0,
      totalLatency: 0,
      errors: 0
    };
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  getOptimalThreads() {
    const os = require('os');
    const cpus = os.cpus().length;
    // Use 70% of physical cores for optimal performance
    return Math.max(1, Math.floor(cpus * 0.7));
  }
  
  setupMiddleware() {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    
    // Compression
    this.app.use(compression());
    
    // Logging
    this.app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      message: 'Too many requests from this IP'
    });
    this.app.use('/generate', limiter);
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        modelLoaded: this.isModelLoaded,
        modelPath: this.modelPath,
        stats: this.modelStats,
        config: {
          nThreads: this.nThreads,
          maxTokens: this.maxTokens,
          temperature: this.temperature,
          topP: this.topP
        }
      });
    });
    
    // Model info
    this.app.get('/model/info', (req, res) => {
      res.json({
        modelPath: this.modelPath,
        isLoaded: this.isModelLoaded,
        config: {
          nThreads: this.nThreads,
          maxTokens: this.maxTokens,
          temperature: this.temperature,
          topP: this.topP,
          topK: this.topK,
          repeatPenalty: this.repeatPenalty,
          contextSize: this.contextSize
        },
        stats: this.modelStats
      });
    });
    
    // Generate text
    this.app.post('/generate', async (req, res) => {
      const startTime = Date.now();
      
      try {
        if (!this.isModelLoaded) {
          return res.status(503).json({
            error: 'Model not loaded',
            message: 'Please wait for model to load'
          });
        }
        
        const { 
          prompt, 
          max_tokens = this.maxTokens,
          temperature = this.temperature,
          top_p = this.topP,
          top_k = this.topK,
          repeat_penalty = this.repeatPenalty,
          stop = []
        } = req.body;
        
        if (!prompt) {
          return res.status(400).json({
            error: 'Missing prompt',
            message: 'Prompt is required'
          });
        }
        
        if (prompt.length > 8000) {
          return res.status(400).json({
            error: 'Prompt too long',
            message: 'Prompt must be less than 8000 characters'
          });
        }
        
        const response = await this.generateText({
          prompt,
          max_tokens,
          temperature,
          top_p,
          top_k,
          repeat_penalty,
          stop
        });
        
        const latency = Date.now() - startTime;
        this.updateStats(latency);
        
        res.json({
          text: response,
          metadata: {
            model: 'mistral-7b-q4',
            latency_ms: latency,
            tokens: response.split(' ').length,
            config: {
              temperature,
              top_p,
              max_tokens
            }
          }
        });
        
      } catch (error) {
        const latency = Date.now() - startTime;
        this.modelStats.errors++;
        
        logger.error('Generation error:', error);
        res.status(500).json({
          error: 'Generation failed',
          message: error.message,
          latency_ms: latency
        });
      }
    });
    
    // Statistics
    this.app.get('/stats', (req, res) => {
      res.json({
        ...this.modelStats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        modelPath: this.modelPath,
        isLoaded: this.isModelLoaded
      });
    });
    
    // Reset statistics
    this.app.post('/stats/reset', (req, res) => {
      this.modelStats = {
        requests: 0,
        avgLatency: 0,
        totalLatency: 0,
        errors: 0
      };
      res.json({ message: 'Stats reset successfully' });
    });
  }
  
  async generateText(params) {
    return new Promise((resolve, reject) => {
      const args = [
        '--model', this.modelPath,
        '--threads', this.nThreads.toString(),
        '--ctx-size', this.contextSize.toString(),
        '--temp', params.temperature.toString(),
        '--top-p', params.top_p.toString(),
        '--top-k', params.top_k.toString(),
        '--repeat-penalty', params.repeat_penalty.toString(),
        '--n-predict', params.max_tokens.toString(),
        '--prompt', params.prompt,
        '--no-display-prompt',
        '--color'
      ];
      
      if (params.stop && params.stop.length > 0) {
        params.stop.forEach(stopWord => {
          args.push('--reverse-prompt', stopWord);
        });
      }
      
      logger.info('Executing llama.cpp with args:', args.slice(0, 10).join(' ') + '...');
      
      const llamaProcess = spawn(this.llamaCppPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let error = '';
      
      llamaProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      llamaProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      llamaProcess.on('close', (code) => {
        if (code === 0) {
          // Clean output - remove llama.cpp specific formatting
          const cleanOutput = this.cleanLlamaOutput(output);
          resolve(cleanOutput);
        } else {
          logger.error('llama.cpp process error:', error);
          reject(new Error(`llama.cpp exited with code ${code}: ${error}`));
        }
      });
      
      llamaProcess.on('error', (err) => {
        logger.error('Failed to start llama.cpp process:', err);
        reject(err);
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (!llamaProcess.killed) {
          llamaProcess.kill('SIGKILL');
          reject(new Error('Generation timeout'));
        }
      }, 30000);
    });
  }
  
  cleanLlamaOutput(rawOutput) {
    // Remove llama.cpp specific output patterns
    let cleaned = rawOutput
      .replace(/llama_print_timings:[\s\S]*$/g, '') // Remove timing info
      .replace(/^.*?(\n|\r\n)/g, '') // Remove first line (usually metadata)
      .replace(/\[end of text\]/g, '')
      .replace(/<\|end\|>/g, '')
      .replace(/<\|im_end\|>/g, '')
      .trim();
    
    return cleaned;
  }
  
  updateStats(latency) {
    this.modelStats.requests++;
    this.modelStats.totalLatency += latency;
    this.modelStats.avgLatency = this.modelStats.totalLatency / this.modelStats.requests;
  }
  
  async loadModel() {
    try {
      logger.info('Loading model:', this.modelPath);
      
      // Check if model file exists
      await fs.access(this.modelPath);
      
      // Check if llama.cpp executable exists
      await fs.access(this.llamaCppPath);
      
      // Test model with a simple prompt
      await this.generateText({
        prompt: 'Test.',
        max_tokens: 5,
        temperature: 0.1,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        stop: []
      });
      
      this.isModelLoaded = true;
      logger.info('Model loaded successfully');
      
    } catch (error) {
      logger.error('Failed to load model:', error);
      throw error;
    }
  }
  
  async start() {
    try {
      logger.info('Starting Ugo Model Service...');
      logger.info('Configuration:', {
        modelPath: this.modelPath,
        nThreads: this.nThreads,
        maxTokens: this.maxTokens,
        temperature: this.temperature
      });
      
      // Load the model
      await this.loadModel();
      
      // Start the server
      this.app.listen(this.port, () => {
        logger.info(`🐕 Ugo Model Service running on port ${this.port}`);
        logger.info(`Model: ${this.modelPath}`);
        logger.info(`Threads: ${this.nThreads}`);
      });
      
    } catch (error) {
      logger.error('Failed to start model service:', error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down model service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down model service...');
  process.exit(0);
});

// Start the service
const modelService = new LlamaCppModelService();
modelService.start();
