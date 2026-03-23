import type { SummarizeOptions, ProviderConfig } from '@/types';
import { BaseAIProvider } from './base';

export class QwenProvider extends BaseAIProvider {
  name = '通义千问';
  private apiKey: string;
  private model: string;
  private endpoint: string;

  constructor(config: ProviderConfig) {
    super();
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'qwen-turbo';
    this.endpoint = config.endpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  }

  async summarize(content: string, options?: SummarizeOptions, signal?: AbortSignal): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: this.buildPrompt(content, options?.title, options?.url, options?.displayFormat, options?.customPrompt) }],
        temperature: 0.3,
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
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('API 返回数据格式异常：缺少 choices 字段');
    }

    const result = data.choices[0]?.message?.content;
    if (result === undefined || result === null) {
      throw new Error('API 返回数据格式异常：缺少 content 字段');
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
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: this.buildPrompt(content, options?.title, options?.url, options?.displayFormat, options?.customPrompt) }],
        temperature: 0.3,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`通义千问 API error: ${response.status} - ${err}`);
    }

    // Qwen uses OpenAI-compatible format
    await this.parseSSEStream(response, onChunk, (parsed) => {
      const delta = (parsed as { choices?: { delta?: { content?: string } }[] })
        .choices?.[0]?.delta?.content;
      return delta || null;
    }, signal);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
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
