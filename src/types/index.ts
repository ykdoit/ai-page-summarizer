// ============ AI Provider Types ============

export type AIProviderType = 'openai' | 'claude' | 'qwen' | 'custom';

// 展现形式类型（总结输出格式）
export type DisplayFormat = 'standard' | 'compact' | 'cards' | 'outline';

// UI 展现模式
export type UIMode = 'sidepanel' | 'popup' | 'floating';

// 主题类型
export type Theme = 'light' | 'dark';

export interface ProviderConfig {
  endpoint?: string;  // 自定义 API 地址
  apiKey?: string;
  model?: string;     // 模型名称
}

export interface SummarizeOptions {
  language?: string;
  maxLength?: number;
  displayFormat?: DisplayFormat;
  customPrompt?: string;
  title?: string;
  url?: string;
}

export interface AIProvider {
  name: string;
  summarize(content: string, options?: SummarizeOptions, signal?: AbortSignal): Promise<string>;
  streamSummarize(
    content: string,
    onChunk: (chunk: string) => void,
    options?: SummarizeOptions,
    signal?: AbortSignal,
  ): Promise<void>;
  testConnection?(): Promise<{ success: boolean; message: string }>;
}

// ============ Storage Types ============

export interface AppSettings {
  aiProvider: AIProviderType;
  providerConfigs: {
    openai: ProviderConfig;
    claude: ProviderConfig;
    qwen: ProviderConfig;
    custom: ProviderConfig;  // 完全自定义配置
  };
  displayFormat: DisplayFormat;  // 总结输出格式
  uiMode: UIMode;  // UI 展现模式
  theme: Theme;  // 主题
  customPrompt?: string;  // 用户自定义提示词（可选）
  ttsConfig: {
    rate: number;
    pitch: number;
    voiceURI: string;
  };
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  summary: string;
  createdAt: number;
}

export interface StorageSchema {
  settings: AppSettings;
  history: HistoryItem[];
}

// ============ Page Content Types ============

export interface PageContent {
  title: string;
  url: string;
  content: string;
  excerpt?: string;
}

// ============ Message Types ============

export enum MessageType {
  // Content Script -> Background
  GET_PAGE_CONTENT = 'GET_PAGE_CONTENT',
  EXTRACT_CONTENT = 'EXTRACT_CONTENT',

  // Side Panel / Popup / Floating -> Background
  SUMMARIZE = 'SUMMARIZE',
  STOP_SUMMARIZE = 'STOP_SUMMARIZE',
  GET_SETTINGS = 'GET_SETTINGS',
  SAVE_SETTINGS = 'SAVE_SETTINGS',

  // Background -> UI
  SUMMARY_CHUNK = 'SUMMARY_CHUNK',
  SUMMARY_COMPLETE = 'SUMMARY_COMPLETE',
  SUMMARY_ERROR = 'SUMMARY_ERROR',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',

  // Floating widget
  TOGGLE_FLOATING = 'TOGGLE_FLOATING',

  // General
  ERROR = 'ERROR',
}

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
  tabId?: number;
}

// ============ TTS Types ============

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  voiceURI?: string;
}

export type TTSState = 'idle' | 'speaking' | 'paused';
