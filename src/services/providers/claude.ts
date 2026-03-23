import type { SummarizeOptions, ProviderConfig } from '@/types';
import { BaseAIProvider } from './base';

export class ClaudeProvider extends BaseAIProvider {
  name = 'Claude';
  private apiKey: string;
  private model: string;
  private endpoint: string;

  constructor(config: ProviderConfig) {
    super();
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'claude-3-haiku-20240307';
    this.endpoint = config.endpoint || 'https://api.anthropic.com/v1/messages';
  }

  async summarize(content: string, options?: SummarizeOptions, signal?: AbortSignal): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: this.buildPrompt(content, options?.title, options?.url, options?.displayFormat, options?.customPrompt) }],
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      let errorMessage = `API 请求失败 (${response.status})`;
      try {
        const errorJson = JSON.parse(err);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Use raw error text
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // 验证响应结构
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      throw new Error('API 返回数据格式异常：缺少 content 字段');
    }

    const result = data.content[0]?.text;
    if (result === undefined || result === null) {
      throw new Error('API 返回数据格式异常：缺少 text 字段');
    }

    return result;
  }

  async streamSummarize(
    content: string,
    onChunk: (chunk: string) => void,
    options?: SummarizeOptions,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: this.buildPrompt(content, options?.title, options?.url, options?.displayFormat, options?.customPrompt) }],
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${err}`);
    }

    await this.parseSSEStream(response, onChunk, (parsed) => {
      const event = parsed as { type?: string; delta?: { text?: string } };
      if (event.type === 'content_block_delta') {
        return event.delta?.text || null;
      }
      return null;
    }, signal);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (response.ok) {
        return { success: true, message: '连接成功！API 配置正确' };
      }

      const errorText = await response.text();
      let errorMessage = `连接失败: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Use raw error text if not JSON
      }

      return { success: false, message: errorMessage };
    } catch (error) {
      return { success: false, message: `网络错误: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }
}
