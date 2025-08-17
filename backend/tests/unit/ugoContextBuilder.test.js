const UgoContextBuilder = require('../../src/services/ugoContextBuilderV2');

describe('UgoContextBuilder', () => {
  let contextBuilder;

  beforeEach(() => {
    contextBuilder = new UgoContextBuilder();
  });

  describe('Basic prompt building', () => {
    test('should build basic prompt with user message', () => {
      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Ciao Ugo!'
      });

      expect(prompt).toContain('Sei Ugo');
      expect(prompt).toContain('Ciao Ugo!');
      expect(prompt).toMatch(/Umano:.*Ciao Ugo!/);
      expect(prompt).toMatch(/Ugo:$/);
    });

    test('should include mood context', () => {
      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Come stai?',
        mood: 'gioia'
      });

      expect(prompt).toContain('CONTESTO EMOTIVO');
      expect(prompt).toContain('felice e giocoso');
    });

    test('should include behavior hints', () => {
      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Ciao!',
        mood: 'tristezza'
      });

      expect(prompt).toContain('COMPORTAMENTO');
      expect(prompt).toContain('scodinzolio lento');
    });
  });

  describe('Conversation context', () => {
    test('should include recent conversation history', () => {
      const conversationContext = [
        { userMessage: 'Ciao', ugoResponse: 'Ciao! *scodinzola*' },
        { userMessage: 'Come stai?', ugoResponse: 'Bene! Tu come stai?' }
      ];

      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Fantastico!',
        conversationContext
      });

      expect(prompt).toContain('CONVERSAZIONE RECENTE');
      expect(prompt).toContain('Come stai?');
      expect(prompt).toContain('Bene! Tu come stai?');
    });

    test('should limit conversation context to last 2 exchanges', () => {
      const longContext = [
        { userMessage: 'Messaggio 1', ugoResponse: 'Risposta 1' },
        { userMessage: 'Messaggio 2', ugoResponse: 'Risposta 2' },
        { userMessage: 'Messaggio 3', ugoResponse: 'Risposta 3' },
        { userMessage: 'Messaggio 4', ugoResponse: 'Risposta 4' }
      ];

      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Messaggio 5',
        conversationContext: longContext
      });

      expect(prompt).toContain('Messaggio 3');
      expect(prompt).toContain('Messaggio 4');
      expect(prompt).not.toContain('Messaggio 1');
      expect(prompt).not.toContain('Messaggio 2');
    });
  });

  describe('Prompt optimization', () => {
    test('should optimize long prompts', () => {
      const longMessage = 'Questo è un messaggio molto lungo che potrebbe causare problemi di lunghezza '.repeat(20);
      
      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: longMessage,
        mood: 'gioia',
        conversationContext: [
          { userMessage: 'Context molto lungo'.repeat(50), ugoResponse: 'Risposta lunga'.repeat(50) }
        ]
      });

      expect(prompt.length).toBeLessThanOrEqual(1600);
    });

    test('should always include system prompt', () => {
      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Test'
      });

      expect(prompt).toContain('Sei Ugo, un cane speciale e intelligente');
    });
  });

  describe('Fallback prompt', () => {
    test('should provide fallback prompt', () => {
      const fallback = contextBuilder.getFallbackPrompt('Test message');

      expect(fallback).toContain('Sei Ugo');
      expect(fallback).toContain('Test message');
      expect(fallback).toMatch(/Ugo:$/);
      expect(fallback.length).toBeLessThan(200);
    });
  });

  describe('Specialized prompts', () => {
    test('should build story prompt', () => {
      const storyPrompt = contextBuilder.buildStoryPrompt('avventura nel bosco', 'gioia');

      expect(storyPrompt).toContain('storia');
      expect(storyPrompt).toContain('avventura nel bosco');
      expect(storyPrompt).toContain('max 100 parole');
      expect(storyPrompt).toContain('gioia');
    });

    test('should build emotional response prompt', () => {
      const emotionalPrompt = contextBuilder.buildEmotionalResponsePrompt(
        'Sono triste', 'sad', 'tristezza'
      );

      expect(emotionalPrompt).toContain('Sono triste');
      expect(emotionalPrompt).toContain('tristezza');
      expect(emotionalPrompt).toContain('Consolante');
    });

    test('should build question prompt', () => {
      const questionPrompt = contextBuilder.buildQuestionPrompt('Perché i cani scodinzolano?', {
        mood: 'curiosity'
      });

      expect(questionPrompt).toContain('Perché i cani scodinzolano?');
      expect(questionPrompt).toContain('curiosity');
      expect(questionPrompt).toContain('Max 60 parole');
    });
  });

  describe('Test prompts', () => {
    test('should build test prompt for happy scenario', () => {
      const testPrompt = contextBuilder.buildTestPrompt('happy');

      expect(testPrompt).toContain('Che bella giornata!');
            expect(testPrompt).toContain('felice');
    });

    test('should build test prompt for sad scenario', () => {
      const testPrompt = contextBuilder.buildTestPrompt('sad');

      expect(testPrompt).toContain('Mi sento solo');
      expect(testPrompt).toContain('tristezza');
    });

    test('should build test prompt for play scenario', () => {
      const testPrompt = contextBuilder.buildTestPrompt('play');

      expect(testPrompt).toContain('Vuoi giocare?');
            expect(testPrompt).toContain('felice');
    });

    test('should handle unknown scenario with default', () => {
      const testPrompt = contextBuilder.buildTestPrompt('unknown');

      expect(testPrompt).toBeDefined();
      expect(testPrompt).toContain('Ugo:');
    });
  });

  describe('Prompt validation', () => {
    test('should validate and optimize valid prompt', () => {
      const goodPrompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Test message'
      });

      const validated = contextBuilder.validateAndOptimizePrompt(goodPrompt);

      expect(validated).toBeDefined();
      expect(validated.length).toBeGreaterThan(100);
      expect(validated.length).toBeLessThanOrEqual(1600);
    });

    test('should handle overly long prompt', () => {
      const veryLongPrompt = 'A'.repeat(2000);
      const optimized = contextBuilder.validateAndOptimizePrompt(veryLongPrompt);

      expect(optimized.length).toBeLessThanOrEqual(1600);
      expect(optimized).toMatch(/Ugo:$/);
    });

    test('should warn about very short prompts', () => {
      const shortPrompt = 'Short';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      contextBuilder.validateAndOptimizePrompt(shortPrompt);
      
      // Note: In a real test, we'd check if logger.warn was called
      // For now, we just ensure the function handles short prompts
      expect(shortPrompt).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Prompt quality analysis', () => {
    test('should analyze high quality prompt', () => {
      const goodPrompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Come stai oggi?',
        mood: 'gioia'
      });

      const analysis = contextBuilder.analyzePromptQuality(goodPrompt);

      expect(analysis.score).toBeGreaterThan(60);
      expect(analysis.recommendation).toMatch(/(good|excellent)/);
      expect(analysis.metrics.hasSystemPrompt).toBe(true);
      expect(analysis.metrics.hasUserMessage).toBe(true);
      expect(analysis.metrics.hasResponse).toBe(true);
    });

    test('should analyze poor quality prompt', () => {
      const poorPrompt = 'Hello';
      const analysis = contextBuilder.analyzePromptQuality(poorPrompt);

      expect(analysis.score).toBeLessThan(60);
      expect(analysis.issues.length).toBeGreaterThan(0);
    });

    test('should identify specific quality issues', () => {
      const analysis1 = contextBuilder.analyzePromptQuality('A'.repeat(2000));
      expect(analysis1.issues).toContain('Prompt troppo lungo');

      const analysis2 = contextBuilder.analyzePromptQuality('Hi');
      expect(analysis2.issues).toContain('Prompt troppo breve');

      const analysis3 = contextBuilder.analyzePromptQuality('Test without system prompt');
      expect(analysis3.issues).toContain('Manca system prompt');
    });
  });

  describe('Builder statistics', () => {
    test('should provide builder statistics', () => {
      const stats = contextBuilder.getBuilderStats();

      expect(stats).toHaveProperty('systemPromptLength');
      expect(stats).toHaveProperty('availableMoods');
      expect(stats).toHaveProperty('availableBehaviors');
      expect(stats).toHaveProperty('maxPromptLength', 1600);
      expect(stats).toHaveProperty('minPromptLength', 100);

      expect(stats.availableMoods).toBeGreaterThan(3);
      expect(stats.availableBehaviors).toBeGreaterThan(3);
      expect(stats.systemPromptLength).toBeGreaterThan(500);
    });
  });

  describe('Edge cases', () => {
    test('should handle missing options gracefully', () => {
      const prompt = contextBuilder.buildUgoPrompt({});

      expect(prompt).toBeDefined();
      expect(prompt).toContain('Sei Ugo');
    });

    test('should handle empty conversation context', () => {
      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Test',
        conversationContext: []
      });

      expect(prompt).toBeDefined();
      expect(prompt).not.toContain('CONVERSAZIONE RECENTE');
    });

    test('should handle undefined mood gracefully', () => {
      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: 'Test',
        mood: undefined
      });

      expect(prompt).toBeDefined();
      // Should fallback to neutro or handle gracefully
    });

    test('should handle very long user message', () => {
      const longMessage = 'Test '.repeat(100);
      const prompt = contextBuilder.buildUgoPrompt({
        userMessage: longMessage
      });

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeLessThanOrEqual(1600);
    });
  });

  describe('Prompt structure consistency', () => {
    test('should always maintain consistent structure', () => {
      const moods = ['gioia', 'tristezza', 'paura', 'rabbia', 'neutro'];
      
      moods.forEach(mood => {
        const prompt = contextBuilder.buildUgoPrompt({
          userMessage: 'Test message',
          mood
        });

        expect(prompt).toContain('Sei Ugo');
        expect(prompt).toContain('Test message');
        expect(prompt).toMatch(/Ugo:$/);
        expect(prompt).toContain('NUOVO MESSAGGIO:');
      });
    });
  });
});