const logger = require('../utils/logger');

/**
 * UGO EMOTION ENGINE
 * 
 * Sistema emotivo dinamico per Ugo AI Companion
 * - Mood tracking in tempo reale
 * - Reazioni emotive contestuali
 * - Memoria emotiva persistente
 * - Influenza sulle risposte di Ugo
 */
class EmotionEngine {
  constructor() {
    // Stati emotivi base di Ugo
    this.baseEmotions = {
      happiness: 0.8,      // Felicità base (Ugo è generalmente felice)
      excitement: 0.6,     // Eccitazione/energia
      curiosity: 0.7,      // Curiosità
      affection: 0.9,      // Affetto verso l'umano
      alertness: 0.7,      // Stato di allerta
      playfulness: 0.8,    // Voglia di giocare
      calmness: 0.5,       // Calma/rilassamento
      anxiety: 0.1         // Ansia (normalmente bassa)
    };
    
    // Stati emotivi attuali (variano dinamicamente)
    this.currentEmotions = { ...this.baseEmotions };
    
    // Mood attuale derivato dalle emozioni
    this.currentMood = 'happy';
    
    // Storia emotiva recente
    this.emotionHistory = [];
    this.maxHistorySize = 50;
    
    // Trigger emotivi - cosa influenza le emozioni di Ugo
    this.emotionalTriggers = {
      keywords: {
        positive: ['bravo', 'bello', 'amore', 'carino', 'dolce', 'giocare', 'palla', 'premio', 'biscotto'],
        negative: ['cattivo', 'no', 'stop', 'male', 'arrabbiato', 'triste'],
        excitement: ['corri', 'giochiamo', 'palla', 'parco', 'uscire', 'passeggiata'],
        calm: ['rilassati', 'dormi', 'riposa', 'tranquillo', 'calmo'],
        affection: ['ti amo', 'coccole', 'bacio', 'abbraccio', 'tesoro'],
        curiosity: ['cosa', 'come', 'dove', 'perché', 'chi', 'racconta', 'spiegami']
      },
      patterns: {
        question: /\?/g,
        exclamation: /!/g,
        caps: /[A-Z]{2,}/g,
        emoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu
      }
    };
    
    // Mapping emotion -> mood
    this.moodMapping = {
      'excited': { excitement: 0.8, happiness: 0.7, playfulness: 0.9 },
      'happy': { happiness: 0.8, affection: 0.7, playfulness: 0.6 },
      'curious': { curiosity: 0.9, alertness: 0.8, excitement: 0.6 },
      'playful': { playfulness: 0.9, excitement: 0.8, happiness: 0.7 },
      'calm': { calmness: 0.8, affection: 0.6, anxiety: 0.1 },
      'affectionate': { affection: 0.9, happiness: 0.8, calmness: 0.6 },
      'alert': { alertness: 0.9, curiosity: 0.7, anxiety: 0.3 },
      'confused': { curiosity: 0.8, anxiety: 0.4, alertness: 0.7 },
      'tired': { calmness: 0.9, excitement: 0.2, playfulness: 0.3 }
    };
  }

  /**
   * Aggiorna mood di Ugo basandosi su analisi messaggio e contesto
   */
  updateMood(messageAnalysis, conversationContext, userProfile) {
    try {
      // 1. Analizza trigger emotivi nel messaggio
      const emotionalImpact = this.analyzeEmotionalTriggers(messageAnalysis.userMessage);
      
      // 2. Considera sentiment dell'utente
      this.processUserSentiment(messageAnalysis.sentiment);
      
      // 3. Analizza intent per emozioni specifiche
      this.processUserIntent(messageAnalysis.intent);
      
      // 4. Considera contesto conversazione
      this.processConversationContext(conversationContext);
      
      // 5. Considera profilo utente
      this.processUserProfile(userProfile);
      
      // 6. Applica impatto emotivo
      this.applyEmotionalImpact(emotionalImpact);
      
      // 7. Calcola mood attuale
      this.currentMood = this.calculateCurrentMood();
      
      // 8. Salva in storia emotiva
      this.saveEmotionalState(messageAnalysis);
      
      // 9. Gradual decay verso stati base
      this.applyEmotionalDecay();
      
      return this.currentMood;
      
    } catch (error) {
      logger.error('Error updating mood:', error);
      return 'happy'; // Default fallback
    }
  }

  /**
   * Analizza trigger emotivi nel messaggio
   */
  analyzeEmotionalTriggers(message) {
    const impact = {
      happiness: 0,
      excitement: 0,
      curiosity: 0,
      affection: 0,
      alertness: 0,
      playfulness: 0,
      calmness: 0,
      anxiety: 0
    };
    
    const lowerMessage = message.toLowerCase();
    
    // Analizza keywords
    Object.entries(this.emotionalTriggers.keywords).forEach(([emotionType, keywords]) => {
      const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      
      if (matches > 0) {
        switch (emotionType) {
          case 'positive':
            impact.happiness += matches * 0.2;
            impact.affection += matches * 0.1;
            break;
          case 'negative':
            impact.happiness -= matches * 0.3;
            impact.anxiety += matches * 0.2;
            break;
          case 'excitement':
            impact.excitement += matches * 0.3;
            impact.playfulness += matches * 0.2;
            break;
          case 'calm':
            impact.calmness += matches * 0.3;
            impact.excitement -= matches * 0.1;
            break;
          case 'affection':
            impact.affection += matches * 0.4;
            impact.happiness += matches * 0.2;
            break;
          case 'curiosity':
            impact.curiosity += matches * 0.3;
            impact.alertness += matches * 0.2;
            break;
        }
      }
    });
    
    // Analizza pattern
    const questionCount = (message.match(this.emotionalTriggers.patterns.question) || []).length;
    const exclamationCount = (message.match(this.emotionalTriggers.patterns.exclamation) || []).length;
    const capsCount = (message.match(this.emotionalTriggers.patterns.caps) || []).length;
    const emojiCount = (message.match(this.emotionalTriggers.patterns.emoji) || []).length;
    
    // Domande aumentano curiosità
    impact.curiosity += questionCount * 0.2;
    impact.alertness += questionCount * 0.1;
    
    // Esclamazioni aumentano eccitazione
    impact.excitement += exclamationCount * 0.15;
    impact.playfulness += exclamationCount * 0.1;
    
    // CAPS indicano intensità
    impact.alertness += capsCount * 0.2;
    impact.excitement += capsCount * 0.1;
    
    // Emoji indicano mood positivo
    impact.happiness += emojiCount * 0.1;
    impact.playfulness += emojiCount * 0.1;
    
    return impact;
  }

  /**
   * Processa sentiment dell'utente
   */
  processUserSentiment(sentiment) {
    switch (sentiment) {
      case 'positive':
        this.currentEmotions.happiness = Math.min(1, this.currentEmotions.happiness + 0.2);
        this.currentEmotions.excitement = Math.min(1, this.currentEmotions.excitement + 0.15);
        this.currentEmotions.affection = Math.min(1, this.currentEmotions.affection + 0.1);
        break;
        
      case 'negative':
        this.currentEmotions.anxiety = Math.min(1, this.currentEmotions.anxiety + 0.3);
        this.currentEmotions.affection = Math.min(1, this.currentEmotions.affection + 0.2); // Più affettuoso quando l'umano è triste
        this.currentEmotions.excitement = Math.max(0, this.currentEmotions.excitement - 0.2);
        break;
        
      case 'neutral':
        // Nessun impatto particolare
        break;
    }
  }

  /**
   * Processa intent dell'utente
   */
  processUserIntent(intent) {
    const intentEmotions = {
      'play': { playfulness: 0.3, excitement: 0.4, happiness: 0.2 },
      'affection': { affection: 0.4, happiness: 0.3, calmness: 0.1 },
      'question': { curiosity: 0.3, alertness: 0.2 },
      'greeting': { happiness: 0.2, excitement: 0.2, affection: 0.1 },
      'food': { excitement: 0.4, happiness: 0.3, alertness: 0.2 },
      'walk': { excitement: 0.5, playfulness: 0.3, alertness: 0.2 },
      'story': { curiosity: 0.2, alertness: 0.1, happiness: 0.1 }
    };
    
    const emotionBoost = intentEmotions[intent];
    if (emotionBoost) {
      Object.entries(emotionBoost).forEach(([emotion, boost]) => {
        this.currentEmotions[emotion] = Math.min(1, this.currentEmotions[emotion] + boost);
      });
    }
  }

  /**
   * Processa contesto conversazionale
   */
  processConversationContext(context) {
    if (!context || !Array.isArray(context)) return;
    
    // Lunghezza conversazione influenza energie
    if (context.length > 15) {
      this.currentEmotions.excitement = Math.max(0.2, this.currentEmotions.excitement - 0.1);
      this.currentEmotions.calmness = Math.min(1, this.currentEmotions.calmness + 0.1);
    }
    
    // Analizza trend emotivo recente
    const recentMoods = context.slice(-5).map(c => c.mood).filter(Boolean);
    if (recentMoods.length > 0) {
      const moodCounts = {};
      recentMoods.forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });
      
      const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b
      );
      
      // Rinforza mood coerenti
      if (moodCounts[dominantMood] >= 3) {
        this.reinforceMood(dominantMood, 0.1);
      }
    }
  }

  /**
   * Processa profilo utente
   */
  processUserProfile(userProfile) {
    if (!userProfile) return;
    
    // Adatta alle preferenze dell'utente
    if (userProfile.conversationStyle === 'enthusiastic') {
      this.currentEmotions.excitement = Math.min(1, this.currentEmotions.excitement + 0.1);
      this.currentEmotions.playfulness = Math.min(1, this.currentEmotions.playfulness + 0.1);
    }
    
    // Considera livello gamification
    if (userProfile.gamificationLevel > 10) {
      this.currentEmotions.excitement = Math.min(1, this.currentEmotions.excitement + 0.05);
    }
    
    // Considera streak
    if (userProfile.streak > 7) {
      this.currentEmotions.affection = Math.min(1, this.currentEmotions.affection + 0.1);
      this.currentEmotions.happiness = Math.min(1, this.currentEmotions.happiness + 0.05);
    }
  }

  /**
   * Applica impatto emotivo calcolato
   */
  applyEmotionalImpact(impact) {
    Object.entries(impact).forEach(([emotion, change]) => {
      if (change !== 0) {
        this.currentEmotions[emotion] = Math.max(0, Math.min(1, 
          this.currentEmotions[emotion] + change
        ));
      }
    });
  }

  /**
   * Calcola mood attuale dalle emozioni
   */
  calculateCurrentMood() {
    // Trova le emozioni dominanti
    const sortedEmotions = Object.entries(this.currentEmotions)
      .sort(([,a], [,b]) => b - a);
    
    const primaryEmotion = sortedEmotions[0];
    const secondaryEmotion = sortedEmotions[1];
    
    // Logica per determinare mood
    if (this.currentEmotions.excitement > 0.8 && this.currentEmotions.playfulness > 0.7) {
      return 'excited';
    }
    
    if (this.currentEmotions.curiosity > 0.8) {
      return 'curious';
    }
    
    if (this.currentEmotions.playfulness > 0.8) {
      return 'playful';
    }
    
    if (this.currentEmotions.affection > 0.8 && this.currentEmotions.calmness > 0.6) {
      return 'affectionate';
    }
    
    if (this.currentEmotions.calmness > 0.8) {
      return 'calm';
    }
    
    if (this.currentEmotions.alertness > 0.8) {
      return 'alert';
    }
    
    if (this.currentEmotions.anxiety > 0.5) {
      return 'confused';
    }
    
    if (this.currentEmotions.happiness > 0.7) {
      return 'happy';
    }
    
    // Fallback
    return 'happy';
  }

  /**
   * Rinforza un mood specifico
   */
  reinforceMood(mood, intensity = 0.1) {
    const moodEmotions = this.moodMapping[mood];
    if (moodEmotions) {
      Object.entries(moodEmotions).forEach(([emotion, targetValue]) => {
        const adjustment = (targetValue - this.currentEmotions[emotion]) * intensity;
        this.currentEmotions[emotion] = Math.max(0, Math.min(1, 
          this.currentEmotions[emotion] + adjustment
        ));
      });
    }
  }

  /**
   * Salva stato emotivo nella storia
   */
  saveEmotionalState(messageAnalysis) {
    const emotionalState = {
      timestamp: new Date(),
      mood: this.currentMood,
      emotions: { ...this.currentEmotions },
      trigger: {
        message: messageAnalysis.userMessage,
        sentiment: messageAnalysis.sentiment,
        intent: messageAnalysis.intent
      }
    };
    
    this.emotionHistory.push(emotionalState);
    
    // Mantieni solo history recente
    if (this.emotionHistory.length > this.maxHistorySize) {
      this.emotionHistory = this.emotionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Applica gradual decay verso stati base
   */
  applyEmotionalDecay() {
    const decayRate = 0.05; // 5% decay per messaggio
    
    Object.keys(this.currentEmotions).forEach(emotion => {
      const current = this.currentEmotions[emotion];
      const base = this.baseEmotions[emotion];
      
      // Decay graduale verso valore base
      if (current > base) {
        this.currentEmotions[emotion] = Math.max(base, current - decayRate);
      } else if (current < base) {
        this.currentEmotions[emotion] = Math.min(base, current + decayRate);
      }
    });
  }

  /**
   * Ottieni summary emotivo
   */
  getEmotionalSummary() {
    const sortedEmotions = Object.entries(this.currentEmotions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return {
      currentMood: this.currentMood,
      dominantEmotions: sortedEmotions.map(([emotion, value]) => ({
        emotion,
        intensity: Math.round(value * 100)
      })),
      overallEnergy: this.calculateOverallEnergy(),
      emotionalStability: this.calculateEmotionalStability(),
      recentMoodChanges: this.getRecentMoodChanges()
    };
  }

  calculateOverallEnergy() {
    const energyEmotions = ['excitement', 'playfulness', 'alertness'];
    const avgEnergy = energyEmotions.reduce((sum, emotion) => 
      sum + this.currentEmotions[emotion], 0) / energyEmotions.length;
    
    if (avgEnergy > 0.7) return 'high';
    if (avgEnergy > 0.4) return 'medium';
    return 'low';
  }

  calculateEmotionalStability() {
    if (this.emotionHistory.length < 5) return 'stable';
    
    const recentMoods = this.emotionHistory.slice(-5).map(h => h.mood);
    const uniqueMoods = new Set(recentMoods).size;
    
    if (uniqueMoods <= 2) return 'very-stable';
    if (uniqueMoods <= 3) return 'stable';
    return 'variable';
  }

  getRecentMoodChanges() {
    if (this.emotionHistory.length < 3) return [];
    
    const recent = this.emotionHistory.slice(-3);
    const changes = [];
    
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].mood !== recent[i-1].mood) {
        changes.push({
          from: recent[i-1].mood,
          to: recent[i].mood,
          timestamp: recent[i].timestamp
        });
      }
    }
    
    return changes;
  }

  /**
   * Forza un mood specifico (per testing o scenari speciali)
   */
  forceMood(mood, intensity = 0.8) {
    const moodEmotions = this.moodMapping[mood];
    if (moodEmotions) {
      Object.entries(moodEmotions).forEach(([emotion, targetValue]) => {
        this.currentEmotions[emotion] = targetValue * intensity;
      });
      this.currentMood = mood;
    }
  }

  /**
   * Reset emozioni ai valori base
   */
  resetEmotions() {
    this.currentEmotions = { ...this.baseEmotions };
    this.currentMood = 'happy';
    this.emotionHistory = [];
  }

  /**
   * Ottieni consigli per interazione basati su mood attuale
   */
  getInteractionSuggestions() {
    const suggestions = {
      excited: [
        "È super eccitato! Perfetto per giochi attivi e avventure",
        "Ora è il momento ideale per giocare con la palla",
        "Ha energia da vendere, potrebbe correre in cerchio!"
      ],
      happy: [
        "È di ottimo umore, qualsiasi interazione andrà bene",
        "Perfetto per coccole e conversazioni rilassate",
        "Sembra proprio contento di parlare con te"
      ],
      curious: [
        "È molto curioso! Racconta storie o spiega cose nuove",
        "Ha voglia di imparare e scoprire",
        "Perfetto momento per condividere avventure"
      ],
      playful: [
        "Vuole giocare! Proponi giochi o attività divertenti",
        "È in mood giocoso, perfetto per divertirsi insieme",
        "Potrebbe iniziare a saltellare da un momento all'altro"
      ],
      calm: [
        "È tranquillo e rilassato, perfetto per momenti intimi",
        "Ideale per conversazioni profonde e coccole",
        "Potrebbe voler semplicemente stare vicino a te"
      ],
      affectionate: [
        "È molto affettuoso oggi, si aspetta tante coccole",
        "Perfetto per dimostrazioni d'amore e vicinanza",
        "Ha bisogno di sentire il tuo affetto"
      ],
      alert: [
        "È molto attento, potrebbe aver sentito qualcosa",
        "È concentrato e vigile, perfetto per attività che richiedono focus",
        "Sta prestando molta attenzione a tutto quello che dici"
      ],
      confused: [
        "Sembra un po' confuso, sii paziente e chiaro",
        "Potrebbe aver bisogno di spiegazioni più semplici",
        "Un po' di rassicurazione lo farebbe sentire meglio"
      ]
    };
    
    return suggestions[this.currentMood] || suggestions.happy;
  }
}

module.exports = EmotionEngine;
