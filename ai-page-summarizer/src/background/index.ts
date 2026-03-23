import { MessageType } from '@/types';
import type { Message, PageContent, SummarizeOptions, AppSettings, UIMode } from '@/types';
import { AIService } from '@/services/ai-service';
import { storageService } from '@/services/storage-service';
import { generateId } from '@/utils/helpers';

// Track current UI mode
let currentUIMode: UIMode = 'sidepanel';

// Track if summarization is in progress (prevent duplicate requests)
let isSummarizing = false;

// AbortController for cancelling summarization
let currentAbortController: AbortController | null = null;

// Initialize
async function init() {
  const settings = await storageService.getSettings();
  currentUIMode = settings.uiMode;
  updateActionBehavior();
}

// Update action button behavior based on UI mode
function updateActionBehavior() {
  if (currentUIMode === 'floating') {
    // Floating mode: clicking icon toggles the floating widget
    chrome.action.setPopup({ popup: '' });
  } else if (currentUIMode === 'popup') {
    // Popup mode: show popup
    chrome.action.setPopup({ popup: 'popup.html' });
  } else {
    // Side panel mode (default)
    chrome.action.setPopup({ popup: '' });
  }
}

// Handle action click
chrome.action.onClicked.addListener(async (tab) => {
  if (currentUIMode === 'floating') {
    // Toggle floating widget via content script
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: MessageType.TOGGLE_FLOATING });
      } catch {
        // Content script might not be loaded, try to inject it
      }
    }
  } else if (currentUIMode === 'sidepanel') {
    // Open side panel
    if (tab?.id) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  }
});

// Allow side panel to be opened
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Handle messages
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  const msg = message as Message;

  switch (msg.type) {
    case MessageType.GET_PAGE_CONTENT:
      handleGetPageContent(msg.tabId).then(sendResponse).catch((err) => {
        sendResponse({ error: String(err) });
      });
      return true; // async

    case MessageType.SUMMARIZE:
      handleSummarize(msg.payload as PageContent).catch((err) => {
        broadcast({
          type: MessageType.SUMMARY_ERROR,
          payload: { error: String(err) },
        });
      });
      sendResponse({ ok: true });
      return false;

    case MessageType.STOP_SUMMARIZE:
      handleStopSummarize();
      sendResponse({ ok: true });
      return false;

    case MessageType.GET_SETTINGS:
      storageService.getSettings().then(sendResponse);
      return true;

    case MessageType.SAVE_SETTINGS:
      handleSaveSettings(msg.payload as Partial<AppSettings>).then(sendResponse);
      return true;

    case MessageType.TOGGLE_FLOATING:
      // Forward to active tab
      getActiveTabId().then((tabId) => {
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: MessageType.TOGGLE_FLOATING });
        }
      });
      sendResponse({ ok: true });
      return false;

    default:
      return false;
  }
});

async function handleSaveSettings(newSettings: Partial<AppSettings>): Promise<{ ok: boolean }> {
  await storageService.saveSettings(newSettings);

  // Update UI mode if changed
  if (newSettings.uiMode && newSettings.uiMode !== currentUIMode) {
    currentUIMode = newSettings.uiMode;
    updateActionBehavior();
  }

  // Broadcast settings update to content scripts
  const settings = await storageService.getSettings();
  broadcast({ type: MessageType.SETTINGS_UPDATED, payload: settings });

  return { ok: true };
}

async function handleGetPageContent(tabId?: number): Promise<PageContent> {
  const activeTabId = tabId || (await getActiveTabId());
  if (!activeTabId) throw new Error('无法获取当前标签页');

  // 检查是否是特殊页面
  const tab = await chrome.tabs.get(activeTabId);
  const url = tab.url || '';

  // 特殊页面列表
  const specialPages = [
    'chrome://',
    'chrome-extension://',
    'about:',
    'edge://',
    'brave://',
    'opera://',
    'vivaldi://',
    'chrome-search://',
    'devtools://',
  ];

  const isSpecialPage = specialPages.some(prefix => url.startsWith(prefix));

  if (isSpecialPage) {
    throw new Error('SPECIAL_PAGE');
  }

  // 检查是否是新标签页或空白页
  if (url === '' || url === 'about:blank' || url.includes('chrome://newtab')) {
    throw new Error('BLANK_PAGE');
  }

  try {
    const response = await chrome.tabs.sendMessage(activeTabId, {
      type: MessageType.EXTRACT_CONTENT,
    });

    if (response?.error) throw new Error(response.error);
    return response as PageContent;
  } catch {
    // Content Script 未加载，尝试动态注入
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ['content/index.js'],
      });

      // 等待脚本初始化
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 再次尝试获取内容
      const response = await chrome.tabs.sendMessage(activeTabId, {
        type: MessageType.EXTRACT_CONTENT,
      });

      if (response?.error) throw new Error(response.error);
      return response as PageContent;
    } catch {
      throw new Error('CONTENT_SCRIPT_NOT_LOADED');
    }
  }
}

async function handleSummarize(pageContent: PageContent, options?: SummarizeOptions): Promise<void> {
  // 防止重复请求
  if (isSummarizing) {
    broadcast({
      type: MessageType.SUMMARY_ERROR,
      payload: { error: '已有总结任务正在进行中' },
    });
    return;
  }

  const settings = await storageService.getSettings();
  const config = settings.providerConfigs[settings.aiProvider];

  if (!config?.apiKey) {
    broadcast({
      type: MessageType.SUMMARY_ERROR,
      payload: { error: '请先在设置中配置 API Key' },
    });
    return;
  }

  isSummarizing = true;
  // 创建新的 AbortController
  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  const aiService = new AIService(settings.aiProvider, config);
  const summarizeOptions: SummarizeOptions = {
    ...options,
    displayFormat: settings.displayFormat,
    customPrompt: settings.customPrompt,
    title: pageContent.title,
    url: pageContent.url,
  };

  let fullSummary = '';

  try {
    await aiService.streamSummarize(
      pageContent.content,
      (chunk) => {
        fullSummary += chunk;
        broadcast({
          type: MessageType.SUMMARY_CHUNK,
          payload: { chunk },
        });
      },
      summarizeOptions,
      signal,
    );

    await storageService.addHistory({
      id: generateId(),
      url: pageContent.url,
      title: pageContent.title,
      summary: fullSummary,
      createdAt: Date.now(),
    });

    broadcast({ type: MessageType.SUMMARY_COMPLETE });
  } catch (err) {
    // 如果是用户取消，不显示错误
    if (err instanceof DOMException && err.name === 'AbortError') {
      broadcast({ type: MessageType.SUMMARY_COMPLETE });
    } else {
      broadcast({
        type: MessageType.SUMMARY_ERROR,
        payload: { error: String(err) },
      });
    }
  } finally {
    isSummarizing = false;
    currentAbortController = null;
  }
}

function handleStopSummarize(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
    isSummarizing = false;
  }
}

function broadcast(message: Message): void {
  chrome.runtime.sendMessage(message).catch(() => {});
}

async function getActiveTabId(): Promise<number | undefined> {
  // 使用 lastFocusedWindow 获取用户最后聚焦的窗口（正在浏览的窗口）
  // 而不是 currentWindow（sidepanel 打开时可能是 sidepanel 的窗口）
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.id ?? undefined;
}

// Initialize on load
init();

// 开发模式热重载：监听扩展安装/更新，自动刷新已打开的标签页
if (import.meta.env.DEV) {
  chrome.runtime.onInstalled.addListener(() => {
    // 获取所有标签页并刷新
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
          chrome.tabs.reload(tab.id).catch(() => {});
        }
      });
    });
    // 重新打开 sidepanel（如果之前打开的话）
    console.log('[Dev] Extension reloaded, tabs refreshed');
  });
}
