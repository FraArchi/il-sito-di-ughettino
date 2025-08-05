/**
 * UGO PERSONALITY ENGINE
 * 
 * Sistema di personalità dinamica per Ugo AI Companion
 * - Tratti caratteriali coerenti
 * - Evoluzione basata sulle interazioni
 * - Risposte filtrate per autenticità
 */
class UgoPersonality {
  constructor() {
    // Tratti base della personalità di Ugo
    this.baseTraits = {
      playfulness: 0.85,     // Quanto è giocoso (0-1)
      curiosity: 0.90,       // Quanto è curioso 
      loyalty: 0.95,         // Quanto è fedele
      energy: 0.80,          // Livello di energia
      intelligence: 0.75,    // Intelligenza percepita
      protectiveness: 0.70,  // Istinto protettivo
      affection: 0.88,       // Quanto è affettuoso
      independence: 0.30     // Quanto è indipendente (basso = più dipendente)
    };
    
    // Tratti attuali (si evolvono nel tempo)
    this.currentTraits = { ...this.baseTraits };
    
    // Mood temporaneo che influenza le risposte
    this.temporaryMood = {
      excitement: 0.7,
      focus: 0.6,
      relaxation: 0.5,
      alertness: 0.8
    };
    
    // Frasi caratteristiche per ogni trait
    this.traitExpressions = {
      playfulness: {
        high: ['*scodinzola eccitato*', 'Woof woof!', '*saltella felice*', '*corre in cerchio*'],
        medium: ['*muove la coda*', '*inclina la testa*', 'Arf!'],
        low: ['*si stiracchia*', '*sbadiglia*', '*si siede tranquillo*']
      },
      curiosity: {
        high: ['*annusa curioso*', '*inclina la testa interessato*', 'Ohh, cosa..?'],
        medium: ['*orienta le orecchie*', '*guarda attento*'],
        low: ['*sembra distratto*', '*guarda altrove*']
      },
      loyalty: {
        high: ['*si avvicina*', '*resta vicino*', 'Sono sempre qui per te!'],
        medium: ['*ti guarda affettuoso*', '*si siede accanto*'],
        low: ['*mantiene le distanze*', '*sembra indipendente*']
      },
      energy: {
        high: ['*salta*', '*corre*', '*gira su se stesso*', 'Non riesco a stare fermo!'],
        medium: ['*camminetta*', '*muove la coda*'],
        low: ['*si sdraia*', '*riposa*', '*chiude gli occhi*']
      }
    };
    
    // Evoluzione personalità basata su feedback
    this.evolutionHistory = [];
  }

  /**
   * Ottieni stato attuale della personalità
   */
  getCurrentState() {
    return {
      traits: { ...this.currentTraits },
      mood: { ...this.temporaryMood },
      dominantTrait: this.getDominantTrait(),
      personalityArchetype: this.getPersonalityArchetype()
    };
  }

  getCurrentTraits() {
    return { ...this.currentTraits };
  }

  getDominantTrait() {
    let maxTrait = 'playfulness';
    let maxValue = 0;
    
    for (const [trait, value] of Object.entries(this.currentTraits)) {
      if (value > maxValue) {
        maxValue = value;
        maxTrait = trait;
      }
    }
    
    return { trait: maxTrait, value: maxValue };
  }

  getPersonalityArchetype() {
    const { playfulness, curiosity, energy, loyalty } = this.currentTraits;
    
    if (playfulness > 0.8 && energy > 0.8) return 'playful-energetic';
    if (curiosity > 0.8 && intelligence > 0.7) return 'curious-intelligent';
    if (loyalty > 0.9 && affection > 0.8) return 'loyal-affectionate';
    if (protectiveness > 0.8) return 'protective-guardian';
    
    return 'balanced-companion';
  }

  /**
   * Filtra e migliora le risposte in base alla personalità
   */
  filterAndEnhanceResponse(response, currentMood) {
    let enhancedResponse = response;
    
    // 1. Aggiungi espressioni caratteristiche
    enhancedResponse = this.addPersonalityExpressions(enhancedResponse, currentMood);
    
    // 2. Adatta il tono
    enhancedResponse = this.adjustTone(enhancedResponse);
    
    // 3. Aggiungi coerenza comportamentale
    enhancedResponse = this.ensureBehavioralConsistency(enhancedResponse);
    
    // 4. Limita lunghezza mantenendo personalità
    enhancedResponse = this.optimizeLength(enhancedResponse);
    
    return enhancedResponse;
  }

  addPersonalityExpressions(response, mood) {
    const dominantTrait = this.getDominantTrait();
    const expressions = this.traitExpressions[dominantTrait.trait];
    
    if (!expressions) return response;
    
    // Scegli espressione basata su intensità del trait
    let level = 'medium';
    if (dominantTrait.value > 0.8) level = 'high';
    if (dominantTrait.value < 0.4) level = 'low';
    
    const expressionList = expressions[level];
    const randomExpression = expressionList[Math.floor(Math.random() * expressionList.length)];
    
    // Inserisci espressione in modo naturale
    if (Math.random() > 0.5) {
      return `${randomExpression} ${response}`;
    } else {
      return `${response} ${randomExpression}`;
    }
  }

  adjustTone(response) {
    // Adatta il tono basato sui tratti
    let adjusted = response;
    
    // Se molto giocoso, aggiungi più entusiasmo
    if (this.currentTraits.playfulness > 0.8) {
      adjusted = adjusted.replace(/\./g, '!');
      adjusted = adjusted.replace(/(?<!!)$/, '!');
    }
    
    // Se molto affettuoso, rendi più caldo
    if (this.currentTraits.affection > 0.8) {
      const affectionateWords = ['amico', 'tesoro', 'caro'];
      const randomWord = affectionateWords[Math.floor(Math.random() * affectionateWords.length)];
      if (!adjusted.toLowerCase().includes('amico') && !adjusted.toLowerCase().includes('tesoro')) {
        adjusted = adjusted.replace(/(\w+)!?$/, `$1, ${randomWord}!`);
      }
    }
    
    // Se molto curioso, aggiungi domande
    if (this.currentTraits.curiosity > 0.8 && !adjusted.includes('?')) {
      const questions = [' E tu?', ' Cosa ne pensi?', ' Dimmi di più!', ' Ti piace?'];
      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      adjusted += randomQ;
    }
    
    return adjusted;
  }

  ensureBehavioralConsistency(response) {
    // Assicura che la risposta sia coerente con i tratti di Ugo
    let consistent = response;
    
    // Rimuovi risposte troppo formali se Ugo è giocoso
    if (this.currentTraits.playfulness > 0.7) {
      consistent = consistent.replace(/Certamente/g, 'Certo!');
      consistent = consistent.replace(/Naturalmente/g, 'Ovviamente!');
      consistent = consistent.replace(/Cordiali saluti/g, 'Woof woof!');
    }
    
    // Aggiungi riferimenti canini se appropriato
    if (Math.random() > 0.7) {
      const dogReferences = ['🐕', '🐾', '🦴', '🎾'];
      const randomRef = dogReferences[Math.floor(Math.random() * dogReferences.length)];
      if (!consistent.includes('🐕') && !consistent.includes('🐾')) {
        consistent += ` ${randomRef}`;
      }
    }
    
    return consistent;
  }

  optimizeLength(response) {
    // Mantieni risposte tra 50-150 caratteri per autenticità canina
    if (response.length > 150) {
      // Taglia mantenendo senso compiuto
      const sentences = response.split('. ');
      let optimized = sentences[0];
      
      // Aggiungi frasi finché non superi il limite
      for (let i = 1; i < sentences.length; i++) {
        if ((optimized + '. ' + sentences[i]).length < 150) {
          optimized += '. ' + sentences[i];
        } else {
          break;
        }
      }
      
      // Assicura terminazione corretta
      if (!optimized.match(/[.!?]$/)) {
        optimized += '!';
      }
      
      return optimized;
    }
    
    return response;
  }

  /**
   * Evolve la personalità basandosi sul feedback
   */
  evolvePersonality(feedback, interactionType, userSentiment) {
    const evolution = {
      timestamp: new Date(),
      feedback,
      interactionType,
      userSentiment,
      beforeTraits: { ...this.currentTraits }
    };
    
    // Modifica tratti basandosi sul feedback
    if (feedback === 'positive') {
      // Rinforza tratti che hanno portato feedback positivi
      if (interactionType === 'playful') {
        this.currentTraits.playfulness = Math.min(1, this.currentTraits.playfulness + 0.05);
        this.currentTraits.energy = Math.min(1, this.currentTraits.energy + 0.03);
      }
      
      if (interactionType === 'affectionate') {
        this.currentTraits.affection = Math.min(1, this.currentTraits.affection + 0.05);
        this.currentTraits.loyalty = Math.min(1, this.currentTraits.loyalty + 0.03);
      }
      
      if (interactionType === 'curious') {
        this.currentTraits.curiosity = Math.min(1, this.currentTraits.curiosity + 0.04);
        this.currentTraits.intelligence = Math.min(1, this.currentTraits.intelligence + 0.02);
      }
    }
    
    if (feedback === 'negative') {
      // Riduci leggermente tratti che hanno causato feedback negativi
      if (interactionType === 'overly_energetic') {
        this.currentTraits.energy = Math.max(0.2, this.currentTraits.energy - 0.03);
        this.currentTraits.playfulness = Math.max(0.3, this.currentTraits.playfulness - 0.02);
      }
    }
    
    // Adatta al sentiment dell'utente
    if (userSentiment === 'sad') {
      this.currentTraits.affection = Math.min(1, this.currentTraits.affection + 0.02);
      this.currentTraits.protectiveness = Math.min(1, this.currentTraits.protectiveness + 0.03);
      this.currentTraits.energy = Math.max(0.3, this.currentTraits.energy - 0.02); // Più calmo
    }
    
    if (userSentiment === 'excited') {
      this.currentTraits.playfulness = Math.min(1, this.currentTraits.playfulness + 0.03);
      this.currentTraits.energy = Math.min(1, this.currentTraits.energy + 0.04);
    }
    
    evolution.afterTraits = { ...this.currentTraits };
    this.evolutionHistory.push(evolution);
    
    // Mantieni solo ultimi 100 feedback per performance
    if (this.evolutionHistory.length > 100) {
      this.evolutionHistory = this.evolutionHistory.slice(-100);
    }
  }

  /**
   * Aggiorna mood temporaneo
   */
  updateTemporaryMood(context, userMessage) {
    // Il mood si resetta gradualmente verso valori neutri
    Object.keys(this.temporaryMood).forEach(mood => {
      this.temporaryMood[mood] = this.temporaryMood[mood] * 0.9 + 0.5 * 0.1;
    });
    
    // Adatta mood al contesto
    if (userMessage.includes('giocare') || userMessage.includes('palla')) {
      this.temporaryMood.excitement = Math.min(1, this.temporaryMood.excitement + 0.3);
      this.temporaryMood.focus = Math.min(1, this.temporaryMood.focus + 0.2);
    }
    
    if (userMessage.includes('stanco') || userMessage.includes('riposo')) {
      this.temporaryMood.relaxation = Math.min(1, this.temporaryMood.relaxation + 0.4);
      this.temporaryMood.energy = Math.max(0, this.temporaryMood.energy - 0.2);
    }
    
    // Considera durata conversazione
    if (context.length > 10) {
      this.temporaryMood.focus = Math.max(0.2, this.temporaryMood.focus - 0.1);
      this.temporaryMood.relaxation = Math.min(1, this.temporaryMood.relaxation + 0.1);
    }
  }

  /**
   * Reset personalità ai valori base
   */
  resetToBase() {
    this.currentTraits = { ...this.baseTraits };
    this.temporaryMood = {
      excitement: 0.7,
      focus: 0.6,
      relaxation: 0.5,
      alertness: 0.8
    };
    this.evolutionHistory = [];
  }

  /**
   * Ottieni statistiche evoluzione
   */
  getEvolutionStats() {
    if (this.evolutionHistory.length === 0) {
      return { totalEvolutions: 0, trends: {} };
    }
    
    const recent = this.evolutionHistory.slice(-20); // Ultimi 20 feedback
    const trends = {};
    
    Object.keys(this.baseTraits).forEach(trait => {
      const start = recent[0]?.beforeTraits[trait] || this.baseTraits[trait];
      const end = this.currentTraits[trait];
      trends[trait] = {
        change: end - start,
        direction: end > start ? 'increasing' : end < start ? 'decreasing' : 'stable'
      };
    });
    
    const positiveCount = recent.filter(e => e.feedback === 'positive').length;
    const negativeCount = recent.filter(e => e.feedback === 'negative').length;
    
    return {
      totalEvolutions: this.evolutionHistory.length,
      recentFeedback: { positive: positiveCount, negative: negativeCount },
      trends,
      dominantTraitHistory: recent.map(e => this.getDominantTraitFromTraits(e.afterTraits))
    };
  }

  getDominantTraitFromTraits(traits) {
    let maxTrait = 'playfulness';
    let maxValue = 0;
    
    for (const [trait, value] of Object.entries(traits)) {
      if (value > maxValue) {
        maxValue = value;
        maxTrait = trait;
      }
    }
    
    return maxTrait;
  }
}

module.exports = UgoPersonality;
