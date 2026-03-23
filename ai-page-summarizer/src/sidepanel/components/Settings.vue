<template>
  <div class="space-y-4">
    <!-- AI Provider -->
    <section>
      <h3 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="text-xs font-semibold mb-2">AI 服务商</h3>
      <select
        v-model="settings.aiProvider"
        @change="handleProviderChange"
        class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
        :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed] focus:ring-[#8ab4f8]' : 'bg-white border-gray-300 text-gray-700 focus:ring-indigo-500'"
      >
        <option v-for="provider in providers" :key="provider.value" :value="provider.value">
          {{ provider.label }}
        </option>
      </select>
    </section>

    <!-- Provider Config -->
    <section v-if="isLoaded">
      <h3 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="text-xs font-semibold mb-2">{{ currentProviderLabel }} 配置</h3>

      <div class="space-y-2">
        <div>
          <label class="block text-xs mb-1" :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'">API 地址</label>
          <input
            type="url"
            v-model="currentConfig.endpoint"
            :placeholder="defaultEndpoint"
            class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed] placeholder-[#5f6368] focus:ring-[#8ab4f8]' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-indigo-500'"
          />
        </div>

        <div>
          <label class="block text-xs mb-1" :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'">模型名称</label>
          <input
            type="text"
            v-model="currentConfig.model"
            :placeholder="defaultModel"
            class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed] placeholder-[#5f6368] focus:ring-[#8ab4f8]' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-indigo-500'"
          />
        </div>

        <div>
          <label class="block text-xs mb-1" :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'">API Key</label>
          <div class="relative">
            <input
              :type="showApiKey ? 'text' : 'password'"
              v-model="currentConfig.apiKey"
              placeholder="输入 API Key"
              class="w-full px-3 py-2 pr-9 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed] placeholder-[#5f6368] focus:ring-[#8ab4f8]' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-indigo-500'"
            />
            <button
              type="button"
              @click="showApiKey = !showApiKey"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
              :class="isDark ? 'text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3d3d3d]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
              :title="showApiKey ? '隐藏' : '显示'"
            >
              <svg v-if="showApiKey" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Test Connection Button -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="handleTestConnection"
            :disabled="isTestingConnection"
            class="flex-1 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1"
            :class="isDark 
              ? 'bg-[#2d2d2d] text-[#8ab4f8] hover:bg-[#3d3d3d] disabled:opacity-50' 
              : 'bg-gray-100 text-indigo-600 hover:bg-gray-200 disabled:opacity-50'"
          >
            <svg v-if="isTestingConnection" class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07l-2.83 2.83M8.76 15.24l-2.83 2.83m12.14 0l-2.83-2.83M8.76 8.76L5.93 5.93" />
            </svg>
            <svg v-else class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
            {{ isTestingConnection ? '测试中...' : '测试连接' }}
          </button>
        </div>

        <!-- Test Result -->
        <div v-if="testResult" class="p-2 rounded-md text-xs flex items-center gap-1.5"
          :class="testResult.success 
            ? (isDark ? 'bg-[#1e3a2f] text-[#81c995]' : 'bg-green-50 text-green-700')
            : (isDark ? 'bg-[#3d1f1f] text-[#f28b82]' : 'bg-red-50 text-red-700')">
          <svg v-if="testResult.success" class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
          <svg v-else class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{{ testResult.message }}</span>
        </div>
      </div>
    </section>

    <!-- Custom Prompt -->
    <section>
      <div class="flex items-center justify-between mb-2">
        <h3 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="text-xs font-semibold">自定义提示词</h3>
        <div class="flex items-center gap-2">
          <button
            @click="resetPrompt"
            :class="isDark ? 'text-[#9aa0a6] hover:text-[#e8eaed]' : 'text-gray-400 hover:text-gray-600'"
            class="text-xs"
            title="重置为默认"
          >
            重置
          </button>
          <button
            @click="showPromptHelp = !showPromptHelp"
            :class="isDark ? 'text-[#8ab4f8] hover:text-[#aecbfa]' : 'text-indigo-500 hover:text-indigo-400'"
            class="text-xs"
          >
            {{ showPromptHelp ? '隐藏说明' : '显示说明' }}
          </button>
        </div>
      </div>

      <!-- 帮助说明 -->
      <div v-if="showPromptHelp" class="mb-2 p-2 rounded-md text-xs space-y-1.5" :class="isDark ? 'bg-[#2d2d2d] text-[#9aa0a6]' : 'bg-gray-50 text-gray-600'">
        <p>• 留空则使用默认提示词</p>
        <p>• 支持变量替换：</p>
        <div class="flex flex-wrap gap-1.5 mt-1">
          <code class="px-1.5 py-0.5 rounded text-[10px]" :class="isDark ? 'bg-[#3d3d3d] text-[#8ab4f8]' : 'bg-gray-200 text-indigo-600'">{content}</code>
          <code class="px-1.5 py-0.5 rounded text-[10px]" :class="isDark ? 'bg-[#3d3d3d] text-[#8ab4f8]' : 'bg-gray-200 text-indigo-600'">{title}</code>
          <code class="px-1.5 py-0.5 rounded text-[10px]" :class="isDark ? 'bg-[#3d3d3d] text-[#8ab4f8]' : 'bg-gray-200 text-indigo-600'">{url}</code>
        </div>
      </div>

      <!-- 预设模板 -->
      <div class="mb-2 flex flex-wrap gap-1.5">
        <button
          v-for="template in promptTemplates"
          :key="template.name"
          @click="applyTemplate(template)"
          class="px-2 py-1 text-[10px] rounded transition-colors"
          :class="isDark 
            ? 'bg-[#2d2d2d] text-[#9aa0a6] hover:bg-[#3d3d3d] hover:text-[#e8eaed]' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'"
        >
          {{ template.name }}
        </button>
      </div>

      <!-- 输入框 -->
      <div class="relative">
        <textarea
          v-model="customPromptLocal"
          rows="4"
          placeholder="输入自定义提示词，或选择上方预设模板..."
          class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-y"
          :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed] placeholder-[#5f6368] focus:ring-[#8ab4f8]' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-indigo-500'"
        ></textarea>
        <!-- 展开编辑按钮 -->
        <button
          @click="showPromptEditor = true"
          class="absolute bottom-2 right-2 p-1 rounded transition-colors"
          :class="isDark ? 'text-[#5f6368] hover:text-[#9aa0a6] hover:bg-[#3d3d3d]' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'"
          title="全屏编辑"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>

      <!-- 字数统计 -->
      <div class="flex justify-between items-center mt-1">
        <span class="text-[10px]" :class="isDark ? 'text-[#5f6368]' : 'text-gray-400'">
          {{ customPromptLocal.length }} 字符
        </span>
        <span v-if="customPromptLocal.length > 2000" class="text-[10px] text-amber-500">
          提示词较长，可能影响响应
        </span>
      </div>
    </section>

    <!-- 全屏提示词编辑器 -->
    <Teleport to="body">
      <div
        v-if="showPromptEditor"
        class="fixed inset-0 z-50 flex flex-col"
        :class="isDark ? 'bg-[#1e1e1e]' : 'bg-white'"
      >
        <!-- 顶栏 -->
        <div class="px-4 py-3 border-b flex items-center justify-between shrink-0" :class="isDark ? 'border-[#3d3d3d]' : 'border-gray-200'">
          <h3 class="text-sm font-semibold" :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'">编辑提示词</h3>
          <button
            @click="showPromptEditor = false"
            class="p-1 rounded transition-colors"
            :class="isDark ? 'text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#2d2d2d]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 变量快速插入 -->
        <div class="px-4 py-2 flex items-center gap-2 shrink-0 border-b" :class="isDark ? 'border-[#3d3d3d]' : 'border-gray-100'">
          <span class="text-xs shrink-0" :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-400'">点击插入：</span>
          <button
            v-for="v in ['{content}', '{title}', '{url}']"
            :key="v"
            @click="insertVariable(v)"
            class="px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors"
            :class="isDark ? 'bg-[#2d2d2d] text-[#8ab4f8] hover:bg-[#3d3d3d]' : 'bg-gray-100 text-indigo-600 hover:bg-gray-200'"
          >{{ v }}</button>
        </div>

        <!-- 大 textarea -->
        <textarea
          ref="fullEditorRef"
          v-model="customPromptLocal"
          placeholder="输入自定义提示词，留空使用默认..."
          class="flex-1 w-full px-4 py-3 resize-none focus:outline-none text-sm leading-relaxed"
          :class="isDark ? 'bg-[#1e1e1e] text-[#e8eaed] placeholder-[#5f6368]' : 'bg-white text-gray-700 placeholder-gray-400'"
        ></textarea>

        <!-- 底栏 -->
        <div class="px-4 py-3 border-t flex items-center justify-between shrink-0" :class="isDark ? 'border-[#3d3d3d]' : 'border-gray-200'">
          <span class="text-xs" :class="isDark ? 'text-[#5f6368]' : 'text-gray-400'">
            {{ customPromptLocal.length }} 字符
            <span v-if="customPromptLocal.length > 2000" class="ml-2 text-amber-500">提示词较长</span>
          </span>
          <div class="flex gap-2">
            <button
              @click="customPromptLocal = ''; showPromptEditor = false"
              class="px-3 py-1.5 text-xs rounded-md transition-colors"
              :class="isDark ? 'text-[#9aa0a6] hover:bg-[#2d2d2d]' : 'text-gray-500 hover:bg-gray-100'"
            >清空</button>
            <button
              @click="showPromptEditor = false"
              class="px-3 py-1.5 text-xs rounded-md text-white transition-colors"
              :class="isDark ? 'bg-[#8ab4f8] hover:bg-[#aecbfa]' : 'bg-indigo-600 hover:bg-indigo-700'"
            >完成</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Display Format -->
    <section>
      <h3 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="text-xs font-semibold mb-2">展现形式</h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="format in displayFormats"
          :key="format.value"
          @click="settings.displayFormat = format.value"
          class="p-2 rounded-lg border text-left transition-colors relative"
          :class="settings.displayFormat === format.value
            ? (isDark ? 'border-[#8ab4f8] ring-1 ring-[#8ab4f8]' : 'border-indigo-500 ring-1 ring-indigo-500')
            : isDark ? 'border-[#3d3d3d] hover:bg-[#2d2d2d]' : 'border-gray-200 hover:bg-gray-50'"
        >
          <div :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="text-xs font-medium">{{ format.label }}</div>
          <div class="text-[10px]" :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-400'">{{ format.description }}</div>
        </button>
      </div>
    </section>

    <!-- UI Mode -->
    <section>
      <h3 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="text-xs font-semibold mb-2">界面模式</h3>
      <div class="space-y-1">
        <button
          v-for="mode in uiModes"
          :key="mode.value"
          @click="settings.uiMode = mode.value"
          class="w-full p-2 rounded-lg border text-left transition-colors relative flex items-center gap-2"
          :class="settings.uiMode === mode.value
            ? (isDark ? 'border-[#8ab4f8] ring-1 ring-[#8ab4f8]' : 'border-indigo-500 ring-1 ring-indigo-500')
            : isDark ? 'border-[#3d3d3d] hover:bg-[#2d2d2d]' : 'border-gray-200 hover:bg-gray-50'"
        >
          <svg class="w-4 h-4" :class="isDark ? 'text-[#8ab4f8]' : 'text-indigo-500'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <template v-if="mode.value === 'sidepanel'">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
            </template>
            <template v-else-if="mode.value === 'popup'">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
            </template>
            <template v-else-if="mode.value === 'floating'">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/>
            </template>
          </svg>
          <div>
            <div :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="text-xs font-medium">{{ mode.label }}</div>
            <div class="text-[10px]" :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-400'">{{ mode.description }}</div>
          </div>
        </button>
      </div>
    </section>

    <!-- TTS Settings -->
    <section>
      <h3 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="text-xs font-semibold mb-2">语音设置</h3>
      <div class="space-y-3">
        <!-- 音色选择 -->
        <div v-if="availableVoices.length > 0">
          <label class="block text-xs mb-1" :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'">音色</label>
          <select
            v-model="settings.ttsConfig.voiceURI"
            class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d] text-[#e8eaed] focus:ring-[#8ab4f8]' : 'bg-white border-gray-300 text-gray-700 focus:ring-indigo-500'"
          >
            <option value="">默认</option>
            <option v-for="voice in availableVoices" :key="voice.voiceURI" :value="voice.voiceURI">
              {{ voice.name }} ({{ voice.lang }})
            </option>
          </select>
        </div>
        <div>
          <label class="flex items-center justify-between text-xs mb-1" :class="isDark ? 'text-[#e8eaed]' : 'text-gray-600'">
            <span>语速</span>
            <span :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-400'">{{ settings.ttsConfig.rate.toFixed(1) }}x</span>
          </label>
          <input type="range" min="0.5" max="2.0" step="0.1" v-model.number="settings.ttsConfig.rate" class="w-full" />
        </div>
        <div>
          <label class="flex items-center justify-between text-xs mb-1" :class="isDark ? 'text-[#e8eaed]' : 'text-gray-600'">
            <span>音调</span>
            <span :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-400'">{{ settings.ttsConfig.pitch.toFixed(1) }}</span>
          </label>
          <input type="range" min="0" max="2" step="0.1" v-model.number="settings.ttsConfig.pitch" class="w-full" />
        </div>
      </div>
    </section>

    <!-- Save Message (toast style, no button here) -->
    <div v-if="saveMessage" class="p-2 rounded-md text-xs text-center"
      :class="saveSuccess
        ? (isDark ? 'bg-[#1e3a2f] text-[#81c995]' : 'bg-green-50 text-green-700')
        : (isDark ? 'bg-[#3d1f1f] text-[#f28b82]' : 'bg-red-50 text-red-700')">
      {{ saveMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick, onMounted } from 'vue';
import type { AIProviderType, ProviderConfig, DisplayFormat, UIMode } from '@/types';
import { useSettings } from '@/composables/useSettings';
import { createAIProvider } from '@/services/ai-service';

const props = defineProps<{
  isDark?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [success: boolean];
}>();

const { settings, isLoaded, saveSettings, setProvider, updateProviderConfig, setCustomPrompt } = useSettings();

const saveMessage = ref('');
const saveSuccess = ref(true);
const showPromptHelp = ref(false);
const customPromptLocal = ref('');
const showApiKey = ref(false);
const isTestingConnection = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);
const showPromptEditor = ref(false);
const fullEditorRef = ref<HTMLTextAreaElement | null>(null);
const availableVoices = ref<SpeechSynthesisVoice[]>([]);

function loadVoices() {
  if (typeof speechSynthesis === 'undefined') return;
  const all = speechSynthesis.getVoices();
  const zh = all.filter(v => v.lang.startsWith('zh') || v.lang.startsWith('cmn'));
  availableVoices.value = zh.length > 0 ? zh : all;
}

onMounted(() => {
  loadVoices();
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
});

watch(showPromptEditor, async (val) => {
  if (val) {
    await nextTick();
    fullEditorRef.value?.focus();
  }
});

function insertVariable(variable: string) {
  const el = fullEditorRef.value;
  if (!el) {
    customPromptLocal.value += variable;
    return;
  }
  const start = el.selectionStart ?? customPromptLocal.value.length;
  const end = el.selectionEnd ?? start;
  customPromptLocal.value = customPromptLocal.value.slice(0, start) + variable + customPromptLocal.value.slice(end);
  nextTick(() => {
    const pos = start + variable.length;
    el.setSelectionRange(pos, pos);
    el.focus();
  });
}

// 优先使用父组件传入的 isDark prop，确保主题切换时实时响应
const isDark = computed(() => props.isDark ?? settings.value.theme === 'dark');

// 同步父组件的 isDark 到本地 settings，防止保存时覆盖已切换的主题
watch(() => props.isDark, (dark) => {
  if (dark !== undefined) {
    settings.value.theme = dark ? 'dark' : 'light';
  }
});

const providers: { value: AIProviderType; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Claude' },
  { value: 'qwen', label: '通义千问' },
  { value: 'custom', label: '自定义' },
];

const displayFormats: { value: DisplayFormat; label: string; description: string }[] = [
  { value: 'standard', label: '标准', description: '主题 + 要点 + 结论' },
  { value: 'compact', label: '简洁', description: '紧凑排版' },
  { value: 'cards', label: '卡片', description: '要点独立成卡' },
  { value: 'outline', label: '大纲', description: '层级结构' },
];

const promptTemplates: { name: string; prompt: string }[] = [
  { 
    name: '简洁摘要', 
    prompt: '请用简洁的语言总结以下网页内容，突出核心观点：\n\n标题：{title}\n内容：{content}' 
  },
  { 
    name: '详细分析', 
    prompt: '请对以下网页内容进行详细分析，包括：\n1. 核心主题\n2. 主要观点\n3. 关键论据\n4. 结论\n\n标题：{title}\nURL：{url}\n内容：{content}' 
  },
  { 
    name: '要点提取', 
    prompt: '请提取以下网页的关键要点，以条目形式列出：\n\n{content}\n\n要求：每条要点不超过20字，最多列出5条。' 
  },
  { 
    name: '学术风格', 
    prompt: '请以学术论文摘要的风格总结以下内容：\n\n标题：{title}\n内容：{content}\n\n要求：客观、准确、使用专业术语。' 
  },
  { 
    name: '通俗易懂', 
    prompt: '请用通俗易懂的语言，像给小学生讲故事一样总结以下内容：\n\n{content}' 
  },
];

const uiModes: { value: UIMode; label: string; description: string }[] = [
  { value: 'sidepanel', label: '侧边栏', description: '不遮挡页面' },
  { value: 'popup', label: '弹窗', description: '点击图标弹出' },
  { value: 'floating', label: '悬浮窗', description: '页面内嵌' },
];

const defaultConfigs: Record<AIProviderType, { endpoint: string; model: string }> = {
  openai: { endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  claude: { endpoint: 'https://api.anthropic.com/v1/messages', model: 'claude-3-haiku-20240307' },
  qwen: { endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-turbo' },
  custom: { endpoint: '', model: '' },
};

const currentConfig = reactive<ProviderConfig>({
  endpoint: '',
  apiKey: '',
  model: '',
});

const currentProviderLabel = computed(() => {
  return providers.find((p) => p.value === settings.value.aiProvider)?.label || '';
});

const defaultEndpoint = computed(() => {
  return defaultConfigs[settings.value.aiProvider]?.endpoint || '';
});

const defaultModel = computed(() => {
  return defaultConfigs[settings.value.aiProvider]?.model || '';
});

watch(
  () => [isLoaded.value, settings.value.aiProvider],
  () => {
    if (isLoaded.value) {
      const config = settings.value.providerConfigs[settings.value.aiProvider];
      currentConfig.endpoint = config?.endpoint || '';
      currentConfig.apiKey = config?.apiKey || '';
      currentConfig.model = config?.model || '';
    }
  },
  { immediate: true },
);

watch(
  () => isLoaded.value,
  () => {
    if (isLoaded.value) {
      customPromptLocal.value = settings.value.customPrompt || '';
    }
  },
  { immediate: true },
);

function handleProviderChange() {
  setProvider(settings.value.aiProvider);
  const config = settings.value.providerConfigs[settings.value.aiProvider];
  currentConfig.endpoint = config?.endpoint || '';
  currentConfig.apiKey = config?.apiKey || '';
  currentConfig.model = config?.model || '';
}

function applyTemplate(template: { name: string; prompt: string }) {
  customPromptLocal.value = template.prompt;
}

function resetPrompt() {
  customPromptLocal.value = '';
}

async function handleSaveAll() {
  try {
    // 保存配置
    await updateProviderConfig(settings.value.aiProvider, {
      endpoint: currentConfig.endpoint || undefined,
      apiKey: currentConfig.apiKey || undefined,
      model: currentConfig.model || undefined,
    });

    // 保存提示词
    await setCustomPrompt(customPromptLocal.value);

    // 保存其他设置
    await saveSettings();

    saveSuccess.value = true;
    saveMessage.value = '设置已保存！';
    emit('saved', true);
  } catch (error) {
    saveSuccess.value = false;
    saveMessage.value = `保存失败: ${error instanceof Error ? error.message : '未知错误'}`;
    emit('saved', false);
  }
  setTimeout(() => { saveMessage.value = ''; }, 2000);
}

defineExpose({ save: handleSaveAll });

async function handleTestConnection() {
  // 清除之前的结果
  testResult.value = null;

  // 验证必填字段
  if (!currentConfig.apiKey) {
    testResult.value = { success: false, message: '请输入 API Key' };
    return;
  }

  const endpoint = currentConfig.endpoint || defaultEndpoint.value;
  const model = currentConfig.model || defaultModel.value;

  if (!endpoint) {
    testResult.value = { success: false, message: '请输入 API 地址' };
    return;
  }
  if (!model) {
    testResult.value = { success: false, message: '请输入模型名称' };
    return;
  }

  isTestingConnection.value = true;

  try {
    // 创建临时配置进行测试
    const provider = createAIProvider(settings.value.aiProvider, {
      endpoint,
      apiKey: currentConfig.apiKey,
      model,
    });

    if (provider.testConnection) {
      testResult.value = await provider.testConnection();
    } else {
      testResult.value = { success: false, message: '该服务商暂不支持测试连接' };
    }
    // 3秒后自动清除测试结果
    setTimeout(() => { testResult.value = null; }, 3000);
  } catch (error) {
    testResult.value = {
      success: false,
      message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
    // 失败提示也3秒后清除
    setTimeout(() => { testResult.value = null; }, 3000);
  } finally {
    isTestingConnection.value = false;
  }
}
</script>
