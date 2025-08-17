const logger = require('../utils/logger');

/**
 * SENTIMENT ANALYZER ITALIANO
 * 
 * Analyzer leggero per sentiment analysis in italiano, ottimizzato per Ugo.
 * Combina approccio rule-based con machine learning semplificato.
 */
class ItalianSentimentAnalyzer {
  constructor() {
    // Dizionario di parole positive e negative in italiano
    this.positiveWords = new Set([
      'amore', 'bello', 'bravo', 'buono', 'carino', 'dolce', 'fantastico',
      'felice', 'gioia', 'grazie', 'incredibile', 'magnifico', 'perfetto',
      'splendido', 'stupendo', 'meraviglioso', 'eccellente', 'adorabile',
      'allegro', 'contento', 'divertente', 'emozionante', 'entusiasta',
      'gioioso', 'ottimo', 'piacevole', 'sorridente', 'soddisfatto',
      'super', 'top', 'wow', 'evviva', 'bene', 'sì', 'certo', 'ok',
      // Parole specifiche per cani/Ugo
      'coccole', 'giocare', 'palla', 'premio', 'biscotto', 'passeggiata',
      'parco', 'correre', 'zampe', 'scodinzolo', 'amico', 'compagno'
    ]);
    
    this.negativeWords = new Set([
      'arrabbiato', 'cattivo', 'difficile', 'impossibile', 'male', 'no',
      'odio', 'pessimo', 'problema', 'sbagliato', 'terribile', 'triste',
      'brutto', 'orribile', 'noioso', 'fastidioso', 'irritante', 'stupido',
      'deluso', 'preoccupato', 'ansioso', 'nervoso', 'stanco', 'annoiato',
      'frustrato', 'arrabbiato', 'disgustato', 'infelice', 'sconvolto',
      'disperato', 'devastato', 'furioso', 'incazzato', 'schifoso',
      // Contesti negativi per cani
      'veterinario', 'malato', 'ferito', 'paura', 'spavento', 'nascondersi',
      'punizione', 'rimprovero', 'solo', 'abbandonato', 'trascurato'
    ]);
    
    // Intensificatori
    this.intensifiers = {
      'molto': 1.5,
      'davvero': 1.4,
      'veramente': 1.4,
      'estremamente': 1.8,
      'incredibilmente': 1.7,
      'assolutamente': 1.6,
      'completamente': 1.5,
      'totalmente': 1.5,
      'super': 1.4,
      'ultra': 1.6,
      'mega': 1.5,
      'iper': 1.6
    };
    
    // Negazioni
    this.negations = new Set([
      'non', 'niente', 'nulla', 'mai', 'senza', 'no'
    ]);
    
    // Emoji sentiment
    this.emojiSentiment = {
      // Positive emojis
      '😊': 0.8, '😀': 0.8, '😃': 0.8, '😄': 0.9, '😁': 0.8,
      '😍': 1.0, '🥰': 1.0, '😘': 0.9, '🤗': 0.8, '😇': 0.7,
      '🤩': 0.9, '😋': 0.7, '😌': 0.6, '😎': 0.7, '🥳': 0.9,
      '💕': 0.9, '💖': 0.9, '💗': 0.9, '💝': 0.8, '❤️': 0.9,
      '🎉': 0.8, '👏': 0.7, '👍': 0.7, '🙌': 0.8, '✨': 0.6,
      '🐕': 0.8, '🐶': 0.9, '🦴': 0.7, '🎾': 0.7, '🏃': 0.6,
      
      // Negative emojis  
      '😢': -0.8, '😭': -0.9, '😞': -0.7, '😔': -0.7, '😟': -0.6,
      '😠': -0.8, '😡': -0.9, '🤬': -1.0, '😤': -0.7, '😒': -0.5,
      '😕': -0.5, '🙁': -0.6, '☹️': -0.6, '😖': -0.7, '😣': -0.6,
      '😫': -0.7, '😩': -0.8, '😰': -0.8, '😨': -0.7, '😱': -0.8,
      '💔': -0.9, '😿': -0.7, '🤒': -0.6, '🤕': -0.6, '🤧': -0.5
    };
    
    // Pattern regex per context clues
    this.patterns = {
      questions: /[?]/g,
      exclamations: /[!]/g,
      caps: /[A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜ]{3,}/g,
      repeated: /(.)\1{2,}/g
    };
  }

  /**
   * Analizza il sentiment di un testo in italiano
   * @param {string} text - Testo da analizzare
   * @returns {Object} Risultato dell'analisi
   */
  analyze(text) {
    try {
      if (!text || typeof text !== 'string') {
        return this.getDefaultResult();
      }
      
      const cleanText = text.trim().toLowerCase();
      if (cleanText.length === 0) {
        return this.getDefaultResult();
      }
      
      // Tokenizzazione semplice
      const tokens = this.tokenize(cleanText);
      
      // Analisi sentiment parole
      const wordSentiment = this.analyzeWords(tokens);
      
      // Analisi emoji
      const emojiSentiment = this.analyzeEmojis(text);
      
      // Analisi pattern testuali
      const patternAnalysis = this.analyzePatterns(text);
      
      // Combinazione punteggi
      const finalScore = this.combineScores(wordSentiment, emojiSentiment, patternAnalysis);
      
      // Classificazione finale
      const sentiment = this.classifySentiment(finalScore.score);
      const confidence = this.calculateConfidence(finalScore, tokens.length);
      
      return {
        sentiment,
        score: finalScore.score,
        confidence,
        details: {
          words: wordSentiment,
          emojis: emojiSentiment,
          patterns: patternAnalysis,
          tokenCount: tokens.length
        },
        metadata: {
          language: 'it',
          analyzer: 'rule-based-italian',
          timestamp: Date.now()
        }
      };
      
    } catch (error) {
      logger.error('Sentiment analysis error:', error);
      return this.getDefaultResult();
    }
  }
  
  /**
   * Tokenizzazione del testo
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\sàáâäèéêëìíîïòóôöùúûü]/gi, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }
  
  /**
   * Analizza sentiment delle parole
   */
  analyzeWords(tokens) {
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let negationFlag = false;
    let currentMultiplier = 1;
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // Check per negazioni
      if (this.negations.has(token)) {
        negationFlag = true;
        currentMultiplier = -1;
        continue;
      }
      
      // Check per intensificatori
      if (this.intensifiers[token]) {
        currentMultiplier = this.intensifiers[token];
        if (negationFlag) currentMultiplier *= -1;
        continue;
      }
      
      // Analizza sentiment parola
      let wordScore = 0;
      if (this.positiveWords.has(token)) {
        wordScore = 1 * currentMultiplier;
        positiveCount++;
      } else if (this.negativeWords.has(token)) {
        wordScore = -1 * currentMultiplier;
        negativeCount++;
      }
      
      score += wordScore;
      
      // Reset moltiplicatori dopo ogni parola non-modificatore
      if (wordScore !== 0) {
        currentMultiplier = 1;
        negationFlag = false;
      }
    }
    
    // Normalizza per lunghezza
    const normalizedScore = tokens.length > 0 ? score / Math.sqrt(tokens.length) : 0;
    
    return {
      score: normalizedScore,
      positiveCount,
      negativeCount,
      totalWords: tokens.length
    };
  }
  
  /**
   * Analizza sentiment delle emoji
   */
  analyzeEmojis(text) {
    let score = 0;
    let count = 0;
    
    // Regex per emoji
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const matches = text.match(emojiRegex) || [];
    
    matches.forEach(emoji => {
      if (this.emojiSentiment[emoji]) {
        score += this.emojiSentiment[emoji];
        count++;
      }
    });
    
    return {
      score: count > 0 ? score / count : 0,
      count,
      emojis: matches
    };
  }
  
  /**
   * Analizza pattern testuali
   */
  analyzePatterns(text) {
    const analysis = {
      questions: (text.match(this.patterns.questions) || []).length,
      exclamations: (text.match(this.patterns.exclamations) || []).length,
      caps: (text.match(this.patterns.caps) || []).length,
      repeated: (text.match(this.patterns.repeated) || []).length
    };
    
    // Calcola impact su sentiment
    let patternScore = 0;
    
    // Le domande sono generalmente neutre ma possono indicare curiosità
    patternScore += analysis.questions * 0.1;
    
    // Le esclamazioni amplificano l'emozione
    patternScore += analysis.exclamations * 0.2;
    
    // Caps può indicare forte emozione (positiva o negativa)
    patternScore += analysis.caps * 0.1;
    
    // Caratteri ripetuti indicano enfasi
    patternScore += analysis.repeated * 0.1;
    
    return {
      score: Math.min(patternScore, 0.5), // Cap at 0.5
      details: analysis
    };
  }
  
  /**
   * Combina tutti i punteggi
   */
  combineScores(wordSentiment, emojiSentiment, patternAnalysis) {
    const weights = {
      words: 0.7,
      emojis: 0.2,
      patterns: 0.1
    };
    
    const combined = 
      (wordSentiment.score * weights.words) +
      (emojiSentiment.score * weights.emojis) +
      (patternAnalysis.score * weights.patterns);
    
    // Clamp tra -1 e 1
    const clampedScore = Math.max(-1, Math.min(1, combined));
    
    return {
      score: clampedScore,
      breakdown: {
        words: wordSentiment.score * weights.words,
        emojis: emojiSentiment.score * weights.emojis,
        patterns: patternAnalysis.score * weights.patterns
      }
    };
  }
  
  /**
   * Classifica il sentiment in categorie
   */
  classifySentiment(score) {
    if (score > 0.25) return 'positivo';
    if (score < -0.25) return 'negativo';
    return 'neutro';
  }
  
  /**
   * Calcola confidenza dell'analisi
   */
  calculateConfidence(finalScore, tokenCount) {
    const scoreAbs = Math.abs(finalScore.score);
    // Confidence is primarily driven by how far the score is from neutral (0).
    let confidence = scoreAbs * 0.8; // Start with 80% of the score extremity

    // Longer texts give a slight boost, but only if there's some sentiment.
    if (scoreAbs > 0.1) {
        confidence += Math.min(tokenCount / 50, 0.2); // Add up to 0.2 bonus for length
    } else {
        // For very neutral texts, confidence should be low.
        confidence = Math.min(confidence, 0.4);
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * Risultato di default
   */
  getDefaultResult() {
    return {
      sentiment: 'neutro',
      score: 0,
      confidence: 0.1,
      details: {
        words: { score: 0, positiveCount: 0, negativeCount: 0, totalWords: 0 },
        emojis: { score: 0, count: 0, emojis: [] },
        patterns: { score: 0, details: {} }
      },
      metadata: {
        language: 'it',
        analyzer: 'rule-based-italian',
        timestamp: Date.now()
      }
    };
  }
  
  /**
   * Batch analysis per più testi
   */
  analyzeBatch(texts) {
    return texts.map(text => this.analyze(text));
  }
  
  /**
   * Ottiene statistiche del dizionario
   */
  getStats() {
    return {
      positiveWords: this.positiveWords.size,
      negativeWords: this.negativeWords.size,
      intensifiers: Object.keys(this.intensifiers).length,
      negations: this.negations.size,
      emojis: Object.keys(this.emojiSentiment).length
    };
  }
}

module.exports = ItalianSentimentAnalyzer;
