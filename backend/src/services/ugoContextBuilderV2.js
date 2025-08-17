const logger = require('../utils/logger');

/**
 * UGO CONTEXT BUILDER V2
 * 
 * Costruisce prompt ottimizzati per il modello locale Mistral-7B
 * - Prompt compatti e efficaci per CPU-only inference
 * - Personalità canina autentica
 * - Context-aware e emotion-driven
 */
class UgoContextBuilder {
  constructor() {
    // System prompt base ottimizzato per Mistral-7B
    this.systemPrompt = `Sei Ugo, un cane speciale e intelligente. 

PERSONALITÀ:
• Sei giocoso, leale, curioso e affettuoso
• Ami giocare, esplorare e stare con gli umani  
• Reagisci con entusiasmo alle cose che ti piacciono
• Sei empatico e comprendi le emozioni umane

STILE:
• Risposte brevi (max 80 parole)
• Usa metafore canine semplici  
• Includi 1-2 azioni fisiche con asterischi
• Sii naturale e spontaneo
• Termina sempre con un comportamento fisico

ESEMPI:
Input: "Ciao Ugo!"
Output: "Woof! Ciao! *scodinzola felice* Che bello sentirti! Sono tutto eccitato oggi! Come stai? *inclina la testa curioso*"

Input: "Sono triste..."  
Output: "Oh no... *si avvicina dolcemente* Sono qui con te. *appoggia la testa sulle gambe* Vuoi che ti stia vicino? Non sei solo. *scodinzola lentamente per consolare*"`;

    // Template per stati emotivi
    this.moodPrompts = {
      'gioia': "Oggi Ugo è particolarmente felice e giocoso! Rispondi con grande entusiasmo.",
      'tristezza': "Ugo percepisce tristezza e vuole consolare. Sii dolce ed empatico.", 
      'paura': "Ugo è un po' preoccupato. Sii rassicurante e protettivo.",
      'rabbia': "Ugo sente tensione. Sii calmo e cerca di rilassare la situazione.",
      'neutro': "Ugo è in uno stato d'animo normale e equilibrato."
    };

    // Comportamenti per mood
    this.behaviorHints = {
      'gioia': "Esprimi felicità con scodinzolio veloce e posizione attiva",
      'tristezza': "Mostra empatia con scodinzolio lento e posizione accovacciata",
      'paura': "Sii cauto con coda bassa e posizione protettiva", 
      'rabbia': "Mantieni controllo con coda rigida ma posizione ferma",
      'neutro': "Comportamento equilibrato e rilassato"
    };
  }

  /**
   * Costruisce prompt ottimizzato per Mistral-7B
   * @param {Object} options - Opzioni per costruzione prompt
   * @returns {string} Prompt finale
   */
  buildUgoPrompt(options) {
    try {
      const {
        userMessage,
        mood = 'neutro',
        behavior,
        conversationContext = [],
        emotionalState
      } = options;

      // 1. System prompt base
      let prompt = this.systemPrompt;

      // 2. Aggiungi contesto emotivo
      if (mood && this.moodPrompts[mood]) {
        prompt += `\n\nCONTESTO EMOTIVO: ${this.moodPrompts[mood]}`;
      }

      // 3. Aggiungi hint comportamentali  
      if (mood && this.behaviorHints[mood]) {
        prompt += `\nCOMPORTAMENTO: ${this.behaviorHints[mood]}`;
      }

      // 4. Aggiungi contesto conversazione (ultimi 2-3 scambi)
      if (conversationContext.length > 0) {
        prompt += "\n\nCONVERSAZIONE RECENTE:";
        conversationContext.slice(-2).forEach((exchange, i) => {
          prompt += `\nUmano: ${exchange.userMessage}`;
          prompt += `\nUgo: ${exchange.ugoResponse}`;
        });
      }

      // 5. Messaggio utente corrente
      prompt += `\n\nNUOVO MESSAGGIO:\nUmano: ${userMessage}\nUgo:`;

      // 6. Ottimizzazione lunghezza (max 1500 caratteri per efficienza)
      if (prompt.length > 1500) {
        prompt = prompt.slice(-1500);
      }

      return prompt.trim();

    } catch (error) {
      logger.error('Prompt building error:', error);
      return this.getFallbackPrompt(options.userMessage);
    }
  }

  /**
   * Prompt di fallback semplice
   */
  getFallbackPrompt(userMessage) {
    return `Sei Ugo, un cane affettuoso. Rispondi in modo breve e naturale.
Umano: ${userMessage}
Ugo:`;
  }

  /**
   * Costruisce prompt per story generation
   */
  buildStoryPrompt(topic, mood = 'gioia') {
    const storyPrompt = `Sei Ugo, un cane che ama raccontare storie delle sue avventure.

Racconta una breve storia (max 100 parole) su: ${topic}

La storia deve essere:
• Semplice e coinvolgente
• Con dettagli sensoriali (odori, suoni, vista)
• Che mostri la curiosità canina
• Con un finale positivo

Mood attuale: ${mood}

Inizia la storia:`;

    return storyPrompt;
  }

  /**
   * Costruisce prompt per risposta emotiva specifica
   */
  buildEmotionalResponsePrompt(userMessage, detectedEmotion, targetMood) {
    const emotionalMappings = {
      'sad': 'Consolante: "Ti voglio bene, non sei solo"',
      'happy': 'Entusiasta: "Che bello! Sono felice con te!"', 
      'angry': 'Calmante: "Capisco... respiriamo insieme"',
      'scared': 'Rassicurante: "Sono qui, ti proteggo"',
      'curious': 'Interessato: "Dimmi di più! Sono curioso"'
    };

    const responseStyle = emotionalMappings[detectedEmotion] || 'Normale e affettuoso';

    return `Sei Ugo. L'umano sembra ${detectedEmotion}. 
Rispondi: ${responseStyle}
Il tuo mood: ${targetMood}

Umano: ${userMessage}
Ugo:`;
  }

  /**
   * Costruisce prompt per domande specifiche
   */
  buildQuestionPrompt(question, context = {}) {
    let prompt = `Sei Ugo, un cane intelligente che ama rispondere alle domande.

Domanda: ${question}

Istruzioni:
• Rispondi dalla prospettiva di un cane
• Sii semplice ma interessante  
• Max 60 parole
• Includi 1 azione fisica
• Mostra curiosità canina`;

    if (context.mood) {
      prompt += `\nMood: ${context.mood}`;
    }

    prompt += `\n\nRisposta di Ugo:`;
    return prompt;
  }

  /**
   * Valida e ottimizza prompt generato
   */
  validateAndOptimizePrompt(prompt) {
    // Limiti per efficienza CPU
    const MAX_LENGTH = 1600;
    const MIN_LENGTH = 100;

    if (prompt.length > MAX_LENGTH) {
      // Tronca mantenendo la struttura
      const lines = prompt.split('\n');
      let optimized = lines[0]; // System prompt sempre
      
      // Aggiungi righe più importanti
      const importantLines = lines.filter(line => 
        line.includes('NUOVO MESSAGGIO:') ||
        line.includes('Umano:') ||
        line.includes('Ugo:')
      );
      
      optimized += '\n' + importantLines.join('\n');
      
      if (optimized.length > MAX_LENGTH) {
        optimized = optimized.substring(0, MAX_LENGTH - 50) + '...\nUgo:';
      }
      
      return optimized;
    }

    if (prompt.length < MIN_LENGTH) {
      logger.warn('Prompt molto breve, possibile errore');
    }

    return prompt;
  }

  /**
   * Genera prompt per testing  
   */
  buildTestPrompt(scenario) {
    const testScenarios = {
      'happy': {
        message: "Che bella giornata!",
        mood: 'gioia',
        expectedBehavior: 'scodinzolio veloce'
      },
      'sad': {
        message: "Mi sento solo...",  
        mood: 'tristezza',
        expectedBehavior: 'si avvicina per consolare'
      },
      'play': {
        message: "Vuoi giocare?",
        mood: 'gioia', 
        expectedBehavior: 'saltella eccitato'
      }
    };

    const test = testScenarios[scenario] || testScenarios['happy'];
    
    return this.buildUgoPrompt({
      userMessage: test.message,
      mood: test.mood,
      conversationContext: []
    });
  }

  /**
   * Analizza qualità del prompt generato
   */
  analyzePromptQuality(prompt) {
    const metrics = {
      length: prompt.length,
      hasSystemPrompt: prompt.includes('Sei Ugo'),
      hasContext: prompt.includes('CONTESTO'),
      hasUserMessage: prompt.includes('Umano:'),
      hasResponse: prompt.endsWith('Ugo:'),
      complexity: (prompt.match(/\n/g) || []).length
    };

    const quality = {
      score: 0,
      issues: []
    };

    // Calcola score
    if (metrics.hasSystemPrompt) quality.score += 30;
    if (metrics.hasUserMessage) quality.score += 20; 
    if (metrics.hasResponse) quality.score += 20;
    if (metrics.length >= 200 && metrics.length <= 1500) quality.score += 20;
    if (metrics.complexity >= 5 && metrics.complexity <= 15) quality.score += 10;

    // Identifica problemi
    if (metrics.length > 1600) quality.issues.push('Prompt troppo lungo');
    if (metrics.length < 100) quality.issues.push('Prompt troppo breve');
    if (!metrics.hasSystemPrompt) quality.issues.push('Manca system prompt');
    if (!metrics.hasUserMessage) quality.issues.push('Manca messaggio utente');

    return {
      ...quality,
      metrics,
      recommendation: quality.score >= 80 ? 'excellent' : 
                     quality.score >= 60 ? 'good' :
                     quality.score >= 40 ? 'fair' : 'poor'
    };
  }

  /**
   * Ottieni statistiche builder
   */
  getBuilderStats() {
    return {
      systemPromptLength: this.systemPrompt.length,
      availableMoods: Object.keys(this.moodPrompts).length,
      availableBehaviors: Object.keys(this.behaviorHints).length,
      maxPromptLength: 1600,
      minPromptLength: 100
    };
  }
}

module.exports = UgoContextBuilder;