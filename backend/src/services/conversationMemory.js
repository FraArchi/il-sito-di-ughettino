const { cache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * CONVERSATION MEMORY SYSTEM
 * 
 * Sistema di memoria conversazionale per Ugo AI
 * - Memoria a breve termine (sessione corrente)
 * - Memoria a lungo termine (persistente)
 * - Contesto intelligente per risposte coerenti
 * - Analisi pattern conversazionali
 */
class ConversationMemory {
  constructor() {
    this.shortTermMemory = new Map(); // Memoria sessione corrente
    this.maxShortTermSize = 20; // Numero massimo messaggi in memoria breve
    this.maxLongTermSize = 100; // Numero massimo conversazioni archiviate
  }

  /**
   * Salva scambio conversazionale
   */
  async saveExchange(userId, sessionId, exchangeData) {
    try {
      const exchange = {
        id: this.generateExchangeId(),
        userId,
        sessionId: sessionId || 'default',
        timestamp: exchangeData.timestamp || new Date(),
        userMessage: exchangeData.userMessage,
        ugoResponse: exchangeData.ugoResponse,
        mood: exchangeData.mood || 'neutral',
        analysis: exchangeData.analysis || {},
        context: {
          messageLength: exchangeData.userMessage.length,
          responseLength: exchangeData.ugoResponse.length,
          topics: this.extractTopics(exchangeData.userMessage),
          entities: exchangeData.analysis?.entities || {}
        }
      };

      // Salva in memoria breve termine
      await this.saveToShortTerm(userId, sessionId, exchange);
      
      // Salva in memoria lungo termine
      await this.saveToLongTerm(userId, exchange);
      
      // Aggiorna pattern conversazionali
      await this.updateConversationPatterns(userId, exchange);
      
      logger.debug(`Saved conversation exchange for user ${userId}`);
      
    } catch (error) {
      logger.error('Error saving conversation exchange:', error);
    }
  }

  /**
   * Recupera contesto conversazionale
   */
  async getContext(userId, sessionId = 'default', maxMessages = 10) {
    try {
      // Recupera memoria breve termine
      const shortTermKey = `ugo-memory:short:${userId}:${sessionId}`;
      const shortTerm = await cache.getWithPattern(shortTermKey) || [];
      
      // Recupera memoria lungo termine rilevante
      const longTerm = await this.getRelevantLongTerm(userId, maxMessages);
      
      // Combina e ordina per timestamp
      const combined = [...shortTerm, ...longTerm]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-maxMessages);
      
      return combined;
      
    } catch (error) {
      logger.error('Error getting conversation context:', error);
      return [];
    }
  }

  /**
   * Salva in memoria breve termine (Redis)
   */
  async saveToShortTerm(userId, sessionId, exchange) {
    const shortTermKey = `ugo-memory:short:${userId}:${sessionId}`;
    
    let shortTerm = await cache.getWithPattern(shortTermKey) || [];
    shortTerm.push(exchange);
    
    // Mantieni solo ultimi N messaggi
    if (shortTerm.length > this.maxShortTermSize) {
      shortTerm = shortTerm.slice(-this.maxShortTermSize);
    }
    
    // Cache per 24 ore
    await cache.setWithPattern(shortTermKey, shortTerm, 86400);
  }

  /**
   * Salva in memoria lungo termine (Database)
   */
  async saveToLongTerm(userId, exchange) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Salva solo conversazioni significative
      const isSignificant = this.isSignificantConversation(exchange);
      
      if (isSignificant) {
        await prisma.conversation.create({
          data: {
            userId: userId,
            sessionId: exchange.sessionId,
            userMessage: exchange.userMessage,
            ugoResponse: exchange.ugoResponse,
            mood: exchange.mood,
            sentiment: exchange.analysis?.sentiment || 'neutral',
            intent: exchange.analysis?.intent || 'general',
            entities: JSON.stringify(exchange.analysis?.entities || {}),
            topics: JSON.stringify(exchange.context?.topics || []),
            rating: null, // Sarà aggiornato con feedback utente
            metadata: JSON.stringify({
              messageLength: exchange.context?.messageLength,
              responseLength: exchange.context?.responseLength,
              hasEmoji: exchange.analysis?.hasEmoji || false
            })
          }
        });
        
        // Pulisci vecchie conversazioni se necessario
        await this.cleanupOldConversations(userId);
      }
      
    } catch (error) {
      logger.error('Error saving to long term memory:', error);
    }
  }

  /**
   * Determina se una conversazione è significativa
   */
  isSignificantConversation(exchange) {
    // Criteri per conversazioni significative:
    
    // 1. Messaggi lunghi (più coinvolgimento)
    if (exchange.userMessage.length > 30) return true;
    
    // 2. Domande dirette su Ugo
    if (exchange.analysis?.isQuestionAboutUgo) return true;
    
    // 3. Messaggi emotivi (sentiment forte)
    if (exchange.analysis?.sentiment !== 'neutral') return true;
    
    // 4. Contengono entità interessanti
    if (exchange.analysis?.entities && 
        (exchange.analysis.entities.people.length > 0 || 
         exchange.analysis.entities.places.length > 0)) return true;
    
    // 5. Intent specifici
    const significantIntents = ['story', 'affection', 'question', 'play'];
    if (significantIntents.includes(exchange.analysis?.intent)) return true;
    
    return false;
  }

  /**
   * Recupera memoria lungo termine rilevante
   */
  async getRelevantLongTerm(userId, limit = 5) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Recupera conversazioni recenti e ben valutate
      const conversations = await prisma.conversation.findMany({
        where: {
          userId: userId,
          OR: [
            { rating: { gte: 4 } }, // Conversazioni ben valutate
            { 
              createdAt: { 
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Ultimi 7 giorni
              } 
            }
          ]
        },
        orderBy: [
          { rating: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });
      
      return conversations.map(conv => ({
        id: conv.id,
        userId: conv.userId,
        sessionId: conv.sessionId,
        timestamp: conv.createdAt,
        userMessage: conv.userMessage,
        ugoResponse: conv.ugoResponse,
        mood: conv.mood,
        analysis: {
          sentiment: conv.sentiment,
          intent: conv.intent,
          entities: JSON.parse(conv.entities || '{}')
        },
        context: {
          topics: JSON.parse(conv.topics || '[]'),
          rating: conv.rating,
          ...JSON.parse(conv.metadata || '{}')
        }
      }));
      
    } catch (error) {
      logger.error('Error getting relevant long term memory:', error);
      return [];
    }
  }

  /**
   * Estrae topics dal messaggio
   */
  extractTopics(message) {
    const topics = [];
    const lowerMessage = message.toLowerCase();
    
    // Topics comuni
    const topicKeywords = {
      'gioco': ['giocare', 'gioco', 'palla', 'divertimento', 'correre'],
      'cibo': ['mangiare', 'cibo', 'fame', 'biscotto', 'premio', 'croccantini'],
      'passeggiata': ['passeggiata', 'uscire', 'parco', 'camminare', 'guinzaglio'],
      'famiglia': ['famiglia', 'casa', 'francesco', 'mamma', 'papà'],
      'avventure': ['avventura', 'bosco', 'esplorare', 'scoprire', 'viaggio'],
      'emozioni': ['felice', 'triste', 'arrabbiato', 'eccitato', 'preoccupato'],
      'salute': ['veterinario', 'male', 'bene', 'malato', 'medicina'],
      'altri_animali': ['gatto', 'uccello', 'scoiattolo', 'coniglio', 'animali']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics;
  }

  /**
   * Aggiorna pattern conversazionali dell'utente
   */
  async updateConversationPatterns(userId, exchange) {
    try {
      const patternKey = `ugo-patterns:${userId}`;
      let patterns = await cache.getWithPattern(patternKey) || {
        totalConversations: 0,
        averageMessageLength: 0,
        commonTopics: {},
        commonIntents: {},
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        timePatterns: {},
        responsePreferences: {}
      };
      
      // Aggiorna statistiche
      patterns.totalConversations++;
      
      // Media lunghezza messaggio
      patterns.averageMessageLength = 
        (patterns.averageMessageLength * (patterns.totalConversations - 1) + 
         exchange.userMessage.length) / patterns.totalConversations;
      
      // Topics comuni
      exchange.context.topics.forEach(topic => {
        patterns.commonTopics[topic] = (patterns.commonTopics[topic] || 0) + 1;
      });
      
      // Intent comuni
      const intent = exchange.analysis?.intent || 'general';
      patterns.commonIntents[intent] = (patterns.commonIntents[intent] || 0) + 1;
      
      // Distribuzione sentiment
      const sentiment = exchange.analysis?.sentiment || 'neutral';
      patterns.sentimentDistribution[sentiment]++;
      
      // Pattern temporali
      const hour = new Date(exchange.timestamp).getHours();
      const timeSlot = this.getTimeSlot(hour);
      patterns.timePatterns[timeSlot] = (patterns.timePatterns[timeSlot] || 0) + 1;
      
      // Salva pattern aggiornati (cache per 30 giorni)
      await cache.setWithPattern(patternKey, patterns, 2592000);
      
    } catch (error) {
      logger.error('Error updating conversation patterns:', error);
    }
  }

  getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'mattina';
    if (hour >= 12 && hour < 18) return 'pomeriggio';
    if (hour >= 18 && hour < 22) return 'sera';
    return 'notte';
  }

  /**
   * Ottieni pattern conversazionali utente
   */
  async getUserPatterns(userId) {
    try {
      const patternKey = `ugo-patterns:${userId}`;
      const patterns = await cache.getWithPattern(patternKey);
      
      if (!patterns) {
        return {
          totalConversations: 0,
          insights: ['Utente nuovo, sto ancora imparando le sue preferenze'],
          preferences: {}
        };
      }
      
      // Genera insights basati sui pattern
      const insights = this.generateInsights(patterns);
      
      return {
        ...patterns,
        insights,
        preferences: this.extractPreferences(patterns)
      };
      
    } catch (error) {
      logger.error('Error getting user patterns:', error);
      return { totalConversations: 0, insights: [], preferences: {} };
    }
  }

  generateInsights(patterns) {
    const insights = [];
    
    // Topic preferiti
    const topTopics = Object.entries(patterns.commonTopics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (topTopics.length > 0) {
      insights.push(`Parla spesso di: ${topTopics.map(([topic]) => topic).join(', ')}`);
    }
    
    // Sentiment dominante
    const dominantSentiment = Object.entries(patterns.sentimentDistribution)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (dominantSentiment[1] > patterns.totalConversations * 0.4) {
      const sentimentMap = {
        positive: 'È spesso di buon umore',
        negative: 'A volte sembra triste, do extra coccole',
        neutral: 'Ha un temperamento equilibrato'
      };
      insights.push(sentimentMap[dominantSentiment[0]]);
    }
    
    // Pattern temporali
    const topTimeSlot = Object.entries(patterns.timePatterns)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topTimeSlot && topTimeSlot[1] > patterns.totalConversations * 0.3) {
      insights.push(`È più attivo di ${topTimeSlot[0]}`);
    }
    
    // Lunghezza messaggi
    if (patterns.averageMessageLength > 50) {
      insights.push('Gli piace fare conversazioni lunghe');
    } else if (patterns.averageMessageLength < 20) {
      insights.push('Preferisce messaggi brevi e diretti');
    }
    
    return insights;
  }

  extractPreferences(patterns) {
    return {
      preferredTopics: Object.keys(patterns.commonTopics).slice(0, 5),
      communicationStyle: patterns.averageMessageLength > 30 ? 'detailed' : 'concise',
      emotionalTone: Object.entries(patterns.sentimentDistribution)
        .sort(([,a], [,b]) => b - a)[0][0],
      activeTimeSlots: Object.keys(patterns.timePatterns).slice(0, 2)
    };
  }

  /**
   * Aggiorna rating conversazione
   */
  async updateConversationRating(userId, conversationId, rating) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { rating }
      });
      
      logger.info(`Updated conversation ${conversationId} rating: ${rating}`);
      
    } catch (error) {
      logger.error('Error updating conversation rating:', error);
    }
  }

  /**
   * Pulisci vecchie conversazioni
   */
  async cleanupOldConversations(userId) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const totalConversations = await prisma.conversation.count({
        where: { userId }
      });
      
      if (totalConversations > this.maxLongTermSize) {
        // Mantieni solo le migliori e più recenti
        const toDelete = totalConversations - this.maxLongTermSize;
        
        const oldConversations = await prisma.conversation.findMany({
          where: { userId },
          orderBy: [
            { rating: 'asc' },
            { createdAt: 'asc' }
          ],
          take: toDelete
        });
        
        const idsToDelete = oldConversations.map(conv => conv.id);
        
        await prisma.conversation.deleteMany({
          where: { id: { in: idsToDelete } }
        });
        
        logger.info(`Cleaned up ${toDelete} old conversations for user ${userId}`);
      }
      
    } catch (error) {
      logger.error('Error cleaning up old conversations:', error);
    }
  }

  /**
   * Genera ID unico per exchange
   */
  generateExchangeId() {
    return `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ottieni statistiche memoria
   */
  async getMemoryStats(userId) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const longTermCount = await prisma.conversation.count({
        where: { userId }
      });
      
      const patterns = await this.getUserPatterns(userId);
      
      // Memoria breve termine
      const shortTermKeys = await cache.getKeys(`ugo-memory:short:${userId}:*`);
      let shortTermCount = 0;
      
      for (const key of shortTermKeys) {
        const memory = await cache.getWithPattern(key) || [];
        shortTermCount += memory.length;
      }
      
      return {
        shortTermMemory: shortTermCount,
        longTermMemory: longTermCount,
        totalConversations: patterns.totalConversations,
        memoryEfficiency: longTermCount / Math.max(patterns.totalConversations, 1),
        topTopics: Object.keys(patterns.commonTopics || {}).slice(0, 5),
        insights: patterns.insights
      };
      
    } catch (error) {
      logger.error('Error getting memory stats:', error);
      return {
        shortTermMemory: 0,
        longTermMemory: 0,
        totalConversations: 0,
        memoryEfficiency: 0,
        topTopics: [],
        insights: []
      };
    }
  }
}

module.exports = ConversationMemory;
