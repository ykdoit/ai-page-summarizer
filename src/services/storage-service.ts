import type { AppSettings, HistoryItem, StorageSchema, ProviderConfig, AIProviderType } from '@/types';

const DEFAULT_PROVIDER_CONFIGS: AppSettings['providerConfigs'] = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
  },
  claude: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
  },
  qwen: {
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-turbo',
  },
  custom: {
    endpoint: '',
    model: '',
  },
};

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'openai',
  providerConfigs: DEFAULT_PROVIDER_CONFIGS,
  displayFormat: 'standard',
  uiMode: 'sidepanel',
  theme: 'light',
  customPrompt: '',
  ttsConfig: {
    rate: 1.0,
    pitch: 1.0,
    voiceURI: '',
  },
};

export class StorageService {
  private saveInProgress = false;
  private saveQueue: Array<() => void> = [];

  // 等待当前保存操作完成
  private async waitForSave(): Promise<void> {
    if (!this.saveInProgress) return;
    return new Promise((resolve) => {
      this.saveQueue.push(resolve);
    });
  }

  // 处理保存队列
  private processQueue(): void {
    const next = this.saveQueue.shift();
    if (next) next();
  }

  async getSettings(): Promise<AppSettings> {
    const result = await chrome.storage.local.get('settings');
    const stored = result.settings as AppSettings | undefined;
    if (!stored) return { ...DEFAULT_SETTINGS };

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      providerConfigs: {
        ...DEFAULT_PROVIDER_CONFIGS,
        ...stored.providerConfigs,
      },
      ttsConfig: {
        ...DEFAULT_SETTINGS.ttsConfig,
        ...stored.ttsConfig,
      },
    };
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    // 等待之前的保存操作完成
    await this.waitForSave();
    this.saveInProgress = true;

    try {
      const current = await this.getSettings();
      const merged = { ...current, ...settings };
      await chrome.storage.local.set({ settings: merged });
      // Sync theme to localStorage for flash-free loading
      if (typeof localStorage !== 'undefined' && merged.theme) {
        localStorage.setItem('theme', merged.theme);
      }
    } finally {
      this.saveInProgress = false;
      this.processQueue();
    }
  }

  async getProviderConfig(provider: AIProviderType): Promise<ProviderConfig> {
    const settings = await this.getSettings();
    return settings.providerConfigs[provider] || DEFAULT_PROVIDER_CONFIGS[provider];
  }

  async saveProviderConfig(provider: AIProviderType, config: Partial<ProviderConfig>): Promise<void> {
    // 等待之前的保存操作完成
    await this.waitForSave();
    this.saveInProgress = true;

    try {
      const settings = await this.getSettings();
      settings.providerConfigs[provider] = {
        ...settings.providerConfigs[provider],
        ...config,
      };
      await chrome.storage.local.set({ settings });
    } finally {
      this.saveInProgress = false;
      this.processQueue();
    }
  }

  async clearProviderConfig(provider: AIProviderType): Promise<void> {
    const settings = await this.getSettings();
    settings.providerConfigs[provider] = { ...DEFAULT_PROVIDER_CONFIGS[provider] };
    await chrome.storage.local.set({ settings });
  }

  async getHistory(): Promise<HistoryItem[]> {
    const result = await chrome.storage.local.get('history');
    return (result.history as StorageSchema['history']) || [];
  }

  async addHistory(item: HistoryItem): Promise<void> {
    const history = await this.getHistory();
    history.unshift(item);
    // Keep at most 100 items
    if (history.length > 100) history.length = 100;
    await chrome.storage.local.set({ history });
  }

  async clearHistory(): Promise<void> {
    await chrome.storage.local.set({ history: [] });
  }
}

export const storageService = new StorageService();
