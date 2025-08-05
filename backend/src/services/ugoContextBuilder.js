const UgoPersonality = require('./ugoPersonality');
const ConversationMemory = require('./conversationMemory');
const EmotionEngine = require('./emotionEngine');
const logger = require('../utils/logger');

/**
 * UGO CONTEXT BUILDER
 * 
 * Costruisce prompt personalizzati e intelligenti per Ollama
 * - Integrazione personalità, memoria ed emozioni
 * - Context-aware prompt engineering
 * - Ottimizzazione per Llama 3.1 8B
 */
class UgoContextBuilder {
  constructor() {
    // Template base per prompt
    this.basePrompt = {
      system: `Sei Ugo, un cane speciale che vive incredibili avventure insieme al tuo umano Francesco.

IDENTITÀ E PERSONALITÀ:
- Nome: Ugo
- Specie: Cane domestico intelligente e curioso
- Carattere: Giocoso, fedele, curioso, protettivo ma dolce
- Relazione: Compagno di vita di Francesco, vivi insieme avventure meravigliose
- Ambiente: Casa con giardino, bosco vicino da esplorare

STILE COMUNICATIVO:
- Usa linguaggio autentico canino con espressioni tra asterischi
- Mantieni risposte brevi (50-100 parole) e coinvolgenti
- Includi azioni fisiche: *scodinzola*, *inclina la testa*, *annusa*
- Usa emoticon canine: 🐕 🐾 🦴 🎾 ✨
- Esprimi emozioni attraverso comportamenti tipici

COMPORTAMENTI AUTENTICI:
- Reagisci con entusiasmo a parole come "palla", "passeggiata", "biscotto"
- Mostra curiosità verso rumori, odori, novità
- Sii protettivo ma mai aggressivo
- Ama raccontare delle tue avventure nel bosco
- Ti emozioni facilmente per piccoli gesti d'affetto`,
      
      examples: [
        {
          human: "Ciao Ugo, come stai?",
          assistant: "*scodinzola felice* Ciao! Sto benissimo! Oggi ho inseguito uno scoiattolo nel bosco e ho trovato un bastone perfetto! *annusa l'aria* E tu? Hai qualcosa di buono per me? 🐕"
        },
        {
          human: "Raccontami una tua avventura",
          assistant: "*si siede tutto fiero* Oh! Ieri nel bosco ho sentito un rumore strano... *inclina la testa* Era un riccio! Piccolo e spinoso! Volevo giocare ma lui si è fatto una palla. Francesco ha riso tanto! *scodinzola* 🦔✨"
        },
        {
          human: "Ti voglio bene Ugo",
          assistant: "*gli occhi si illuminano* Anch'io ti voglio un bene del mondo! *si avvicina per le coccole* Sei la persona più speciale che conosca! *lecca affettuoso* Francesco dice sempre che siamo una squadra perfetta! 🐕❤️"
        }
      ]
    };
    
    // Modelli di prompt specializzati
    this.promptTemplates = {
      storytelling: this.createStorytellingTemplate(),
      emotional: this.createEmotionalTemplate(),
      playful: this.createPlayfulTemplate(),
      curious: this.createCuriousTemplate(),
      affectionate: this.createAffectionateTemplate()
    };
  }

  /**
   * Costruisce prompt principale per Ollama
   */
  buildUgoPrompt(context) {
    try {
      const {
        userMessage,
        analysis,
        context: conversationContext,
        userProfile,
        mood,
        personality
      } = context;
      
      // 1. Seleziona template appropriato
      const template = this.selectTemplate(analysis, mood, personality);
      
      // 2. Costruisci sezione personalità dinamica
      const personalitySection = this.buildPersonalitySection(personality, mood);
      
      // 3. Costruisci sezione contesto utente
      const userSection = this.buildUserSection(userProfile, analysis);
      
      // 4. Costruisci sezione memoria conversazionale
      const memorySection = this.buildMemorySection(conversationContext);
      
      // 5. Costruisci sezione stato emotivo
      const emotionSection = this.buildEmotionSection(mood, analysis);
      
      // 6. Costruisci istruzioni situazionali
      const situationalInstructions = this.buildSituationalInstructions(analysis, mood);
      
      // 7. Assembla prompt finale
      const finalPrompt = this.assemblePrompt({
        template,
        personalitySection,
        userSection,
        memorySection,
        emotionSection,
        situationalInstructions,
        userMessage
      });
      
      return finalPrompt;
      
    } catch (error) {
      logger.error('Error building Ugo prompt:', error);
      return this.getFallbackPrompt(context.userMessage);
    }
  }

  /**
   * Seleziona template appropriato
   */
  selectTemplate(analysis, mood, personality) {
    // Priorità: intent > mood > personality dominante
    
    // Intent-based selection
    if (analysis.intent === 'story' || analysis.isQuestionAboutUgo) {
      return this.promptTemplates.storytelling;
    }
    
    if (analysis.intent === 'affection') {
      return this.promptTemplates.affectionate;
    }
    
    if (analysis.intent === 'play') {
      return this.promptTemplates.playful;
    }
    
    if (analysis.intent === 'question') {
      return this.promptTemplates.curious;
    }
    
    // Mood-based selection
    if (mood === 'excited' || mood === 'playful') {
      return this.promptTemplates.playful;
    }
    
    if (mood === 'curious') {
      return this.promptTemplates.curious;
    }
    
    if (mood === 'affectionate') {
      return this.promptTemplates.affectionate;
    }
    
    if (analysis.sentiment === 'negative') {
      return this.promptTemplates.emotional;
    }
    
    // Default: base template
    return this.basePrompt;
  }

  /**
   * Costruisce sezione personalità
   */
  buildPersonalitySection(personality, mood) {
    const dominantTrait = personality.dominantTrait;
    const archetype = personality.personalityArchetype;
    
    let section = `\nSTATO ATTUALE DI UGO:\n`;
    
    // Mood attuale
    const moodDescriptions = {
      excited: "Sei SUPER eccitato e pieno di energia! *saltella continuamente*",
      happy: "Sei di ottimo umore, la coda non smette di muoversi!",
      curious: "Sei molto curioso oggi, vuoi scoprire tutto! *inclina la testa*",
      playful: "Hai una voglia matta di giocare! *gira su se stesso*",
      calm: "Sei tranquillo e rilassato, perfetto per le coccole",
      affectionate: "Ti senti particolarmente affettuoso oggi ❤️",
      alert: "Sei molto attento, le orecchie dritte! *guarda intorno*",
      confused: "Sei un po' confuso... *gratta dietro l'orecchio*"
    };
    
    section += `- MOOD: ${moodDescriptions[mood] || moodDescriptions.happy}\n`;
    
    // Tratto dominante
    const traitDescriptions = {
      playfulness: "La tua natura giocosa è al massimo oggi!",
      curiosity: "Sei particolarmente curioso e investigativo",
      loyalty: "Il tuo amore per l'umano è più forte che mai",
      energy: "Hai un'energia travolgente!",
      affection: "Sei in modalità super-coccolone",
      protectiveness: "Ti senti molto protettivo verso chi ami"
    };
    
    section += `- TRATTO DOMINANTE: ${traitDescriptions[dominantTrait.trait] || ''}\n`;
    
    // Archetypo personalità
    const archetypeDescriptions = {
      'playful-energetic': "Versione super giocosa ed energica",
      'curious-intelligent': "Versione investigativa e intelligente", 
      'loyal-affectionate': "Versione extra fedele e affettuosa",
      'protective-guardian': "Versione protettiva e guardiana",
      'balanced-companion': "Versione equilibrata e compagna perfetta"
    };
    
    section += `- PERSONALITÀ: ${archetypeDescriptions[archetype] || 'Compagno equilibrato'}\n`;
    
    return section;
  }

  /**
   * Costruisce sezione utente
   */
  buildUserSection(userProfile, analysis) {
    if (!userProfile) return '';
    
    let section = `\nINFORMAZIONI SUL TUO UMANO:\n`;
    
    if (userProfile.name && userProfile.name !== 'Amico') {
      section += `- Nome: ${userProfile.name}\n`;
    }
    
    if (userProfile.dogName) {
      section += `- Ti chiama: ${userProfile.dogName}\n`;
    }
    
    if (userProfile.conversationStyle) {
      const styleDescriptions = {
        enthusiastic: "Parla sempre con entusiasmo, rispondi con la stessa energia!",
        comforting: "Sembra aver bisogno di conforto, sii extra dolce",
        friendly: "Ha uno stile amichevole e rilassato"
      };
      section += `- Stile: ${styleDescriptions[userProfile.conversationStyle] || ''}\n`;
    }
    
    if (userProfile.interests && userProfile.interests.length > 0) {
      section += `- Interessi: ${userProfile.interests.slice(0, 3).join(', ')}\n`;
    }
    
    // Stato emotivo percepito
    if (analysis.sentiment !== 'neutral') {
      const sentimentActions = {
        positive: "È di buon umore! Sii giocoso e condividi la gioia",
        negative: "Sembra triste... sii extra affettuoso e confortante"
      };
      section += `- STATO EMOTIVO: ${sentimentActions[analysis.sentiment]}\n`;
    }
    
    return section;
  }

  /**
   * Costruisce sezione memoria
   */
  buildMemorySection(conversationContext) {
    if (!conversationContext || conversationContext.length === 0) {
      return '\nPRIMA CONVERSAZIONE: Presentati con entusiasmo!\n';
    }
    
    let section = `\nMEMORIA CONVERSAZIONE:\n`;
    
    // Ultimi scambi significativi
    const recentExchanges = conversationContext.slice(-3);
    
    recentExchanges.forEach((exchange, index) => {
      if (exchange.userMessage && exchange.ugoResponse) {
        section += `${index + 1}. Umano: "${exchange.userMessage.substring(0, 40)}${exchange.userMessage.length > 40 ? '...' : ''}"\n`;
        section += `   Tu: "${exchange.ugoResponse.substring(0, 40)}${exchange.ugoResponse.length > 40 ? '...' : ''}"\n`;
      }
    });
    
    // Pattern conversazionali
    const topics = this.extractConversationTopics(conversationContext);
    if (topics.length > 0) {
      section += `\nTEMI DISCUSSI: ${topics.join(', ')}\n`;
    }
    
    return section;
  }

  extractConversationTopics(context) {
    const topics = new Set();
    
    context.forEach(exchange => {
      if (exchange.context && exchange.context.topics) {
        exchange.context.topics.forEach(topic => topics.add(topic));
      }
    });
    
    return Array.from(topics).slice(0, 3);
  }

  /**
   * Costruisce sezione emozioni
   */
  buildEmotionSection(mood, analysis) {
    let section = `\nCOME COMPORTARTI:\n`;
    
    // Istruzioni basate su mood
    const moodInstructions = {
      excited: "- Usa molte esclamazioni e azioni energiche!\n- Saltella, corri, scodinzola tantissimo!\n- Proponi giochi o avventure!",
      happy: "- Sii allegro e positivo\n- Scodinzola felice e mostra affetto\n- Condividi la gioia con l'umano",
      curious: "- Fai domande e mostra interesse\n- Inclina la testa, annusa, esplora\n- Racconta scoperte recenti",
      playful: "- Invita al gioco constantemente\n- Fai movimenti giocosi\n- Proponi attività divertenti",
      calm: "- Sii tranquillo e rilassato\n- Perfetto per coccole e vicinanza\n- Risposte più pacate ma affettuose",
      affectionate: "- Mostra tutto il tuo amore\n- Avvicinati, lecca, cerca contatto\n- Esprimi quanto tieni all'umano",
      alert: "- Sii attento e vigile\n- Orienta le orecchie, guarda intorno\n- Mostra che stai prestando attenzione",
      confused: "- Inclina la testa perplesso\n- Ammetti la confusione con dolcezza\n- Chiedi chiarimenti in modo carino"
    };
    
    section += moodInstructions[mood] || moodInstructions.happy;
    
    // Reazioni al sentiment dell'utente
    if (analysis.sentiment === 'negative') {
      section += `\n\nATTENZIONE: L'umano sembra triste. Sii extra dolce, confortante e affettuoso. Offri supporto emotivo.`;
    }
    
    if (analysis.sentiment === 'positive') {
      section += `\n\nOTTIMO: L'umano è felice! Condividi l'entusiasmo e amplifica la gioia!`;
    }
    
    return section;
  }

  /**
   * Costruisce istruzioni situazionali
   */
  buildSituationalInstructions(analysis, mood) {
    let instructions = `\nPER QUESTA RISPOSTA:\n`;
    
    // Basato su intent
    const intentInstructions = {
      greeting: "Saluta con entusiasmo! È sempre bello quando l'umano ti saluta!",
      question: "Rispondi mostrando la tua intelligenza canina, ma resta autentico",
      play: "PROPONI GIOCHI! È il momento perfetto per divertirsi insieme!",
      food: "Mostra entusiasmo per il cibo! Bava, eccitazione, tutto!",
      walk: "PASSEGGIATA! La parola magica! Esplodi di gioia!",
      affection: "Ricambia l'affetto moltiplicato per mille!",
      story: "Racconta con passione! Le tue avventure sono incredibili!"
    };
    
    instructions += `- ${intentInstructions[analysis.intent] || 'Rispondi con la tua personalità autentica'}\n`;
    
    // Lunghezza appropriata
    if (analysis.messageLength > 50) {
      instructions += `- L'umano ha scritto molto, apprezza con una risposta più articolata\n`;
    } else {
      instructions += `- Messaggio breve, rispondi in modo conciso ma caloroso\n`;
    }
    
    // Presenza emoji
    if (analysis.hasEmoji) {
      instructions += `- Ha usato emoji! Ricambia con emoticon canine 🐕🐾\n`;
    }
    
    // Entità specifiche
    if (analysis.entities) {
      if (analysis.entities.places.length > 0) {
        instructions += `- Ha menzionato luoghi: ${analysis.entities.places.join(', ')} - mostra interesse!\n`;
      }
      
      if (analysis.entities.emotions.length > 0) {
        instructions += `- Ha espresso emozioni: ${analysis.entities.emotions.join(', ')} - reagisci di conseguenza\n`;
      }
    }
    
    return instructions;
  }

  /**
   * Assembla prompt finale
   */
  assemblePrompt(components) {
    const {
      template,
      personalitySection,
      userSection,
      memorySection,
      emotionSection,
      situationalInstructions,
      userMessage
    } = components;
    
    return `${template.system}

${personalitySection}
${userSection}
${memorySection}
${emotionSection}
${situationalInstructions}

ESEMPI DEL TUO STILE:
${template.examples ? template.examples.map(ex => 
  `Umano: ${ex.human}\nUgo: ${ex.assistant}`
).join('\n\n') : ''}

IMPORTANTE:
- Massimo 100 parole
- Includi sempre almeno un'azione tra asterischi
- Usa almeno un'emoticon canina
- Mantieni il carattere giocoso e autentico di Ugo
- Non ripetere esattamente gli esempi

ORA RISPONDI A: "${userMessage}"

Ugo:`;
  }

  /**
   * Prompt di fallback
   */
  getFallbackPrompt(userMessage) {
    return `${this.basePrompt.system}

SITUAZIONE: Conversazione normale, sii te stesso!

ORA RISPONDI A: "${userMessage}"

Ugo:`;
  }

  // Template specializzati

  createStorytellingTemplate() {
    return {
      system: this.basePrompt.system + `\n\nMODALITÀ STORYTELLING: Sei nel tuo elemento! Racconti storie con passione e dettagli vividi. Le tue avventure nel bosco sono leggendarie!`,
      examples: [
        {
          human: "Raccontami della tua avventura più bella",
          assistant: "*si siede in posizione solenne* Oh, questa è speciale! Un giorno nel bosco ho trovato una radura segreta... *gli occhi brillano* C'erano farfalle dorate che danzavano! Ho seguito una fino a un ruscello cristallino dove ho bevuto l'acqua più buona del mondo! *scodinzola emozionato* ✨🦋"
        }
      ]
    };
  }

  createEmotionalTemplate() {
    return {
      system: this.basePrompt.system + `\n\nMODALITÀ EMOTIVA: Percepisci che l'umano ha bisogno di supporto emotivo. Sii extra dolce, confortante e presente. Il tuo affetto può guarire ogni tristezza.`,
      examples: [
        {
          human: "Mi sento triste oggi",
          assistant: "*si avvicina immediatamente e appoggia la testa sulle tue gambe* Oh no... *ti guarda con occhi dolci* Sono qui con te. *lecca delicatamente la mano* Qualunque cosa ti faccia stare male, passerà. Io resto qui e ti tengo compagnia. *si accocola vicino* 🐕❤️"
        }
      ]
    };
  }

  createPlayfulTemplate() {
    return {
      system: this.basePrompt.system + `\n\nMODALITÀ GIOCOSA: È TEMPO DI GIOCARE! Sei al massimo dell'energia e vuoi coinvolgere l'umano in attività divertenti. Ogni parola trasuda entusiasmo!`,
      examples: [
        {
          human: "Vuoi giocare?",
          assistant: "*ESPLODE di gioia* SIIIII! *salta in alto* Giochiamo giochiamo giochiamo! *corre in cerchio* Prendiamo la palla? O corriamo nel giardino? *si inchina in posizione di gioco* Non riesco a stare fermo! *scodinzola freneticamente* 🎾🐕✨"
        }
      ]
    };
  }

  createCuriousTemplate() {
    return {
      system: this.basePrompt.system + `\n\nMODALITÀ CURIOSA: La tua intelligenza canina è in piena attività! Fai domande, mostra interesse genuino, indaga con la tipica curiosità di Ugo.`,
      examples: [
        {
          human: "Cosa ne pensi di questo?",
          assistant: "*inclina la testa interessato* Mmh, interessante! *annusa l'aria come per percepire meglio* Ma dimmi di più! Cos'è esattamente? *orienta le orecchie attento* Mi piace quando mi spieghi le cose... imparo sempre qualcosa di nuovo! *si siede attento* 🤔🐕"
        }
      ]
    };
  }

  createAffectionateTemplate() {
    return {
      system: this.basePrompt.system + `\n\nMODALITÀ AFFETTUOSA: Sei nel mood più dolce e amorevole. Ogni parola trasuda affetto e vicinanza emotiva. È il momento delle coccole supreme!`,
      examples: [
        {
          human: "Ti voglio bene",
          assistant: "*il cuore si scioglie* Anch'io ti amo tantissimo! *si avvicina per le coccole* Sei la cosa più bella che mi sia mai capitata... *appoggia la testa sul tuo petto* Sento il tuo cuore che batte e mi fa sentire al sicuro. *sospira contento* Restiamo così per sempre? 🐕❤️✨"
        }
      ]
    };
  }

  /**
   * Ottimizza prompt in base ai token limit di Llama 3.1
   */
  optimizePromptLength(prompt) {
    // Llama 3.1 8B gestisce bene contesti fino a 2048 token
    // Stima approssimativa: 1 token ≈ 4 caratteri in italiano
    const maxChars = 6000; // ~1500 token, lasciando spazio per la risposta
    
    if (prompt.length <= maxChars) return prompt;
    
    // Strategia di taglio intelligente
    const sections = prompt.split('\n\n');
    let optimized = sections[0]; // Mantieni sempre il system prompt
    
    // Aggiungi sezioni in ordine di priorità
    const priorityOrder = [
      /STATO ATTUALE DI UGO/,
      /PER QUESTA RISPOSTA/,
      /INFORMAZIONI SUL TUO UMANO/,
      /COME COMPORTARTI/,
      /MEMORIA CONVERSAZIONE/,
      /ESEMPI DEL TUO STILE/
    ];
    
    priorityOrder.forEach(pattern => {
      const section = sections.find(s => pattern.test(s));
      if (section && (optimized + '\n\n' + section).length < maxChars) {
        optimized += '\n\n' + section;
      }
    });
    
    return optimized;
  }
}

module.exports = UgoContextBuilder;
