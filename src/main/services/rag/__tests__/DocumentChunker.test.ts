/**
 * DocumentChunker Unit Tests
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.1 - Document Chunking & Processing
 *
 * Tests document chunking accuracy, metadata tracking, and performance.
 * Target coverage: >90%
 */

import { describe, it, expect } from 'vitest';
import { DocumentChunker } from '../DocumentChunker';

describe('DocumentChunker', () => {
  describe('chunk - basic functionality', () => {
    it('should return single chunk for small documents', () => {
      const content = 'This is a small document.';
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/file.txt',
      });

      expect(result.chunks).toHaveLength(1);
      expect(result.totalChunks).toBe(1);
      expect(result.chunks[0]?.text).toBe(content);
      expect(result.chunks[0]?.metadata.chunkIndex).toBe(0);
      expect(result.chunks[0]?.metadata.totalChunks).toBe(1);
    });

    it('should chunk large document into multiple pieces', () => {
      // Generate content >500 tokens (~2000 characters)
      const content = 'Line of text content. '.repeat(100);
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/large.txt',
        chunkSize: 500,
      });

      expect(result.chunks.length).toBeGreaterThan(1);
      expect(result.totalChunks).toBe(result.chunks.length);
      expect(result.totalTokens).toBeGreaterThan(500);
    });

    it('should handle empty content', () => {
      const result = DocumentChunker.chunk('', {
        filePath: '/test/empty.txt',
      });

      expect(result.chunks).toHaveLength(0);
      expect(result.totalChunks).toBe(0);
      expect(result.totalTokens).toBe(0);
      expect(result.averageChunkSize).toBe(0);
    });

    it('should handle whitespace-only content', () => {
      const result = DocumentChunker.chunk('   \n\n   ', {
        filePath: '/test/whitespace.txt',
      });

      expect(result.chunks).toHaveLength(0);
      expect(result.totalChunks).toBe(0);
    });

    it('should use default chunk size and overlap', () => {
      const content = 'a '.repeat(3000); // Large content (~1500 tokens)
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/defaults.txt',
      });

      expect(result.chunks.length).toBeGreaterThan(1);
      // Each chunk should be around 500 tokens (default)
      result.chunks.forEach((chunk) => {
        expect(chunk.tokens).toBeLessThanOrEqual(600); // Allow some tolerance
      });
    });

    it('should respect custom chunk size', () => {
      const content = 'a '.repeat(500); // ~250 tokens
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/custom.txt',
        chunkSize: 100,
      });

      expect(result.chunks.length).toBeGreaterThan(1);
      // Each chunk should be around 100 tokens
      result.chunks.forEach((chunk) => {
        expect(chunk.tokens).toBeLessThanOrEqual(150);
      });
    });
  });

  describe('chunk - metadata tracking', () => {
    it('should include startLine and endLine in metadata', () => {
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/lines.txt',
        chunkSize: 10, // Small chunks
      });

      result.chunks.forEach((chunk) => {
        expect(chunk.metadata.startLine).toBeGreaterThan(0);
        expect(chunk.metadata.endLine).toBeGreaterThanOrEqual(chunk.metadata.startLine);
      });
    });

    it('should include filePath in metadata', () => {
      const content = 'Test content';
      const filePath = '/test/path/to/file.txt';
      const result = DocumentChunker.chunk(content, { filePath });

      expect(result.chunks[0]?.metadata.filePath).toBe(filePath);
    });

    it('should include chunkIndex in metadata', () => {
      const content = 'a '.repeat(1000); // Multiple chunks
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/indexed.txt',
        chunkSize: 200,
      });

      result.chunks.forEach((chunk, index) => {
        expect(chunk.metadata.chunkIndex).toBe(index);
      });
    });

    it('should include timestamp in metadata', () => {
      const content = 'Test content';
      const beforeChunk = Date.now();
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/timestamp.txt',
      });
      const afterChunk = Date.now();

      expect(result.chunks[0]?.metadata.timestamp).toBeGreaterThanOrEqual(beforeChunk);
      expect(result.chunks[0]?.metadata.timestamp).toBeLessThanOrEqual(afterChunk);
    });

    it('should include totalChunks in each chunk metadata', () => {
      const content = 'a '.repeat(1000);
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/total.txt',
        chunkSize: 200,
      });

      const totalChunks = result.chunks.length;
      result.chunks.forEach((chunk) => {
        expect(chunk.metadata.totalChunks).toBe(totalChunks);
      });
    });
  });

  describe('chunk - overlap handling', () => {
    it('should create overlap between chunks', () => {
      const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);
      const content = lines.join('\n');

      const result = DocumentChunker.chunk(content, {
        filePath: '/test/overlap.txt',
        chunkSize: 50,
        overlap: 10,
      });

      if (result.chunks.length > 1) {
        // Check that consecutive chunks have some overlap
        for (let i = 1; i < result.chunks.length; i++) {
          const prevChunk = result.chunks[i - 1];
          const currentChunk = result.chunks[i];

          // End line of previous chunk should be >= start line of current chunk
          expect(prevChunk!.metadata.endLine).toBeGreaterThanOrEqual(
            currentChunk!.metadata.startLine
          );
        }
      }
    });

    it('should handle zero overlap', () => {
      const content = 'a '.repeat(1000);
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/no-overlap.txt',
        chunkSize: 200,
        overlap: 0,
      });

      expect(result.chunks.length).toBeGreaterThan(1);
    });

    it('should handle overlap larger than chunk size gracefully', () => {
      const content = 'a '.repeat(1000);
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/large-overlap.txt',
        chunkSize: 200,
        overlap: 300, // Larger than chunk size
      });

      expect(result.chunks.length).toBeGreaterThan(0);
    });
  });

  describe('chunk - line preservation', () => {
    it('should preserve line boundaries by default', () => {
      const lines = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}: Some content here`);
      const content = lines.join('\n');

      const result = DocumentChunker.chunk(content, {
        filePath: '/test/lines.txt',
        chunkSize: 100,
      });

      // Each chunk should contain complete lines (end with newline or be last chunk)
      result.chunks.forEach((chunk, index) => {
        if (index < result.chunks.length - 1) {
          // Not last chunk - should contain newlines
          expect(chunk.text).toMatch(/\n/);
        }
      });
    });

    it('should handle single-line documents', () => {
      const content = 'This is a single line document without any newlines';
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/single-line.txt',
      });

      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0]?.text).toBe(content);
    });

    it('should handle documents with many newlines', () => {
      const content = '\n'.repeat(100);
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/newlines.txt',
        chunkSize: 50,
      });

      // Whitespace-only (even newlines) should return 0 chunks
      expect(result.chunks).toHaveLength(0);
      expect(result.totalChunks).toBe(0);
    });

    it('should handle mixed line lengths', () => {
      const shortLine = 'Short.';
      const longLine = 'This is a much longer line with more content. '.repeat(10);
      const content = [shortLine, longLine, shortLine, longLine, shortLine].join('\n');

      const result = DocumentChunker.chunk(content, {
        filePath: '/test/mixed.txt',
        chunkSize: 100,
      });

      expect(result.chunks.length).toBeGreaterThan(0);
    });
  });

  describe('chunk - content type handling', () => {
    it('should auto-detect content type', () => {
      const code = 'function test() { return 42; }\nconst x = 10;';
      const result = DocumentChunker.chunk(code, {
        filePath: '/test/code.ts',
      });

      expect(result.chunks.length).toBeGreaterThan(0);
    });

    it('should respect provided content type', () => {
      const content = 'Some text content';
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/prose.txt',
        contentType: 'prose',
      });

      expect(result.chunks.length).toBeGreaterThan(0);
    });

    it('should handle code content', () => {
      const code = Array.from({ length: 100 }, (_, i) => `const x${i} = ${i};`).join('\n');

      const result = DocumentChunker.chunk(code, {
        filePath: '/test/code.js',
        contentType: 'code',
        chunkSize: 200,
      });

      expect(result.chunks.length).toBeGreaterThan(1);
    });

    it('should handle mixed content', () => {
      const mixed = `
        # Documentation
        This is prose content explaining the code.

        \`\`\`javascript
        function example() {
          return "code";
        }
        \`\`\`

        More prose explaining things.
      `.repeat(10);

      const result = DocumentChunker.chunk(mixed, {
        filePath: '/test/mixed.md',
        contentType: 'mixed',
        chunkSize: 200,
      });

      expect(result.chunks.length).toBeGreaterThan(1);
    });
  });

  describe('chunk - large documents', () => {
    it('should handle documents with 10,000+ lines', () => {
      const lines = Array.from({ length: 10000 }, (_, i) => `Line ${i + 1}`);
      const content = lines.join('\n');

      const startTime = performance.now();
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/large.txt',
        chunkSize: 500,
      });
      const duration = performance.now() - startTime;

      expect(result.chunks.length).toBeGreaterThan(1);
      expect(duration).toBeLessThan(500); // <500ms requirement
    });

    it('should handle very large single line', () => {
      const content = 'a'.repeat(100000);

      const result = DocumentChunker.chunk(content, {
        filePath: '/test/long-line.txt',
        chunkSize: 500,
      });

      expect(result.chunks.length).toBeGreaterThan(1);
    });
  });

  describe('chunk - statistics', () => {
    it('should calculate total tokens correctly', () => {
      const content = 'a '.repeat(1000);
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/stats.txt',
        chunkSize: 200,
      });

      // Verify chunks were created
      expect(result.chunks.length).toBeGreaterThan(0);

      // Total tokens should be greater than 0
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should calculate average chunk size correctly', () => {
      const content = 'a '.repeat(1000);
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/average.txt',
        chunkSize: 200,
      });

      const expectedAverage = Math.round(result.totalTokens / result.totalChunks);

      expect(result.averageChunkSize).toBe(expectedAverage);
    });

    it('should report correct total chunks count', () => {
      const content = 'a '.repeat(1000);
      const result = DocumentChunker.chunk(content, {
        filePath: '/test/count.txt',
        chunkSize: 200,
      });

      expect(result.totalChunks).toBe(result.chunks.length);
    });
  });

  describe('chunkBatch', () => {
    it('should chunk multiple documents', () => {
      const documents = [
        { content: 'Document 1 content', filePath: '/test/doc1.txt' },
        { content: 'Document 2 content', filePath: '/test/doc2.txt' },
        { content: 'Document 3 content', filePath: '/test/doc3.txt' },
      ];

      const results = DocumentChunker.chunkBatch(documents);

      expect(results).toHaveLength(3);
      expect(results[0]?.chunks[0]?.metadata.filePath).toBe('/test/doc1.txt');
      expect(results[1]?.chunks[0]?.metadata.filePath).toBe('/test/doc2.txt');
      expect(results[2]?.chunks[0]?.metadata.filePath).toBe('/test/doc3.txt');
    });

    it('should handle empty batch', () => {
      const results = DocumentChunker.chunkBatch([]);

      expect(results).toHaveLength(0);
    });

    it('should handle batch with large documents', () => {
      const documents = Array.from({ length: 10 }, (_, i) => ({
        content: 'a '.repeat(3000), // ~1500 tokens each
        filePath: `/test/doc${i}.txt`,
      }));

      const results = DocumentChunker.chunkBatch(documents);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.chunks.length).toBeGreaterThan(1);
      });
    });
  });

  describe('performance', () => {
    it('should chunk document in <500ms', () => {
      const content = 'Line of content. '.repeat(1000);

      const startTime = performance.now();
      DocumentChunker.chunk(content, {
        filePath: '/test/performance.txt',
      });
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should handle large batch efficiently', () => {
      const documents = Array.from({ length: 100 }, (_, i) => ({
        content: `Document ${i} content. `.repeat(50),
        filePath: `/test/batch${i}.txt`,
      }));

      const startTime = performance.now();
      DocumentChunker.chunkBatch(documents);
      const duration = performance.now() - startTime;

      // Should process 100 documents reasonably fast
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 docs
    });
  });

  describe('edge cases', () => {
    it('should handle null content gracefully', () => {
      const result = DocumentChunker.chunk(null as unknown as string, {
        filePath: '/test/null.txt',
      });

      expect(result.chunks).toHaveLength(0);
    });

    it('should handle undefined content gracefully', () => {
      const result = DocumentChunker.chunk(undefined as unknown as string, {
        filePath: '/test/undefined.txt',
      });

      expect(result.chunks).toHaveLength(0);
    });

    it('should handle special characters', () => {
      const content = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`\n'.repeat(100);

      const result = DocumentChunker.chunk(content, {
        filePath: '/test/special.txt',
        chunkSize: 100,
      });

      expect(result.chunks.length).toBeGreaterThan(0);
    });

    it('should handle unicode content', () => {
      const content = '你好世界 🌍 مرحبا بالعالم\n'.repeat(100);

      const result = DocumentChunker.chunk(content, {
        filePath: '/test/unicode.txt',
        chunkSize: 100,
      });

      expect(result.chunks.length).toBeGreaterThan(0);
    });

    it('should handle Windows line endings (CRLF)', () => {
      const content = 'Line 1\r\nLine 2\r\nLine 3\r\n';

      const result = DocumentChunker.chunk(content, {
        filePath: '/test/crlf.txt',
      });

      expect(result.chunks.length).toBeGreaterThan(0);
    });
  });
});
