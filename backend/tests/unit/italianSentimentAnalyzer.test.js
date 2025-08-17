const ItalianSentimentAnalyzer = require('../../src/services/italianSentimentAnalyzer');

describe('ItalianSentimentAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new ItalianSentimentAnalyzer();
  });

  describe('Basic sentiment analysis', () => {
    test('should detect positive sentiment', () => {
      const result = analyzer.analyze('Sono molto felice oggi! Che bella giornata!');
      
            expect(result.sentiment).toBe('positivo');
            expect(result.score).toBeGreaterThan(0.4);
            expect(result.confidence).toBeGreaterThan(0.45);
    });

    test('should detect negative sentiment', () => {
      const result = analyzer.analyze('Sono molto triste e arrabbiato. Tutto va male.');
      
            expect(result.sentiment).toBe('negativo');
      expect(result.score).toBeLessThan(-0.3);
            expect(result.confidence).toBeGreaterThan(0.45);
    });

    test('should detect neutral sentiment', () => {
      const result = analyzer.analyze('Oggi è una giornata normale. Niente di particolare.');
      
      expect(result.sentiment).toBe('neutro');
      expect(Math.abs(result.score)).toBeLessThan(0.3);
    });
  });

  describe('Dog-specific words', () => {
    test('should detect joy with dog-related positive words', () => {
      const result = analyzer.analyze('Andiamo al parco a giocare con la palla!');
      
            expect(result.sentiment).toBe('positivo');
      expect(result.score).toBeGreaterThan(0.6);
    });

    test('should detect concern with dog-related negative words', () => {
      const result = analyzer.analyze('Il cane è malato e deve andare dal veterinario');
      
            expect(result.sentiment).toBe('negativo');
      expect(result.score).toBeLessThan(0);
    });
  });

  describe('Emoji analysis', () => {
    test('should boost positive sentiment with positive emojis', () => {
      const withEmoji = analyzer.analyze('Sono felice! 😊🐕');
      const withoutEmoji = analyzer.analyze('Sono felice!');
      
      expect(withEmoji.score).toBeGreaterThan(withoutEmoji.score);
      expect(withEmoji.details.emojis.count).toBe(2);
    });

    test('should handle negative emojis', () => {
      const result = analyzer.analyze('Sono triste 😢😭');
      
            expect(result.sentiment).toBe('negativo');
      expect(result.details.emojis.score).toBeLessThan(0);
    });
  });

  describe('Intensifiers and negations', () => {
    test('should handle intensifiers', () => {
      const intense = analyzer.analyze('Sono molto molto felice!');
      const normal = analyzer.analyze('Sono felice');
      
      expect(intense.score).toBeGreaterThan(normal.score);
    });

    test('should handle negations', () => {
      const positive = analyzer.analyze('È bello');
      const negated = analyzer.analyze('Non è bello');
      
      expect(positive.score).toBeGreaterThan(0);
      expect(negated.score).toBeLessThan(positive.score);
    });
  });

  describe('Pattern analysis', () => {
    test('should detect questions', () => {
      const result = analyzer.analyze('Come stai? Tutto bene?');
      
      expect(result.details.patterns.details.questions).toBe(2);
    });

    test('should detect exclamations', () => {
      const result = analyzer.analyze('Che bello! Fantastico! Incredibile!');
      
      expect(result.details.patterns.details.exclamations).toBe(3);
      expect(result.score).toBeGreaterThan(0);
    });

    test('should detect caps (emphasis)', () => {
      const result = analyzer.analyze('SONO MOLTO FELICE OGGI');
      
      expect(result.details.patterns.details.caps).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty string', () => {
      const result = analyzer.analyze('');
      
      expect(result.sentiment).toBe('neutro');
      expect(result.score).toBe(0);
      expect(result.confidence).toBeLessThan(0.2);
    });

    test('should handle null/undefined input', () => {
      expect(analyzer.analyze(null).sentiment).toBe('neutro');
      expect(analyzer.analyze(undefined).sentiment).toBe('neutro');
    });

    test('should handle very long text', () => {
      const longText = 'Sono felice '.repeat(100);
      const result = analyzer.analyze(longText);
      
            expect(result.sentiment).toBe('positivo');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('confidence');
    });

    test('should handle non-Italian text gracefully', () => {
      const result = analyzer.analyze('I am happy today');
      
      // Dovrebbe comunque fornire un risultato
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('score');
    });
  });

  describe('Batch analysis', () => {
    test('should analyze multiple texts', () => {
      const texts = [
        'Sono felice!',
        'Sono triste...',
        'Giornata normale'
      ];
      
      const results = analyzer.analyzeBatch(texts);
      
      expect(results).toHaveLength(3);
            expect(results[0].sentiment).toBe('positivo');
      expect(['tristezza', 'negativo']).toContain(results[1].sentiment);
      expect(results[2].sentiment).toBe('neutro');
    });
  });

  describe('Statistics', () => {
    test('should provide analyzer statistics', () => {
      const stats = analyzer.getStats();
      
      expect(stats).toHaveProperty('positiveWords');
      expect(stats).toHaveProperty('negativeWords');
      expect(stats).toHaveProperty('intensifiers');
      expect(stats).toHaveProperty('negations');
      expect(stats).toHaveProperty('emojis');
      
      expect(stats.positiveWords).toBeGreaterThan(20);
      expect(stats.negativeWords).toBeGreaterThan(20);
    });
  });

  describe('Confidence calculation', () => {
    test('should have higher confidence for longer texts with clear sentiment', () => {
      const short = analyzer.analyze('Bene');
      const long = analyzer.analyze('Sono molto felice oggi! Che bella giornata splendida! Mi sento fantastico!');
      
      expect(long.confidence).toBeGreaterThan(short.confidence);
    });

    test('should have lower confidence for ambiguous texts', () => {
      const clear = analyzer.analyze('Sono molto felice!');
      const ambiguous = analyzer.analyze('Forse va bene, ma non so...');
      
      expect(clear.confidence).toBeGreaterThan(ambiguous.confidence);
    });
  });

  describe('Metadata', () => {
    test('should include proper metadata', () => {
      const result = analyzer.analyze('Test');
      
      expect(result.metadata).toHaveProperty('language', 'it');
      expect(result.metadata).toHaveProperty('analyzer', 'rule-based-italian');
      expect(result.metadata).toHaveProperty('timestamp');
    });
  });
});
