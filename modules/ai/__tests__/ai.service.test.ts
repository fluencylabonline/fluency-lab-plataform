import { describe, it, expect, vi } from 'vitest';
import { aiService } from '../ai.service';

vi.mock('@google/generative-ai', () => {
  const mockStream = {
    stream: [
      { text: () => '{"vocabulary":' },
      { text: () => '[{"lemma":"hello","type":"noun","contextual_meaning":"greeting"}]}' }
    ]
  };

  class GoogleGenerativeAI {
    getGenerativeModel = vi.fn().mockReturnValue({
      generateContentStream: vi.fn().mockResolvedValue(mockStream)
    })
  }

  return {
    GoogleGenerativeAI,
    SchemaType: {}
  };
});

describe('AIService - Streaming', () => {
  it('should stream analysis and call onChunk callback', async () => {
    const onChunk = vi.fn();

    const result = await aiService.streamAnalysis(
      'Hello world',
      'A1',
      onChunk
    );

    // Verify onChunk was called with both parts
    expect(onChunk).toHaveBeenCalledWith('{"vocabulary":');
    expect(onChunk).toHaveBeenCalledWith('[{"lemma":"hello","type":"noun","contextual_meaning":"greeting"}]}');

    // Verify final parsed result
    expect(result.vocabulary[0].lemma).toBe('hello');
  });
});
