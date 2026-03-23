import type { PageContent } from '@/types';
import { Readability } from '@mozilla/readability';

/**
 * 需要排除的元素选择器（导航、广告、侧栏等）
 */
const EXCLUDE_SELECTORS = [
  'nav', 'header', 'footer', 'aside',
  '.nav', '.navigation', '.menu', '.sidebar', '.side-bar',
  '.advertisement', '.ad-', '.ads', '.banner', '.popup',
  '.social-share', '.related-posts', '.comments', '.comment',
  '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
  '.cookie-notice', '.newsletter', '.subscription',
];

/**
 * 清理文本，移除多余空白
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * 移除不需要的元素
 */
function removeUnwantedElements(doc: Document): void {
  for (const selector of EXCLUDE_SELECTORS) {
    try {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    } catch {
      // Ignore selector errors
    }
  }
}

/**
 * Extract main content from the current page using Readability with fallbacks.
 */
export function extractPageContent(): PageContent {
  const title = document.title;
  const url = location.href;

  // Strategy 1: Readability
  try {
    const clone = document.cloneNode(true) as Document;
    removeUnwantedElements(clone);
    const reader = new Readability(clone, {
      charThreshold: 100,
      debug: false,
    });
    const article = reader.parse();
    if (article && article.textContent && article.textContent.trim().length > 100) {
      return {
        title: article.title || title,
        url,
        content: cleanText(article.textContent),
        excerpt: article.excerpt || undefined,
      };
    }
  } catch {
    // fall through to next strategy
  }

  // Strategy 2: Semantic elements (优先级从高到低)
  const semanticSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.post-content', '.article-content', '.entry-content',
    '.content', '.post', '.article',
    '#content', '#main', '#article',
  ];

  for (const selector of semanticSelectors) {
    try {
      const el = document.querySelector(selector);
      if (el) {
        // 克隆元素并移除不需要的子元素
        const clone = el.cloneNode(true) as HTMLElement;
        for (const excludeSelector of EXCLUDE_SELECTORS) {
          clone.querySelectorAll(excludeSelector).forEach(child => child.remove());
        }
        const text = clone.textContent?.trim();
        if (text && text.length > 100) {
          return {
            title,
            url,
            content: cleanText(text),
          };
        }
      }
    } catch {
      // Continue to next selector
    }
  }

  // Strategy 3: 智能提取（查找最大的文本块）
  const body = document.body;
  if (body) {
    // 移除不需要的元素后再提取
    const clone = body.cloneNode(true) as HTMLElement;
    for (const selector of EXCLUDE_SELECTORS) {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    }

    // 查找包含最多文本的容器
    const containers = clone.querySelectorAll('div, section, article');
    let maxText = '';
    let maxLen = 0;

    containers.forEach(container => {
      const text = container.textContent?.trim() || '';
      if (text.length > maxLen) {
        maxLen = text.length;
        maxText = text;
      }
    });

    if (maxText.length > 100) {
      return {
        title,
        url,
        content: cleanText(maxText.substring(0, 50000)),
      };
    }

    // 最后的降级方案
    const text = clone.textContent?.trim() || '';
    if (text.length > 0) {
      return {
        title,
        url,
        content: cleanText(text.substring(0, 50000)),
      };
    }
  }

  // 完全无法提取内容
  return {
    title,
    url,
    content: '',
  };
}
