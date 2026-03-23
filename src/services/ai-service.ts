import type { AIProvider, AIProviderType, SummarizeOptions, ProviderConfig } from '@/types';
import { OpenAIProvider } from './providers/openai';
import { ClaudeProvider } from './providers/claude';
import { QwenProvider } from './providers/qwen';
import { CustomProvider } from './providers/custom';

export function createAIProvider(
  type: AIProviderType,
  config: ProviderConfig,
): AIProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'claude':
      return new ClaudeProvider(config);
    case 'qwen':
      return new QwenProvider(config);
    case 'custom':
      return new CustomProvider(config);
    default:
      throw new Error(`Unknown AI provider: ${type}`);
  }
}

export class AIService {
  private provider: AIProvider;

  constructor(type: AIProviderType, config: ProviderConfig) {
    this.provider = createAIProvider(type, config);
  }

  get providerName(): string {
    return this.provider.name;
  }

  async summarize(content: string, options?: SummarizeOptions, signal?: AbortSignal): Promise<string> {
    return this.provider.summarize(content, options, signal);
  }

  async streamSummarize(
    content: string,
    onChunk: (chunk: string) => void,
    options?: SummarizeOptions,
    signal?: AbortSignal,
  ): Promise<void> {
    return this.provider.streamSummarize(content, onChunk, options, signal);
  }

  switchProvider(type: AIProviderType, config: ProviderConfig): void {
    this.provider = createAIProvider(type, config);
  }
}
