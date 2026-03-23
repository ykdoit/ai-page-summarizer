import { ref, onMounted, onUnmounted } from 'vue';
import type { AppSettings, AIProviderType, ProviderConfig, DisplayFormat, UIMode, Theme } from '@/types';
import { storageService } from '@/services/storage-service';

export function useSettings() {
  const settings = ref<AppSettings>({
    aiProvider: 'openai',
    providerConfigs: {
      openai: { endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
      claude: { endpoint: 'https://api.anthropic.com/v1/messages', model: 'claude-3-haiku-20240307' },
      qwen: { endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-turbo' },
      custom: { endpoint: '', model: '' },
    },
    displayFormat: 'standard',
    uiMode: 'sidepanel',
    theme: 'light',
    customPrompt: '',
    ttsConfig: { rate: 1.0, pitch: 1.0, voiceURI: '' },
  });
  const isLoaded = ref(false);

  function onStorageChanged(changes: { [key: string]: chrome.storage.StorageChange }) {
    if (changes.settings?.newValue) {
      settings.value = changes.settings.newValue as AppSettings;
    }
  }

  onMounted(async () => {
    settings.value = await storageService.getSettings();
    isLoaded.value = true;
    chrome.storage.local.onChanged.addListener(onStorageChanged);
  });

  onUnmounted(() => {
    chrome.storage.local.onChanged.removeListener(onStorageChanged);
  });

  async function saveSettings(): Promise<void> {
    await storageService.saveSettings(settings.value);
  }

  async function setProvider(provider: AIProviderType): Promise<void> {
    settings.value.aiProvider = provider;
    await saveSettings();
  }

  async function updateProviderConfig(provider: AIProviderType, config: Partial<ProviderConfig>): Promise<void> {
    settings.value.providerConfigs[provider] = {
      ...settings.value.providerConfigs[provider],
      ...config,
    };
    await storageService.saveProviderConfig(provider, settings.value.providerConfigs[provider]);
  }

  async function clearProviderConfig(provider: AIProviderType): Promise<void> {
    await storageService.clearProviderConfig(provider);
    settings.value = await storageService.getSettings();
  }

  async function setDisplayFormat(format: DisplayFormat): Promise<void> {
    settings.value.displayFormat = format;
    await saveSettings();
  }

  async function setUIMode(mode: UIMode): Promise<void> {
    settings.value.uiMode = mode;
    await saveSettings();
  }

  async function setCustomPrompt(prompt: string): Promise<void> {
    settings.value.customPrompt = prompt;
    await saveSettings();
  }

  async function setTTSRate(rate: number): Promise<void> {
    settings.value.ttsConfig.rate = rate;
    await saveSettings();
  }

  async function setTTSPitch(pitch: number): Promise<void> {
    settings.value.ttsConfig.pitch = pitch;
    await saveSettings();
  }

  async function setTTSVoice(voiceURI: string): Promise<void> {
    settings.value.ttsConfig.voiceURI = voiceURI;
    await saveSettings();
  }

  async function setTheme(theme: Theme): Promise<void> {
    settings.value.theme = theme;
    await saveSettings();
  }

  return {
    settings,
    isLoaded,
    saveSettings,
    setProvider,
    updateProviderConfig,
    clearProviderConfig,
    setDisplayFormat,
    setUIMode,
    setTheme,
    setCustomPrompt,
    setTTSRate,
    setTTSPitch,
    setTTSVoice,
  };
}
