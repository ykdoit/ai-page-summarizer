// Floating widget - injected into the page
import { MessageType } from '@/types';
import type { Message, PageContent, AppSettings } from '@/types';
import { extractPageContent } from '@/services/content-extractor';
import { storageService } from '@/services/storage-service';
import { ttsService } from '@/services/tts-service';

let container: HTMLDivElement | null = null;
let isPanelOpen = false;
let settings: AppSettings | null = null;

// 安全的类型校验函数
function isValidSettings(obj: unknown): obj is AppSettings {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.aiProvider === 'string' &&
    typeof s.displayFormat === 'string' &&
    typeof s.uiMode === 'string' &&
    typeof s.theme === 'string' &&
    typeof s.providerConfigs === 'object'
  );
}

// Create and inject the floating widget
export function initFloatingWidget() {
  if (container) return;

  // Load settings
  loadSettings();

  // Create container
  container = document.createElement('div');
  container.id = 'ai-summarizer-widget';
  container.innerHTML = getWidgetHTML();
  document.body.appendChild(container);

  // Bind events
  bindEvents();
}

export function destroyFloatingWidget() {
  if (container) {
    container.remove();
    container = null;
  }
}

export function toggleFloatingWidget() {
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  } else {
    initFloatingWidget();
  }
}

async function loadSettings() {
  // Request settings from background
  try {
    const response = await chrome.runtime.sendMessage({ type: MessageType.GET_SETTINGS });
    if (response && isValidSettings(response)) {
      settings = response;
    }
  } catch {
    // Ignore
  }
}

function getWidgetHTML(): string {
  return `
    <style>
      #ai-summarizer-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #ai-summarizer-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #ai-summarizer-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
      }
      #ai-summarizer-btn svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      #ai-summarizer-panel {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 360px;
        max-height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      #ai-summarizer-panel.open {
        display: flex;
      }
      .as-header {
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .as-title {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
      .as-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        padding: 4px;
      }
      .as-content {
        padding: 16px;
        overflow-y: auto;
        flex: 1;
      }
      .as-page-info {
        background: #f9fafb;
        padding: 8px 12px;
        border-radius: 6px;
        margin-bottom: 12px;
        font-size: 12px;
      }
      .as-page-title {
        font-weight: 500;
        color: #374151;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .as-page-url {
        color: #9ca3af;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-top: 2px;
      }
      .as-btn {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }
      .as-btn-primary {
        background: #4f46e5;
        color: white;
      }
      .as-btn-primary:hover {
        background: #4338ca;
      }
      .as-btn-primary:disabled {
        background: #a5b4fc;
        cursor: not-allowed;
      }
      .as-error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        margin-bottom: 12px;
      }
      .as-summary {
        background: #f9fafb;
        padding: 12px;
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.6;
        color: #374151;
        max-height: 200px;
        overflow-y: auto;
      }
      .as-tts {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .as-tts-btn {
        flex: 1;
        padding: 8px;
        border-radius: 6px;
        border: none;
        font-size: 12px;
        cursor: pointer;
      }
      .as-tts-play {
        background: #22c55e;
        color: white;
      }
      .as-tts-pause {
        background: #eab308;
        color: white;
      }
      .as-tts-stop {
        background: #ef4444;
        color: white;
      }
      .as-spinner {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>

    <button id="ai-summarizer-btn" title="AI 总结助手">
      <svg viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    </button>

    <div id="ai-summarizer-panel">
      <div class="as-header">
        <span class="as-title">AI 总结助手</span>
        <button class="as-close" id="as-close-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="as-content">
        <div class="as-page-info" id="as-page-info">
          <div class="as-page-title" id="as-title"></div>
          <div class="as-page-url" id="as-url"></div>
        </div>
        <div class="as-error" id="as-error" style="display:none"></div>
        <button class="as-btn as-btn-primary" id="as-summarize-btn">开始总结</button>
        <div class="as-summary" id="as-summary" style="display:none"></div>
        <div class="as-tts" id="as-tts" style="display:none"></div>
      </div>
    </div>
  `;
}

function bindEvents() {
  if (!container) return;

  const btn = container.querySelector('#ai-summarizer-btn');
  const panel = container.querySelector('#ai-summarizer-panel');
  const closeBtn = container.querySelector('#as-close-btn');
  const summarizeBtn = container.querySelector('#as-summarize-btn');

  btn?.addEventListener('click', () => {
    isPanelOpen = !isPanelOpen;
    panel?.classList.toggle('open', isPanelOpen);
    if (isPanelOpen) {
      updatePageInfo();
    }
  });

  closeBtn?.addEventListener('click', () => {
    isPanelOpen = false;
    panel?.classList.remove('open');
  });

  summarizeBtn?.addEventListener('click', handleSummarize);

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message: Message) => {
    if (message.type === MessageType.SUMMARY_CHUNK) {
      appendSummary((message.payload as { chunk: string }).chunk);
    } else if (message.type === MessageType.SUMMARY_COMPLETE) {
      setLoading(false);
    } else if (message.type === MessageType.SUMMARY_ERROR) {
      showError((message.payload as { error: string }).error);
      setLoading(false);
    }
  });
}

function updatePageInfo() {
  const content = extractPageContent();
  const titleEl = container?.querySelector('#as-title');
  const urlEl = container?.querySelector('#as-url');
  if (titleEl) titleEl.textContent = content.title;
  if (urlEl) urlEl.textContent = content.url;
}

async function handleSummarize() {
  const content = extractPageContent();
  const summaryEl = container?.querySelector('#as-summary');
  const errorEl = container?.querySelector('#as-error');

  if (summaryEl) {
    summaryEl.textContent = '';
    summaryEl.setAttribute('style', 'display:block');
  }
  if (errorEl) errorEl.setAttribute('style', 'display:none');

  setLoading(true);

  try {
    await chrome.runtime.sendMessage({
      type: MessageType.SUMMARIZE,
      payload: content,
    });
  } catch (err) {
    showError(`总结请求失败: ${err}`);
    setLoading(false);
  }
}

function appendSummary(chunk: string) {
  const summaryEl = container?.querySelector('#as-summary');
  if (summaryEl) {
    summaryEl.textContent += chunk;
  }
}

function showError(message: string) {
  const errorEl = container?.querySelector('#as-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.setAttribute('style', 'display:block');
  }
}

function setLoading(loading: boolean) {
  const btn = container?.querySelector('#as-summarize-btn') as HTMLButtonElement;
  if (btn) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? '<svg class="as-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke-opacity="0.75"/></svg> 总结中...'
      : '开始总结';
  }
}
