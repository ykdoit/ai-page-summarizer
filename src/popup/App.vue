<template>
  <div :class="isDark ? 'bg-[#1e1e1e] text-[#e8eaed]' : 'bg-white text-gray-800'" class="w-80 max-h-[500px] flex flex-col">
    <!-- Header -->
    <header :class="isDark ? 'border-[#3d3d3d]' : 'border-gray-200'" class="px-4 py-3 border-b flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <svg :class="isDark ? 'text-[#8ab4f8]' : 'text-indigo-600'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-800'" class="text-sm font-semibold">AI 总结助手</h1>
      </div>
      <button
        @click="showSettings = !showSettings"
        :class="isDark ? 'hover:bg-[#2d2d2d] text-[#9aa0a6]' : 'hover:bg-gray-100 text-gray-500'"
        class="p-1 rounded"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto p-4">
      <Settings v-if="showSettings" @close="showSettings = false" :isDark="isDark" />

      <template v-else>
        <!-- Page info -->
        <div v-if="pageContent" :class="isDark ? 'bg-[#2d2d2d]' : 'bg-gray-50'" class="mb-3 p-2 rounded text-xs">
          <p :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="font-medium truncate">{{ pageContent.title }}</p>
          <p :class="isDark ? 'text-[#5f6368]' : 'text-gray-400'" class="truncate">{{ pageContent.url }}</p>
        </div>

        <!-- Error -->
        <div v-if="error" :class="isDark ? 'bg-[#3d1f1f] border-[#5f2020] text-[#f28b82]' : 'bg-red-50 border-red-200 text-red-600'" class="mb-3 p-2 border rounded text-xs">
          {{ error }}
        </div>

        <!-- Summarize button -->
        <button
          @click="startSummarize"
          :disabled="isLoading"
          class="w-full py-2 px-3 rounded font-medium text-white text-sm transition-colors mb-3"
          :class="isLoading
            ? (isDark ? 'bg-[#5f7fb8] cursor-not-allowed' : 'bg-indigo-400 cursor-not-allowed')
            : (isDark ? 'bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#1e1e1e]' : 'bg-indigo-600 hover:bg-indigo-700')"
        >
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            总结中...
          </span>
          <span v-else>开始总结</span>
        </button>

        <!-- Summary -->
        <div v-if="summary" :class="isDark ? 'bg-[#2d2d2d] text-[#e8eaed]' : 'bg-gray-50 text-gray-700'" class="rounded p-3 text-sm max-h-60 overflow-y-auto">
          <div class="prose prose-sm max-w-none" v-html="renderedSummary"></div>
        </div>

        <!-- TTS -->
        <div v-if="summary && !isLoading" class="mt-3 flex gap-2">
          <button
            v-if="ttsState === 'idle'"
            @click="handleSpeak"
            class="flex-1 py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
          >
            语音播报
          </button>
          <button
            v-if="ttsState === 'speaking'"
            @click="pauseTTS"
            class="flex-1 py-1.5 px-3 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded transition-colors"
          >
            暂停
          </button>
          <button
            v-if="ttsState === 'paused'"
            @click="resumeTTS"
            class="flex-1 py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
          >
            继续
          </button>
          <button
            v-if="ttsState !== 'idle'"
            @click="stopTTS"
            class="py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
          >
            停止
          </button>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { MessageType } from '@/types';
import type { Message, PageContent, TTSState } from '@/types';
import { sendMessage } from '@/utils/message';
import { ttsService } from '@/services/tts-service';
import { storageService } from '@/services/storage-service';
import Settings from './Settings.vue';

const showSettings = ref(false);
const pageContent = ref<PageContent | null>(null);
const summary = ref('');
const isLoading = ref(false);
const error = ref('');
const ttsState = ref<TTSState>('idle');
const isDark = ref(false);

watch(isDark, (dark) => {
  if (dark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
});

const renderedSummary = computed(() => {
  const headingColor = isDark.value ? '#e8eaed' : '#1f2937';
  let html = escapeHtml(summary.value);
  html = html.replace(/^## (.+)$/gm, `<h3 style="font-weight:600;color:${headingColor};margin:8px 0 4px">$1</h3>`);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin-left:12px;list-style:decimal">$1</li>');
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li style="margin-left:12px;list-style:disc">$1</li>');
  html = html.replace(/\n\n/g, '</p><p style="margin-bottom:4px">');
  html = html.replace(/\n/g, '<br/>');
  return `<p style="margin-bottom:4px">${html}</p>`;
});

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function handleMessage(message: Message) {
  switch (message.type) {
    case MessageType.SUMMARY_CHUNK:
      summary.value += (message.payload as { chunk: string }).chunk;
      break;
    case MessageType.SUMMARY_COMPLETE:
      isLoading.value = false;
      break;
    case MessageType.SUMMARY_ERROR:
      error.value = (message.payload as { error: string }).error;
      isLoading.value = false;
      break;
    case MessageType.SETTINGS_UPDATED:
      isDark.value = (message.payload as { theme: string })?.theme === 'dark';
      break;
  }
}

onMounted(async () => {
  chrome.runtime.onMessage.addListener(handleMessage);
  ttsService.onStateChange = (state) => { ttsState.value = state; };
  const settings = await storageService.getSettings();
  isDark.value = settings.theme === 'dark';
  if (isDark.value) document.documentElement.classList.add('dark');
});

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(handleMessage);
  ttsService.stop();
});

async function startSummarize() {
  if (!pageContent.value) {
    await fetchPageContent();
    if (!pageContent.value) return;
  }

  summary.value = '';
  error.value = '';
  isLoading.value = true;

  try {
    await sendMessage(MessageType.SUMMARIZE, pageContent.value);
  } catch (err) {
    error.value = `总结请求失败: ${err}`;
    isLoading.value = false;
  }
}

async function fetchPageContent() {
  error.value = '';
  try {
    const result = await sendMessage(MessageType.GET_PAGE_CONTENT, undefined);
    if (result && typeof result === 'object' && 'error' in result) {
      const errorMsg = (result as { error: string }).error;
      if (errorMsg === 'SPECIAL_PAGE') error.value = '当前页面是浏览器特殊页面，请访问普通网页后使用';
      else if (errorMsg === 'BLANK_PAGE') error.value = '当前是空白页面，请访问一个网页后使用';
      else if (errorMsg === 'CONTENT_SCRIPT_NOT_LOADED') error.value = '请刷新当前页面后重试';
      else error.value = errorMsg;
      return;
    }
    pageContent.value = result as PageContent;
  } catch (err) {
    error.value = `获取页面内容失败: ${err}`;
  }
}

function handleSpeak() {
  ttsService.speak(summary.value);
}

function pauseTTS() {
  ttsService.pause();
}

function resumeTTS() {
  ttsService.resume();
}

function stopTTS() {
  ttsService.stop();
}
</script>
