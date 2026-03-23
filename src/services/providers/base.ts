import type { AIProvider, SummarizeOptions, DisplayFormat } from '@/types';

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;

  protected buildPrompt(
    content: string,
    title?: string,
    url?: string,
    format: DisplayFormat = 'standard',
    customPrompt?: string,
  ): string {
    // 如果用户配置了自定义提示词，使用用户的提示词
    if (customPrompt && customPrompt.trim()) {
      return this.buildCustomPrompt(content, title, url, customPrompt);
    }

    // 否则使用默认的通用提示词
    const formatInstructions = this.getFormatInstructions(format);

    return `你是一个专业的内容总结助手。请对以下网页内容进行总结：

【网页标题】：${title || '未知'}
【网页URL】：${url || '未知'}
【网页内容】：
${content}

${formatInstructions}`;
  }

  /**
   * 构建用户自定义提示词
   * 支持变量替换：{content}, {title}, {url}
   */
  private buildCustomPrompt(
    content: string,
    title?: string,
    url?: string,
    customPrompt?: string,
  ): string {
    if (!customPrompt) return '';

    return customPrompt
      .replace(/{content}/gi, content)
      .replace(/{title}/gi, title || '未知')
      .replace(/{url}/gi, url || '未知');
  }

  private getFormatInstructions(format: DisplayFormat): string {
    switch (format) {
      case 'standard':
        return `请按以下格式输出总结：
## 核心主题
（一句话概括）

## 关键要点
1. ...
2. ...
3. ...

## 结论
（总结性陈述）`;

      case 'compact':
        return `请用简洁的格式输出总结（不要使用 Markdown 标题）：

【主题】一句话概括核心主题

【要点】
• 要点1
• 要点2
• 要点3

【结论】总结性陈述`;

      case 'cards':
        return `请按卡片格式输出总结，每个要点单独成段：

主题：一句话概括核心主题

---
**要点 1**
描述第一个关键要点

---
**要点 2**
描述第二个关键要点

---
**要点 3**
描述第三个关键要点

---
结论：总结性陈述`;

      case 'outline':
        return `请按大纲格式输出总结：

# 核心主题
（一句话概括）

## 一、主要观点
1. 观点1
2. 观点2

## 二、支撑论据
1. 论据1
2. 论据2

## 三、结论
总结性陈述`;

      default:
        return this.getFormatInstructions('standard');
    }
  }

  abstract summarize(content: string, options?: SummarizeOptions, signal?: AbortSignal): Promise<string>;
  abstract streamSummarize(
    content: string,
    onChunk: (chunk: string) => void,
    options?: SummarizeOptions,
    signal?: AbortSignal,
  ): Promise<void>;

  protected async parseSSEStream(
    response: Response,
    onChunk: (chunk: string) => void,
    extractContent: (parsed: Record<string, unknown>) => string | null,
    signal?: AbortSignal,
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        // 检查是否已取消
        if (signal?.aborted) {
          reader.cancel();
          throw new DOMException('Aborted', 'AbortError');
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = extractContent(parsed);
            if (content) onChunk(content);
          } catch {
            // skip non-JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
