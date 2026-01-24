/**
 * TokenCounter Unit Tests
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.1 - Document Chunking & Processing
 *
 * Tests token counting accuracy, performance, and content type detection.
 * Target coverage: >90%
 */

import { describe, it, expect } from 'vitest';
import { TokenCounter } from '../TokenCounter';

describe('TokenCounter', () => {
  describe('count', () => {
    it('should count tokens in prose text', () => {
      const text = 'The quick brown fox jumps over the lazy dog.';
      const result = TokenCounter.count(text, 'prose');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(text.length);
      expect(result.method).toBe('character-based');

      // Prose ~4 chars/token: 45 chars ≈ 11-12 tokens
      expect(result.tokens).toBeGreaterThanOrEqual(10);
      expect(result.tokens).toBeLessThanOrEqual(15);
    });

    it('should count tokens in code text', () => {
      const code = 'function foo() { return 42; }';
      const result = TokenCounter.count(code, 'code');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(code.length);

      // Code ~3.5 chars/token: 29 chars ≈ 8-9 tokens
      expect(result.tokens).toBeGreaterThanOrEqual(7);
      expect(result.tokens).toBeLessThanOrEqual(11);
    });

    it('should count tokens in mixed content', () => {
      const mixed = 'Here is some code: const x = 10; // comment';
      const result = TokenCounter.count(mixed, 'mixed');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(mixed.length);

      // Mixed ~3.75 chars/token: 45 chars ≈ 12 tokens
      expect(result.tokens).toBeGreaterThanOrEqual(10);
      expect(result.tokens).toBeLessThanOrEqual(15);
    });

    it('should handle empty text', () => {
      const result = TokenCounter.count('', 'prose');

      expect(result.tokens).toBe(0);
      expect(result.characters).toBe(0);
      expect(result.method).toBe('character-based');
    });

    it('should handle single character', () => {
      const result = TokenCounter.count('a', 'prose');

      expect(result.tokens).toBe(1);
      expect(result.characters).toBe(1);
    });

    it('should handle multi-line text', () => {
      const multiline = `Line 1
Line 2
Line 3`;
      const result = TokenCounter.count(multiline, 'prose');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(multiline.length);
    });

    it('should handle special characters', () => {
      const special = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';
      const result = TokenCounter.count(special, 'code');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(special.length);
    });

    it('should handle unicode characters', () => {
      const unicode = 'Hello 世界 🌍';
      const result = TokenCounter.count(unicode, 'prose');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(unicode.length);
    });

    it('should be consistent across multiple calls', () => {
      const text = 'Consistent text for testing';
      const result1 = TokenCounter.count(text, 'prose');
      const result2 = TokenCounter.count(text, 'prose');

      expect(result1.tokens).toBe(result2.tokens);
      expect(result1.characters).toBe(result2.characters);
    });

    it('should use different ratios for different content types', () => {
      const text = 'Same text, different ratios';
      const proseResult = TokenCounter.count(text, 'prose');
      const codeResult = TokenCounter.count(text, 'code');

      // Code should have more tokens (smaller char/token ratio)
      expect(codeResult.tokens).toBeGreaterThan(proseResult.tokens);
    });
  });

  describe('detectContentType', () => {
    it('should detect prose content', () => {
      const prose = 'The quick brown fox jumps over the lazy dog.';
      const type = TokenCounter.detectContentType(prose);

      expect(type).toBe('prose');
    });

    it('should detect code content', () => {
      const code =
        'function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }';
      const type = TokenCounter.detectContentType(code);

      expect(type).toBe('code');
    });

    it('should detect code with braces', () => {
      const code = '{ "key": "value", "nested": { "foo": "bar" } }';
      const type = TokenCounter.detectContentType(code);

      expect(type).toBe('code');
    });

    it('should detect code with operators', () => {
      const code = 'x = a + b * c / d - e;';
      const type = TokenCounter.detectContentType(code);

      expect(type).toBe('code');
    });

    it('should handle mixed content', () => {
      const mixed = 'This is a comment about code: x = 10';
      const type = TokenCounter.detectContentType(mixed);

      // Could be prose or mixed depending on ratio
      expect(['prose', 'mixed', 'code']).toContain(type);
    });

    it('should handle empty text', () => {
      const type = TokenCounter.detectContentType('');

      expect(type).toBe('mixed');
    });
  });

  describe('countAuto', () => {
    it('should auto-detect and count prose', () => {
      const prose = 'The quick brown fox jumps over the lazy dog.';
      const result = TokenCounter.countAuto(prose);

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.method).toBe('character-based');
    });

    it('should auto-detect and count code', () => {
      const code = 'function foo() { return 42; }';
      const result = TokenCounter.countAuto(code);

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.method).toBe('character-based');
    });

    it('should handle mixed content', () => {
      const mixed = 'This code returns 42: function foo() { return 42; }';
      const result = TokenCounter.countAuto(mixed);

      expect(result.tokens).toBeGreaterThan(0);
    });
  });

  describe('estimateChars', () => {
    it('should estimate characters for prose', () => {
      const chars = TokenCounter.estimateChars(100, 'prose');

      // 100 tokens * 4 chars/token = 400 chars
      expect(chars).toBe(400);
    });

    it('should estimate characters for code', () => {
      const chars = TokenCounter.estimateChars(100, 'code');

      // 100 tokens * 3.5 chars/token = 350 chars
      expect(chars).toBe(350);
    });

    it('should estimate characters for mixed content', () => {
      const chars = TokenCounter.estimateChars(100, 'mixed');

      // 100 tokens * 3.75 chars/token = 375 chars
      expect(chars).toBe(375);
    });

    it('should handle zero tokens', () => {
      const chars = TokenCounter.estimateChars(0, 'prose');

      expect(chars).toBe(0);
    });

    it('should handle large token counts', () => {
      const chars = TokenCounter.estimateChars(10000, 'prose');

      expect(chars).toBe(40000);
    });
  });

  describe('performance', () => {
    it('should count 10KB text in <10ms', () => {
      // Generate 10KB of text (~10,000 characters)
      const text = 'Lorem ipsum dolor sit amet. '.repeat(357); // ~10KB

      const startTime = performance.now();
      TokenCounter.count(text, 'prose');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(10);
    });

    it('should handle very large text (100KB) efficiently', () => {
      // Generate 100KB of text
      const text = 'Lorem ipsum dolor sit amet. '.repeat(3571); // ~100KB

      const startTime = performance.now();
      TokenCounter.count(text, 'prose');
      const duration = performance.now() - startTime;

      // Should still be fast (target <100ms for 100KB)
      expect(duration).toBeLessThan(100);
    });

    it('should auto-detect quickly', () => {
      const text = 'function test() { return "hello world"; }';

      const startTime = performance.now();
      TokenCounter.detectContentType(text);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5);
    });
  });

  describe('accuracy', () => {
    it('should estimate within reasonable range for known samples', () => {
      // Sample with known token count (approximate)
      // "Hello world" is approximately 2-3 tokens
      const text = 'Hello world';
      const result = TokenCounter.count(text, 'prose');

      // 11 chars / 4 = 2.75 → 3 tokens
      expect(result.tokens).toBe(3);
    });

    it('should estimate within range for larger sample', () => {
      // Larger sample: ~100 tokens expected
      const text = 'a '.repeat(200); // 400 characters
      const result = TokenCounter.count(text, 'prose');

      // 400 chars / 4 = 100 tokens
      expect(result.tokens).toBe(100);
    });

    it('should round up fractional tokens', () => {
      // 10 chars / 4 = 2.5 → 3 tokens
      const text = '1234567890';
      const result = TokenCounter.count(text, 'prose');

      expect(result.tokens).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only text', () => {
      const result = TokenCounter.count('     ', 'prose');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(5);
    });

    it('should handle newlines and tabs', () => {
      const text = '\n\t\r\n';
      const result = TokenCounter.count(text, 'code');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(text.length);
    });

    it('should handle very long single line', () => {
      const longLine = 'x'.repeat(10000);
      const result = TokenCounter.count(longLine, 'code');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(10000);
    });

    it('should handle repeated characters', () => {
      const text = 'aaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const result = TokenCounter.count(text, 'prose');

      expect(result.tokens).toBeGreaterThan(0);
    });
  });
});
