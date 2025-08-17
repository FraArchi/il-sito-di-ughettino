const EnhancedEmotionEngine = require('../../src/services/enhancedEmotionEngine');

describe('EnhancedEmotionEngine', () => {
  let emotionEngine;

  beforeEach(() => {
    emotionEngine = new EnhancedEmotionEngine();
  });

  describe('Basic emotion processing', () => {
    test('should process happy message correctly', () => {
      const input = {
        user_id: 'test-user',
        message: 'Ciao Ugo! Che bella giornata!',
        context_flags: {}
      };

      const result = emotionEngine.processMessage(input);

      expect(result.mood).toBe('gioia');
      expect(result.behavior).toHaveProperty('scodinzolio');
      expect(result.behavior).toHaveProperty('posizione');
      expect(['veloce', 'medio']).toContain(result.behavior.scodinzolio);
      expect(['in piedi', 'saltellante']).toContain(result.behavior.posizione);
    });

    test('should process sad message correctly', () => {
      const input = {
        user_id: 'test-user', 
        message: 'Mi sento molto triste e solo oggi...',
        context_flags: {}
      };

      const result = emotionEngine.processMessage(input);

      expect(result.mood).toBe('tristezza');
      expect(['lento', 'basso']).toContain(result.behavior.scodinzolio);
      expect(['sdraiato', 'accovacciato']).toContain(result.behavior.posizione);
    });

    test('should process neutral message correctly', () => {
      const input = {
        user_id: 'test-user',
        message: 'Come stai oggi?',
        context_flags: {}
      };

      const result = emotionEngine.processMessage(input);

      expect(result.mood).toBeDefined();
      expect(['gioia', 'tristezza', 'rabbia', 'paura', 'neutro']).toContain(result.mood);
      expect(result.behavior).toHaveProperty('scodinzolio');
      expect(result.behavior).toHaveProperty('posizione');
      expect(result.behavior).toHaveProperty('intensity');
      expect(result.behavior).toHaveProperty('description');
      expect(typeof result.behavior.scodinzolio).toBe('string');
      expect(typeof result.behavior.posizione).toBe('string');
    });
  });

  describe('Emotional triggers', () => {
    test('should recognize joy triggers', () => {
      const triggers = emotionEngine.analyzeEmotionalTriggers('Andiamo a giocare con la palla al parco!');

      expect(triggers.joy).toBeGreaterThan(0);
      expect(triggers.dominantTrigger).toBe('joy');
    });

    test('should recognize sadness triggers', () => {
      const triggers = emotionEngine.analyzeEmotionalTriggers('Il cane è malato e deve andare dal veterinario');

      expect(triggers.sadness).toBeGreaterThan(0);
    });

    test('should recognize fear triggers', () => {
      const triggers = emotionEngine.analyzeEmotionalTriggers('C\'è stato un rumore forte, ho paura!');

      expect(triggers.fear).toBeGreaterThan(0);
    });

    test('should recognize curiosity triggers', () => {
      const triggers = emotionEngine.analyzeEmotionalTriggers('Cosa c\'è di nuovo? Dimmi di più!');

      expect(triggers.curiosity).toBeGreaterThan(0);
    });
  });

  describe('Behavior generation', () => {
    test('should generate appropriate behavior for joy', () => {
      const behavior = emotionEngine.generateBehavior('gioia');

      expect(behavior).toHaveProperty('scodinzolio');
      expect(behavior).toHaveProperty('posizione'); 
      expect(behavior).toHaveProperty('intensity');
      expect(behavior).toHaveProperty('description');
      expect(behavior.intensity).toBeGreaterThan(0.5);
      expect(typeof behavior.description).toBe('string');
      expect(behavior.description.length).toBeGreaterThan(0);
    });

    test('should generate appropriate behavior for sadness', () => {
      const behavior = emotionEngine.generateBehavior('tristezza');

      expect(['lento', 'basso']).toContain(behavior.scodinzolio);
      expect(['sdraiato', 'accovacciato']).toContain(behavior.posizione);
      expect(behavior.intensity).toBeLessThan(0.5);
    });

    test('should generate appropriate behavior for fear', () => {
      const behavior = emotionEngine.generateBehavior('paura');

      expect(['basso', 'fermo']).toContain(behavior.scodinzolio);
      expect(['accovacciato', 'nascosto']).toContain(behavior.posizione);
      expect(behavior.intensity).toBeLessThan(0.3);
    });
  });

  describe('Context flags handling', () => {
    test('should handle urgent flag', () => {
      const input = {
        user_id: 'test-user',
        message: 'Aiuto!',
        context_flags: { urgent: true }
      };

      const result = emotionEngine.processMessage(input);

      // Con flag urgent, dovrebbe aumentare alertness
      expect(result.emotional_state.overallEnergy).not.toBe('basso');
    });

    test('should handle memory flag', () => {
      const input = {
        user_id: 'test-user',
        message: 'Ricordi cosa abbiamo detto prima?',
        context_flags: { use_memory: true }
      };

      const result = emotionEngine.processMessage(input);

      expect(result).toBeDefined();
      expect(result.mood).toBeDefined();
    });
  });

  describe('Emotional state tracking', () => {
    test('should maintain emotional history', () => {
      const input1 = {
        user_id: 'test-user',
        message: 'Sono felice!',
        context_flags: {}
      };

      const input2 = {
        user_id: 'test-user', 
        message: 'Ancora più felice!',
        context_flags: {}
      };

      emotionEngine.processMessage(input1);
      emotionEngine.processMessage(input2);

      expect(emotionEngine.emotionHistory.length).toBe(2);
    });

    test('should calculate emotional stability', () => {
      // Genera diversi messaggi con mood diversi
      const messages = [
        { user_id: 'test', message: 'Felice!', context_flags: {} },
        { user_id: 'test', message: 'Triste...', context_flags: {} },
        { user_id: 'test', message: 'Neutro.', context_flags: {} },
        { user_id: 'test', message: 'Di nuovo felice!', context_flags: {} }
      ];

      messages.forEach(msg => emotionEngine.processMessage(msg));

      const stability = emotionEngine.calculateStability();
      expect(['stabile', 'molto-stabile', 'variabile']).toContain(stability);
    });
  });

  describe('Default responses', () => {
    test('should provide default response for errors', () => {
      const defaultResponse = emotionEngine.getDefaultResponse();

      expect(defaultResponse.mood).toBe('neutro');
      expect(defaultResponse.behavior).toHaveProperty('scodinzolio');
      expect(defaultResponse.behavior).toHaveProperty('posizione');
      expect(defaultResponse.sentiment).toBeDefined();
      expect(defaultResponse.emotional_state).toBeDefined();
    });
  });

  describe('Reset and force mood', () => {
    test('should reset emotions to base state', () => {
      // Cambia stato emotivo
      emotionEngine.processMessage({
        user_id: 'test',
        message: 'Sono super eccitato!!!',
        context_flags: {}
      });

      emotionEngine.resetEmotions();

      expect(emotionEngine.currentMood).toBe('gioia');
      expect(emotionEngine.emotionHistory).toHaveLength(0);
    });

    test('should force specific mood', () => {
      emotionEngine.forceMood('tristezza', 0.9);

      expect(emotionEngine.currentMood).toBe('tristezza');
      expect(emotionEngine.currentEmotions.anxiety).toBeGreaterThan(0.5);
    });
  });

  describe('Engine statistics', () => {
    test('should provide engine statistics', () => {
      const stats = emotionEngine.getEngineStats();

      expect(stats).toHaveProperty('sentimentAnalyzer');
      expect(stats).toHaveProperty('emotionHistorySize');
      expect(stats).toHaveProperty('currentEmotions');
      expect(stats).toHaveProperty('currentMood');
      expect(stats).toHaveProperty('recentMoods');
    });
  });

  describe('Complex scenarios', () => {
    test('should handle mixed emotions correctly', () => {
      const input = {
        user_id: 'test-user',
        message: 'Sono felice ma anche un po\' preoccupato...',
        context_flags: {}
      };

      const result = emotionEngine.processMessage(input);

      expect(result.mood).toBeDefined();
      expect(result.behavior).toBeDefined();
      expect(result.emotional_state).toHaveProperty('dominantEmotions');
    });

    test('should handle dog-specific scenarios', () => {
      const scenarios = [
        'Vuoi andare a passeggio?',
        'Hai sentito quel rumore?', 
        'Prendi la palla!',
        'Bravo cane!',
        'È ora del biscotto!'
      ];

      scenarios.forEach(message => {
        const result = emotionEngine.processMessage({
          user_id: 'test',
          message,
          context_flags: {}
        });

        expect(result.mood).toBeDefined();
        expect(result.behavior).toBeDefined();
      });
    });

    test('should adapt to conversation context', () => {
      // Simula una conversazione che diventa progressivamente più triste
      const messages = [
        'Ciao Ugo!',
        'Non mi sento molto bene oggi',
        'Sono davvero triste',
        'Mi sento solo'
      ];

      let lastResult;
      messages.forEach(message => {
        lastResult = emotionEngine.processMessage({
          user_id: 'test',
          message,
          context_flags: { use_memory: true }
        });
      });

      // L'ultimo risultato dovrebbe riflettere empatia
      expect(lastResult.emotional_state.empathyLevel).toBeDefined();
      expect(parseFloat(lastResult.emotional_state.empathyLevel.replace('%', ''))).toBeGreaterThan(70);
    });
  });

  describe('Behavior description generation', () => {
    test('should generate meaningful behavior descriptions', () => {
      const behaviors = [
        emotionEngine.generateBehavior('gioia'),
        emotionEngine.generateBehavior('tristezza'),
        emotionEngine.generateBehavior('paura'),
        emotionEngine.generateBehavior('neutro')
      ];

      behaviors.forEach(behavior => {
        expect(behavior.description).toBeDefined();
        expect(behavior.description.length).toBeGreaterThan(10);
        expect(behavior.description).toMatch(/(scodinzol|coda|muove|mentre|è|tiene)/);
      });
    });
  });
});
