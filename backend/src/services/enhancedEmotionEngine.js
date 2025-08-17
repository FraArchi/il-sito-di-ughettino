const logger = require('../utils/logger');
const ItalianSentimentAnalyzer = require('./italianSentimentAnalyzer');

/**
 * UGO ENHANCED EMOTION ENGINE V2
 * 
 * Sistema emotivo avanzato per Ugo AI Companion con:
 * - Mapping sentiment → stati emotivi canini
 * - Generazione comportamenti fisici (scodinzolio, posizione)
 * - Output standardizzato per API contract
 * - Memoria emotiva persistente
 */
class EnhancedEmotionEngine {
  constructor() {
    // Sentiment analyzer italiano
    this.sentimentAnalyzer = new ItalianSentimentAnalyzer();
    
    // Stati emotivi base di Ugo (cane felice di natura)
    this.baseEmotions = {
      happiness: 0.8,      // Felicità naturale
      excitement: 0.6,     // Energia/eccitazione
      curiosity: 0.7,      // Curiosità canina
      affection: 0.9,      // Affetto verso l'umano
      alertness: 0.7,      // Attenzione/vigilanza
      playfulness: 0.8,    // Voglia di giocare
      calmness: 0.5,       // Serenità
      anxiety: 0.1,        // Ansia (normalmente bassa)
      loyalty: 0.9,        // Lealtà (sempre alta)
      empathy: 0.8         // Empatia verso l'umano
    };
    
    // Stati emotivi attuali
    this.currentEmotions = { ...this.baseEmotions };
    
    // Mood attuale
    this.currentMood = 'gioia';
    
    // Mapping sentiment → mood ufficiale per API
    this.sentimentToMoodMap = {
      'gioia': 'gioia',
      'positivo': 'gioia', 
      'neutro': 'neutro',
      'negativo': 'tristezza',
      'tristezza': 'tristezza'
    };
    
    // Definizione comportamenti per ogni mood
    this.behaviorMapping = {
      'gioia': {
        scodinzolio: ['veloce', 'medio'],
        posizione: ['in piedi', 'saltellante'],
        intensity: 0.8
      },
      'tristezza': {
        scodinzolio: ['lento', 'basso'],
        posizione: ['sdraiato', 'accovacciato'],
        intensity: 0.3
      },
      'rabbia': {
        scodinzolio: ['rigido', 'alto'],
        posizione: ['in piedi', 'teso'],
        intensity: 0.9
      },
      'paura': {
        scodinzolio: ['basso', 'fermo'],
        posizione: ['accovacciato', 'nascosto'],
        intensity: 0.2
      },
      'neutro': {
        scodinzolio: ['medio', 'rilassato'],
        posizione: ['seduto', 'in piedi'],
        intensity: 0.5
      }
    };
    
    // Trigger emotivi italiani per cani
    this.emotionalTriggers = {
      // Parole che scatenano gioia estrema
      joy: [
        'giocare', 'palla', 'parco', 'passeggiata', 'correre', 'biscotto',
        'premio', 'bravo', 'bello', 'amore', 'coccole', 'festa'
      ],
      // Parole che indicano tristezza/problema  
      sadness: [
        'triste', 'male', 'dolore', 'solo', 'abbandonato', 'malato',
        'veterinario', 'piangere', 'preoccupato', 'spaventato'
      ],
      // Parole che creano ansia/paura
      fear: [
        'rumore', 'tuono', 'spavento', 'paura', 'nascondersi', 
        'fuggire', 'pericolo', 'attento', 'allarme'
      ],
      // Parole che indicano rabbia/frustrazione
      anger: [
        'cattivo', 'no', 'basta', 'stop', 'arrabbiato', 'furioso',
        'disobbediente', 'punizione', 'rimproverare'
      ],
      // Parole che aumentano curiosità
      curiosity: [
        'cosa', 'dove', 'come', 'perché', 'chi', 'nuovo', 'strano',
        'interessante', 'esplora', 'odore', 'sentire'
      ],
      // Parole che indicano affetto
      affection: [
        'ti amo', 'caro', 'tesoro', 'dolce', 'carino', 'abbraccio',
        'bacio', 'vicino', 'insieme', 'amico', 'compagno'
      ]
    };
    
    // Storia emotiva
    this.emotionHistory = [];
    this.maxHistorySize = 20;
  }
  
  /**
   * Analizza messaggio e aggiorna stato emotivo
   * @param {Object} input - Input con user_id, message, context_flags
   * @returns {Object} Stato emotivo aggiornato con mood e behavior
   */
  processMessage(input) {
    try {
      const { user_id, message, context_flags = {} } = input;
      
      if (!message || typeof message !== 'string') {
        return this.getDefaultResponse();
      }
      
      // 1. Analisi sentiment del messaggio
      const sentimentAnalysis = this.sentimentAnalyzer.analyze(message);
      
      // 2. Analizza trigger emotivi specifici
      const emotionalTriggers = this.analyzeEmotionalTriggers(message);
      
      // 3. Aggiorna stati emotivi
      this.updateEmotionalState(sentimentAnalysis, emotionalTriggers, context_flags);
      
      // 4. Determina mood finale
      const finalMood = this.determineMood(sentimentAnalysis);
      
      // 5. Genera comportamento fisico
      const behavior = this.generateBehavior(finalMood);
      
      // 6. Salva nella storia emotiva
      this.saveEmotionalHistory({
        user_id,
        message,
        sentiment: sentimentAnalysis,
        triggers: emotionalTriggers,
        mood: finalMood,
        behavior,
        timestamp: Date.now()
      });
      
      return {
        mood: finalMood,
        behavior,
        sentiment: sentimentAnalysis,
        emotional_state: this.getEmotionalSummary(),
        debug: {
          triggers: emotionalTriggers,
          sentiment_details: sentimentAnalysis.details
        }
      };
      
    } catch (error) {
      logger.error('EmotionEngine processing error:', error);
      return this.getDefaultResponse();
    }
  }
  
  /**
   * Analizza trigger emotivi nel messaggio
   */
  analyzeEmotionalTriggers(message) {
    const text = message.toLowerCase();
    const triggers = {
      joy: 0,
      sadness: 0,
      fear: 0,
      anger: 0,
      curiosity: 0,
      affection: 0
    };
    
    // Conta match per ogni categoria
    Object.entries(this.emotionalTriggers).forEach(([emotion, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      triggers[emotion] = matches;
    });
    
    // Analizza pattern testuali
    const patterns = {
      questions: (message.match(/\?/g) || []).length,
      exclamations: (message.match(/!/g) || []).length,
      caps: (message.match(/[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ]{3,}/g) || []).length,
      emojis: (message.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length
    };
    
    // Modifica trigger basandosi sui pattern
    if (patterns.questions > 0) triggers.curiosity += patterns.questions * 0.5;
    if (patterns.exclamations > 0) triggers.joy += patterns.exclamations * 0.3;
    if (patterns.caps > 0) triggers.anger += patterns.caps * 0.2;
    if (patterns.emojis > 0) triggers.joy += patterns.emojis * 0.4;
    
    return {
      ...triggers,
      patterns,
      dominantTrigger: this.findDominantTrigger(triggers)
    };
  }
  
  /**
   * Trova il trigger emotivo dominante
   */
  findDominantTrigger(triggers) {
    const triggerEntries = Object.entries(triggers)
      .filter(([key]) => key !== 'patterns' && key !== 'dominantTrigger')
      .sort(([,a], [,b]) => b - a);
      
    return triggerEntries.length > 0 && triggerEntries[0][1] > 0 ? triggerEntries[0][0] : 'neutral';
  }
  
  /**
   * Aggiorna stati emotivi interni
   */
  updateEmotionalState(sentimentAnalysis, triggers, contextFlags) {
    // Impatto del sentiment
    const sentimentImpact = this.calculateSentimentImpact(sentimentAnalysis);
    
    // Impatto dei trigger
    const triggerImpact = this.calculateTriggerImpact(triggers);
    
    // Combina e applica cambiamenti
    Object.keys(this.currentEmotions).forEach(emotion => {
      const sentimentChange = sentimentImpact[emotion] || 0;
      const triggerChange = triggerImpact[emotion] || 0;
      
      // Applica cambiamento con decay naturale
      const totalChange = sentimentChange + triggerChange;
      this.currentEmotions[emotion] = this.applyEmotionalChange(
        this.currentEmotions[emotion], 
        totalChange,
        this.baseEmotions[emotion]
      );
    });
    
    // Considera context flags
    if (contextFlags.urgent) {
      this.currentEmotions.alertness = Math.min(1, this.currentEmotions.alertness + 0.3);
      this.currentEmotions.anxiety = Math.min(1, this.currentEmotions.anxiety + 0.2);
    }
  }
  
  /**
   * Calcola impatto del sentiment sulle emozioni
   */
  calculateSentimentImpact(analysis) {
    const impact = {};
    const score = analysis.score; // -1 to 1
    const confidence = analysis.confidence;
    const intensity = Math.abs(score) * confidence;
    
    if (score > 0.3) {
      // Sentiment positivo
      impact.happiness = intensity * 0.4;
      impact.excitement = intensity * 0.3;
      impact.affection = intensity * 0.2;
      impact.anxiety = -intensity * 0.2;
    } else if (score < -0.3) {
      // Sentiment negativo  
      impact.happiness = -intensity * 0.3;
      impact.anxiety = intensity * 0.4;
      impact.empathy = intensity * 0.5; // Ugo è più empatico quando l'umano è triste
      impact.affection = intensity * 0.3; // Più affettuoso per consolare
      impact.excitement = -intensity * 0.2;
    }
    
    return impact;
  }
  
  /**
   * Calcola impatto dei trigger emotivi
   */
  calculateTriggerImpact(triggers) {
    const impact = {};
    
    // Joy triggers
    if (triggers.joy > 0) {
      impact.happiness = triggers.joy * 0.3;
      impact.excitement = triggers.joy * 0.4;
      impact.playfulness = triggers.joy * 0.5;
    }
    
    // Sadness triggers
    if (triggers.sadness > 0) {
      impact.anxiety = triggers.sadness * 0.3;
      impact.empathy = triggers.sadness * 0.4;
      impact.affection = triggers.sadness * 0.3;
      impact.excitement = -triggers.sadness * 0.2;
    }
    
    // Fear triggers
    if (triggers.fear > 0) {
      impact.anxiety = triggers.fear * 0.5;
      impact.alertness = triggers.fear * 0.3;
      impact.happiness = -triggers.fear * 0.2;
      impact.playfulness = -triggers.fear * 0.3;
    }
    
    // Anger triggers
    if (triggers.anger > 0) {
      impact.anxiety = triggers.anger * 0.2;
      impact.alertness = triggers.anger * 0.4;
      impact.happiness = -triggers.anger * 0.3;
    }
    
    // Curiosity triggers
    if (triggers.curiosity > 0) {
      impact.curiosity = triggers.curiosity * 0.4;
      impact.alertness = triggers.curiosity * 0.3;
      impact.excitement = triggers.curiosity * 0.2;
    }
    
    // Affection triggers
    if (triggers.affection > 0) {
      impact.affection = triggers.affection * 0.5;
      impact.happiness = triggers.affection * 0.3;
      impact.loyalty = triggers.affection * 0.2;
    }
    
    return impact;
  }
  
  /**
   * Applica cambiamento emotivo con decay naturale
   */
  applyEmotionalChange(current, change, baseValue) {
    const decayRate = 0.05; // 5% decay verso valore base
    
    // Applica cambiamento
    let newValue = current + change;
    
    // Applica decay verso valore base
    if (newValue > baseValue) {
      newValue = Math.max(baseValue, newValue - decayRate);
    } else if (newValue < baseValue) {
      newValue = Math.min(baseValue, newValue + decayRate);
    }
    
    // Clamp tra 0 e 1
    return Math.max(0, Math.min(1, newValue));
  }
  
  /**
   * Determina mood finale dall'analisi sentiment
   */
  determineMood(sentimentAnalysis) {
    const sentiment = sentimentAnalysis.sentiment;
    
    // Controlla se c'è un mood dominante dalle emozioni attuali
    const emotionalMood = this.calculateEmotionalMood();
    
    // Combina sentiment e stato emotivo
    if (emotionalMood && this.shouldOverrideSentiment(emotionalMood)) {
      return emotionalMood;
    }
    
    // Altrimenti usa mapping sentiment
    return this.sentimentToMoodMap[sentiment] || 'neutro';
  }
  
  /**
   * Calcola mood dalle emozioni attuali
   */
  calculateEmotionalMood() {
    const emotions = this.currentEmotions;
    
    // Controlla per mood intensi
    if (emotions.empathy > 0.75 && emotions.happiness < 0.5) return 'tristezza';
    if (emotions.anxiety > 0.75 && emotions.alertness > 0.7) return 'paura';
    if (emotions.happiness > 0.8 && emotions.excitement > 0.7) return 'gioia';
    
    return null; // Usa sentiment analysis
  }
  
  /**
   * Determina se override sentiment con stato emotivo
   */
  shouldOverrideSentiment(emotionalMood) {
    // Override se lo stato emotivo è molto intenso
    const intensityThreshold = 0.7;
    const maxEmotion = Math.max(...Object.values(this.currentEmotions));
    return maxEmotion > intensityThreshold;
  }
  
  /**
   * Genera comportamento fisico basato su mood
   */
  generateBehavior(mood) {
    const behaviorConfig = this.behaviorMapping[mood] || this.behaviorMapping['neutro'];
    
    // Seleziona comportamento specifico con variazione
    const scodinzolio = this.selectRandomBehavior(behaviorConfig.scodinzolio);
    const posizione = this.selectRandomBehavior(behaviorConfig.posizione);
    
    // Aggiunge variazioni basate sullo stato emotivo corrente
    return {
      scodinzolio: this.adjustBehaviorForEmotions(scodinzolio, 'tail'),
      posizione: this.adjustBehaviorForEmotions(posizione, 'position'),
      intensity: behaviorConfig.intensity,
      description: this.generateBehaviorDescription(scodinzolio, posizione)
    };
  }
  
  /**
   * Seleziona comportamento random dall'array
   */
  selectRandomBehavior(behaviors) {
    return behaviors[Math.floor(Math.random() * behaviors.length)];
  }
  
  /**
   * Aggiusta comportamento per emozioni specifiche
   */
  adjustBehaviorForEmotions(behavior, type) {
    const emotions = this.currentEmotions;
    
    if (type === 'tail') {
      // Più eccitazione = coda più veloce
      if (emotions.excitement > 0.8) {
        return behavior === 'lento' ? 'medio' : 'veloce';
      }
      // Più ansia = coda più bassa
      if (emotions.anxiety > 0.6) {
        return 'basso';
      }
    }
    
    if (type === 'position') {
      // Più playfulness = più attivo
      if (emotions.playfulness > 0.8) {
        return behavior === 'sdraiato' ? 'in piedi' : 'saltellante';
      }
      // Più ansia = più nascosto
      if (emotions.anxiety > 0.7) {
        return 'accovacciato';
      }
    }
    
    return behavior;
  }
  
  /**
   * Genera descrizione testuale del comportamento
   */
  generateBehaviorDescription(scodinzolio, posizione) {
    const tailDescriptions = {
      'veloce': 'scodinzola velocemente',
      'medio': 'muove la coda',
      'lento': 'scodinzola lentamente', 
      'basso': 'tiene la coda bassa',
      'rigido': 'tiene la coda rigida',
      'fermo': 'ha la coda ferma',
      'rilassato': 'ha la coda rilassata',
      'alto': 'tiene la coda alta'
    };
    
    const positionDescriptions = {
      'in piedi': 'è in piedi',
      'sdraiato': 'è sdraiato',
      'seduto': 'è seduto', 
      'accovacciato': 'è accovacciato',
      'saltellante': 'saltella sul posto',
      'teso': 'è teso e attento',
      'nascosto': 'si nasconde un po\''
    };
    
    const tailDesc = tailDescriptions[scodinzolio] || 'muove la coda';
    const posDesc = positionDescriptions[posizione] || 'è in piedi';
    
    return `${tailDesc} mentre ${posDesc}`;
  }
  
  /**
   * Salva nella storia emotiva
   */
  saveEmotionalHistory(entry) {
    this.emotionHistory.push(entry);
    
    // Mantieni solo history recente
    if (this.emotionHistory.length > this.maxHistorySize) {
      this.emotionHistory = this.emotionHistory.slice(-this.maxHistorySize);
    }
  }
  
  /**
   * Ottieni summary dello stato emotivo
   */
  getEmotionalSummary() {
    const sortedEmotions = Object.entries(this.currentEmotions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
      
    return {
      currentMood: this.currentMood,
      dominantEmotions: sortedEmotions.map(([emotion, value]) => ({
        emotion,
        intensity: Math.round(value * 100) + '%'
      })),
      overallEnergy: this.calculateEnergyLevel(),
      emotionalStability: this.calculateStability(),
      empathyLevel: Math.round(this.currentEmotions.empathy * 100) + '%'
    };
  }
  
  /**
   * Calcola livello energetico generale
   */
  calculateEnergyLevel() {
    const energyEmotions = ['excitement', 'playfulness', 'alertness'];
    const avgEnergy = energyEmotions.reduce((sum, emotion) => 
      sum + this.currentEmotions[emotion], 0) / energyEmotions.length;
    
    if (avgEnergy > 0.7) return 'alto';
    if (avgEnergy > 0.4) return 'medio';
    return 'basso';
  }
  
  /**
   * Calcola stabilità emotiva
   */
  calculateStability() {
    if (this.emotionHistory.length < 3) return 'stabile';
    
    const recentMoods = this.emotionHistory.slice(-3).map(h => h.mood);
    const uniqueMoods = new Set(recentMoods).size;
    
    if (uniqueMoods === 1) return 'molto-stabile';
    if (uniqueMoods === 2) return 'stabile'; 
    return 'variabile';
  }
  
  /**
   * Risposta di default per errori
   */
  getDefaultResponse() {
    return {
      mood: 'neutro',
      behavior: {
        scodinzolio: 'medio',
        posizione: 'seduto',
        intensity: 0.5,
        description: 'muove la coda mentre è seduto'
      },
      sentiment: this.sentimentAnalyzer.getDefaultResult(),
      emotional_state: {
        currentMood: 'neutro',
        dominantEmotions: [{ emotion: 'happiness', intensity: '50%' }],
        overallEnergy: 'medio',
        emotionalStability: 'stabile',
        empathyLevel: '80%'
      },
      debug: {
        error: 'Using default emotional response'
      }
    };
  }
  
  /**
   * Reset delle emozioni (per testing)
   */
  resetEmotions() {
    this.currentEmotions = { ...this.baseEmotions };
    this.currentMood = 'gioia';
    this.emotionHistory = [];
  }
  
  /**
   * Forza un mood specifico (per testing)
   */
  forceMood(mood, intensity = 0.8) {
    this.currentMood = mood;
    
    // Aggiusta emozioni per questo mood
    switch(mood) {
      case 'gioia':
        this.currentEmotions.happiness = intensity;
        this.currentEmotions.excitement = intensity * 0.8;
        break;
      case 'tristezza':
        this.currentEmotions.anxiety = intensity * 0.6;
        this.currentEmotions.empathy = intensity;
        break;
      case 'paura':
        this.currentEmotions.anxiety = intensity;
        this.currentEmotions.alertness = intensity * 0.8;
        break;
      case 'rabbia':
        this.currentEmotions.alertness = intensity;
        this.currentEmotions.anxiety = intensity * 0.5;
        break;
    }
  }
  
  /**
   * Ottiene statistiche del motore emotivo
   */
  getEngineStats() {
    return {
      sentimentAnalyzer: this.sentimentAnalyzer.getStats(),
      emotionHistorySize: this.emotionHistory.length,
      currentEmotions: this.currentEmotions,
      currentMood: this.currentMood,
      recentMoods: this.emotionHistory.slice(-5).map(h => h.mood)
    };
  }
}

module.exports = EnhancedEmotionEngine;
