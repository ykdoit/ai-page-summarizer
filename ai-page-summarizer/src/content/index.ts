import { MessageType } from '@/types';
import type { Message, AppSettings } from '@/types';
import { extractPageContent } from '@/services/content-extractor';
import { initFloatingWidget, destroyFloatingWidget, toggleFloatingWidget } from './floating-widget';

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

// Initialize on load
async function init() {
  try {
    const response = await chrome.runtime.sendMessage({ type: MessageType.GET_SETTINGS });
    if (response && isValidSettings(response)) {
      settings = response;
      if (settings.uiMode === 'floating') {
        initFloatingWidget();
      }
    }
  } catch {
    // Extension context might not be ready
  }
}

// Listen for settings updates
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    switch (message.type) {
      case MessageType.EXTRACT_CONTENT:
        try {
          const content = extractPageContent();
          sendResponse(content);
        } catch (err) {
          sendResponse({ error: String(err) });
        }
        return false;

      case MessageType.SETTINGS_UPDATED:
        if (message.payload && isValidSettings(message.payload)) {
          settings = message.payload;
          if (settings.uiMode === 'floating') {
            initFloatingWidget();
          } else {
            destroyFloatingWidget();
          }
        }
        return false;

      case MessageType.TOGGLE_FLOATING:
        toggleFloatingWidget();
        sendResponse({ ok: true });
        return false;

      default:
        return false;
    }
  },
);

// Start initialization
init();
