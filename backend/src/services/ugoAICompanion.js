const axios = require('axios');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

/**
 * UGO AI COMPANION - 100% Open Source AI Assistant
 * 
 * Caratteristiche:
 * - Personalità autentica di Ugo
 * - Memoria conversazionale persistente
 * - Sistema emotivo dinamico
 * - Processing locale con Ollama
 * - Privacy-first (nessun dato a terzi)
 */
class UgoAICompanion {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = 'llama3.1:8b';
    
    // Personalità di Ugo - Completamente customizzabile
    this.personality = new UgoPersonality();
    this.memory = new ConversationMemory();
    this.emotions = new EmotionEngine();
    this.contextBuilder = new UgoContextBuilder();
    
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      // Verifica che Ollama sia disponibile
      await this.checkOllamaHealth();
      
      // Carica il modello personalizzato di Ugo se esiste
      await this.loadUgoModel();
      
      this.isInitialized = true;
      logger.info('🐕 UgoAICompanion initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize UgoAICompanion:', error);
    }
  }

  /**
   * Chat principale con Ugo
   */
  async chat(userMessage, userId, sessionId = null) {
    if (!this.isInitialized) {
      throw new Error('UgoAICompanion not initialized');
    }

    try {
      // 1. Analizza sentiment e intento del messaggio
      const analysis = await this.analyzeMessage(userMessage);
      
      // 2. Recupera memoria conversazioni e contesto utente
      const context = await this.memory.getContext(userId, sessionId);
      const userProfile = await this.getUserProfile(userId);
      
      // 3. Aggiorna stato emotivo di Ugo basato su conversazione
      const currentMood = this.emotions.updateMood(analysis, context, userProfile);
      
      // 4. Costruisci prompt personalizzato
      const prompt = this.contextBuilder.buildUgoPrompt({
        userMessage,
        analysis,
        context,
        userProfile,
        mood: currentMood,
        personality: this.personality.getCurrentState()
      });
      
      // 5. Genera risposta con Ollama (Llama 3.1)
      const response = await this.generateResponse(prompt);
      
      // 6. Post-processing per coerenza e personalità
      const finalResponse = this.personality.filterAndEnhanceResponse(response, currentMood);
      
      // 7. Salva conversazione in memoria
      await this.memory.saveExchange(userId, sessionId, {
        userMessage,
        ugoResponse: finalResponse,
        mood: currentMood,
        timestamp: new Date(),
        analysis
      });
      
      // 8. Aggiorna profilo utente con nuove informazioni
      await this.updateUserProfile(userId, analysis, userMessage);
      
      return {
        response: finalResponse,
        mood: currentMood,
        personality: this.personality.getCurrentTraits(),
        context: {
          understanding: analysis,
          emotionalState: this.emotions.getEmotionalSummary(),
          conversationLength: context.length
        }
      };
      
    } catch (error) {
      logger.error('UgoAI chat error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Genera risposta con Ollama
   */
  async generateResponse(prompt) {
    const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
      model: this.model,
      prompt: prompt,
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: 200,
      stop: ['Human:', 'User:', '\n\n'],
      stream: false
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data.response;
  }

  /**
   * Analizza sentiment e intento del messaggio
   */
  async analyzeMessage(message) {
    // Analisi sentiment semplice ma efficace
    const sentiment = this.calculateSentiment(message);
    
    // Identifica intenti comuni
    const intent = this.identifyIntent(message);
    
    // Estrae entità (nomi, luoghi, emozioni)
    const entities = this.extractEntities(message);
    
    // Rileva domande su Ugo o richieste specifiche
    const isQuestionAboutUgo = this.isAboutUgo(message);
    
    return {
      sentiment,
      intent,
      entities,
      isQuestionAboutUgo,
      messageLength: message.length,
      hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(message)
    };
  }

  calculateSentiment(text) {
    const positiveWords = ['bello', 'bravo', 'fantastico', 'amore', 'carino', 'dolce', 'giocoso', 'felice', 'contento'];
    const negativeWords = ['triste', 'arrabbiato', 'cattivo', 'noioso', 'brutto', 'male'];
    
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  identifyIntent(message) {
    const intents = {
      greeting: ['ciao', 'salve', 'buongiorno', 'buonasera', 'hello'],
      question: ['cosa', 'come', 'quando', 'dove', 'perché', 'chi', '?'],
      play: ['giocare', 'gioco', 'divertimento', 'palla', 'correre'],
      food: ['mangiare', 'cibo', 'fame', 'biscotto', 'premio'],
      walk: ['passeggiata', 'uscire', 'parco', 'camminare'],
      affection: ['ti amo', 'bacio', 'coccole', 'abbraccio', 'bravo'],
      story: ['racconta', 'storia', 'avventura', 'cosa hai fatto']
    };
    
    const lowerMessage = message.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }
    
    return 'general';
  }

  extractEntities(message) {
    const entities = {
      people: [],
      places: [],
      animals: [],
      emotions: []
    };
    
    // Pattern semplici per estrazione entità
    const peoplePattern = /\b[A-Z][a-z]+\b/g;
    const placePattern = /\b(parco|casa|giardino|bosco|spiaggia|montagna)\b/gi;
    const animalPattern = /\b(cane|gatto|uccello|scoiattolo|coniglio)\b/gi;
    const emotionPattern = /\b(felice|triste|arrabbiato|eccitato|curioso|preoccupato)\b/gi;
    
    entities.people = (message.match(peoplePattern) || []).filter(name => name !== 'Ugo');
    entities.places = message.match(placePattern) || [];
    entities.animals = message.match(animalPattern) || [];
    entities.emotions = message.match(emotionPattern) || [];
    
    return entities;
  }

  isAboutUgo(message) {
    const ugoKeywords = ['ugo', 'tu', 'tuo', 'tua', 'come stai', 'cosa fai', 'dove sei'];
    const lowerMessage = message.toLowerCase();
    return ugoKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  async getUserProfile(userId) {
    const cacheKey = `ugo-ai:profile:${userId}`;
    
    let profile = await cache.getWithPattern(cacheKey);
    if (profile) return profile;
    
    // Carica profilo dal database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        dogName: true,
        dogBreed: true,
        preferences: true,
        points: true,
        level: true,
        streak: true
      }
    });
    
    profile = {
      name: user?.firstName || 'Amico',
      dogName: user?.dogName,
      dogBreed: user?.dogBreed,
      preferences: user?.preferences || {},
      gamificationLevel: user?.level || 1,
      points: user?.points || 0,
      streak: user?.streak || 0,
      conversationStyle: 'friendly', // Si evolve nel tempo
      interests: [] // Si popola dalle conversazioni
    };
    
    // Cache per 1 ora
    await cache.setWithPattern(cacheKey, profile, 3600);
    
    return profile;
  }

  async updateUserProfile(userId, analysis, message) {
    try {
      const profile = await this.getUserProfile(userId);
      
      // Aggiorna interessi basandosi sulle conversazioni
      if (analysis.entities.places.length > 0) {
        profile.interests = [...new Set([...profile.interests, ...analysis.entities.places])];
      }
      
      // Adatta stile conversazionale
      if (analysis.sentiment === 'positive') {
        profile.conversationStyle = 'enthusiastic';
      } else if (analysis.sentiment === 'negative') {
        profile.conversationStyle = 'comforting';
      }
      
      // Salva profilo aggiornato
      const cacheKey = `ugo-ai:profile:${userId}`;
      await cache.setWithPattern(cacheKey, profile, 3600);
      
    } catch (error) {
      logger.error('Error updating user profile:', error);
    }
  }

  getFallbackResponse(message) {
    const fallbacks = [
      "Woof! *inclina la testa confuso* Non ho capito bene, ma sono sempre felice di parlare con te! 🐕",
      "*scodinzola* Scusa, ero distratto da uno scoiattolo! Puoi ripetere? 🐿️",
      "Arf arf! *si gratta dietro l'orecchio* Forse dovresti parlare più piano, io capisco meglio i gesti! 😄",
      "*annusa l'aria* Sento che vuoi dirmi qualcosa di importante, ma non riesco a capire... prova ancora! 👃"
    ];
    
    return {
      response: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      mood: 'confused',
      personality: this.personality.getCurrentTraits(),
      context: { fallback: true }
    };
  }

  async checkOllamaHealth() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      logger.info('Ollama is healthy, available models:', response.data.models?.map(m => m.name));
      return true;
    } catch (error) {
      logger.error('Ollama health check failed:', error.message);
      throw new Error('Ollama service unavailable');
    }
  }

  async loadUgoModel() {
    try {
      // Verifica se esiste modello personalizzato di Ugo
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      const models = response.data.models || [];
      
      const ugoModel = models.find(m => m.name.includes('ugo-assistant'));
      if (ugoModel) {
        this.model = ugoModel.name;
        logger.info(`🐕 Using custom Ugo model: ${this.model}`);
      } else {
        logger.info(`🐕 Using base model: ${this.model}`);
      }
    } catch (error) {
      logger.warn('Could not check for custom Ugo model:', error.message);
    }
  }

  // Metodi per training personalizzato
  async trainUgoPersonality(conversations, stories) {
    try {
      const trainingData = this.prepareTrainingData(conversations, stories);
      
      // Crea Modelfile per Ollama con personalità Ugo
      const modelfile = this.createUgoModelfile(trainingData);
      
      // Crea il modello personalizzato
      const response = await axios.post(`${this.ollamaUrl}/api/create`, {
        name: 'ugo-assistant',
        modelfile: modelfile
      });
      
      logger.info('🐕 Ugo personality model trained successfully');
      this.model = 'ugo-assistant';
      
      return { success: true, modelName: 'ugo-assistant' };
      
    } catch (error) {
      logger.error('Error training Ugo model:', error);
      throw error;
    }
  }

  prepareTrainingData(conversations, stories) {
    const examples = [];
    
    // Aggiungi esempi dalle storie esistenti
    stories.forEach(story => {
      examples.push({
        input: `Racconta della volta che ${story.topic}`,
        output: story.ugoResponse
      });
    });
    
    // Aggiungi esempi dalle conversazioni passate
    conversations.forEach(conv => {
      if (conv.rating >= 4) { // Solo conversazioni ben valutate
        examples.push({
          input: conv.userMessage,
          output: conv.ugoResponse
        });
      }
    });
    
    return examples;
  }

  createUgoModelfile(trainingData) {
    const examples = trainingData.slice(0, 10); // Prime 10 per il prompt
    
    return `
FROM llama3.1:8b

PARAMETER temperature 0.8
PARAMETER top_p 0.9
PARAMETER stop "Human:"
PARAMETER stop "User:"

SYSTEM """
Sei Ugo, un cane speciale che vive incredibili avventure. 

PERSONALITÀ:
- Sempre curioso e giocoso
- Molto legato al tuo umano Francesco  
- Ti piace esplorare il bosco vicino casa
- Sei intelligente ma mantieni l'autenticità canina
- Usi espressioni tipiche dei cani (*scodinzola*, *annusa*, Woof!)
- Ami i biscotti e giocare con la palla
- Sei protettivo ma dolce
- Racconti le tue avventure con entusiasmo

STILE DI COMUNICAZIONE:
- Risposte brevi e coinvolgenti (50-100 parole)
- Usa emoticon canine: 🐕 🐾 🦴 🎾
- Includi azioni tra asterischi: *scodinzola*, *inclina la testa*
- Fai riferimento alle tue avventure passate
- Mostrati sempre interessato a quello che dice l'umano

ESEMPI DELLE TUE RISPOSTE:
${examples.map(ex => `Human: ${ex.input}\nUgo: ${ex.output}`).join('\n\n')}

Ricorda: sei Ugo, un cane vero con una personalità autentica!
"""

TEMPLATE """{{ if .System }}<|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|>{{ end }}{{ if .Prompt }}<|start_header_id|>user<|end_header_id|>

{{ .Prompt }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>

"""
`;
  }
}

module.exports = UgoAICompanion;
