<template>
  <div class="space-y-4 text-sm">
    <div class="flex items-center justify-between mb-2">
      <h3 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="font-semibold">设置</h3>
      <button @click="$emit('close')" :class="isDark ? 'text-[#9aa0a6] hover:text-[#e8eaed]' : 'text-gray-400 hover:text-gray-600'">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- AI Provider -->
    <div>
      <label :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'" class="block text-xs mb-1">AI 服务商</label>
      <select
        v-model="currentProvider"
        @change="handleProviderChange"
        class="w-full px-2 py-1.5 border rounded text-sm focus:outline-none"
        :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed]' : 'bg-white border-gray-300 text-gray-700'"
      >
        <option value="openai">OpenAI</option>
        <option value="claude">Claude</option>
        <option value="qwen">通义千问</option>
        <option value="custom">自定义</option>
      </select>
    </div>

    <!-- API Key -->
    <div>
      <label :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'" class="block text-xs mb-1">API Key</label>
      <input
        type="password"
        v-model="apiKey"
        placeholder="输入 API Key"
        class="w-full px-2 py-1.5 border rounded text-sm focus:outline-none"
        :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed] placeholder-[#5f6368]' : 'bg-white border-gray-300 text-gray-700'"
      />
    </div>

    <!-- Model -->
    <div>
      <label :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'" class="block text-xs mb-1">模型</label>
      <input
        type="text"
        v-model="model"
        placeholder="模型名称"
        class="w-full px-2 py-1.5 border rounded text-sm focus:outline-none"
        :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed] placeholder-[#5f6368]' : 'bg-white border-gray-300 text-gray-700'"
      />
    </div>

    <!-- UI Mode -->
    <div>
      <label :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'" class="block text-xs mb-1">界面模式</label>
      <select
        v-model="uiMode"
        @change="handleUIModeChange"
        class="w-full px-2 py-1.5 border rounded text-sm focus:outline-none"
        :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed]' : 'bg-white border-gray-300 text-gray-700'"
      >
        <option value="sidepanel">侧边栏</option>
        <option value="popup">弹窗</option>
        <option value="floating">悬浮窗</option>
      </select>
    </div>

    <!-- Save -->
    <button
      @click="handleSave"
      class="w-full py-1.5 text-white rounded text-sm transition-colors"
      :class="isDark ? 'bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#1e1e1e]' : 'bg-indigo-600 hover:bg-indigo-700'"
    >
      保存
    </button>

    <p v-if="message" :class="isDark ? 'text-[#81c995]' : 'text-green-600'" class="text-xs text-center">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { AIProviderType, UIMode } from '@/types';
import { storageService } from '@/services/storage-service';

const props = defineProps<{
  isDark?: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const currentProvider = ref<AIProviderType>('openai');
const apiKey = ref('');
const model = ref('');
const uiMode = ref<UIMode>('sidepanel');
const message = ref('');

onMounted(async () => {
  const settings = await storageService.getSettings();
  currentProvider.value = settings.aiProvider;
  uiMode.value = settings.uiMode;
  const config = settings.providerConfigs[currentProvider.value];
  apiKey.value = config?.apiKey || '';
  model.value = config?.model || '';
});

async function handleProviderChange() {
  const settings = await storageService.getSettings();
  const config = settings.providerConfigs[currentProvider.value];
  apiKey.value = config?.apiKey || '';
  model.value = config?.model || '';
}

async function handleUIModeChange() {
  await storageService.saveSettings({ uiMode: uiMode.value });
}

async function handleSave() {
  await storageService.saveSettings({
    aiProvider: currentProvider.value,
    uiMode: uiMode.value,
    providerConfigs: {
      [currentProvider.value]: {
        apiKey: apiKey.value,
        model: model.value,
      },
    } as any,
  });
  message.value = '已保存';
  setTimeout(() => { message.value = ''; }, 2000);
}
</script>
