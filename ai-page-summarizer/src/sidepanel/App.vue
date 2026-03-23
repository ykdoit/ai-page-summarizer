<template>
  <div :class="isDark ? 'bg-[#1e1e1e] text-[#e8eaed]' : 'bg-white text-gray-700'" class="h-screen flex flex-col overflow-hidden">
    <main ref="mainRef" class="flex-1 p-2.5 pb-14 overflow-y-auto overflow-x-hidden relative" @scroll="handleScroll">
      <Settings v-if="showSettings" ref="settingsRef" @close="showSettings = false" @saved="(ok) => showToast(ok ? '设置已保存！' : '保存失败', ok ? 'success' : 'error')" :isDark="isDark" />

      <template v-else>
        <!-- 空状态引导 -->
        <div v-if="!pageContent && !isLoading && !error" class="flex flex-col items-center justify-center py-10 text-center">
          <div :class="isDark ? 'bg-[#2d2d2d]' : 'bg-indigo-100'" class="w-14 h-14 rounded-full flex items-center justify-center mb-3">
            <svg :class="isDark ? 'text-[#8ab4f8]' : 'text-indigo-600'" class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-800'" class="text-sm font-medium mb-1.5">开始总结网页内容</h2>
          <p :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'" class="text-xs mb-3 max-w-[180px]">点击下方按钮，AI 将自动提取并总结当前页面内容</p>
          <button
            @click="handleStart"
            class="py-2 px-5 rounded-lg font-medium text-sm text-white transition-all duration-200 shadow-md hover:shadow-lg"
            :class="isDark ? 'bg-gradient-to-r from-[#8ab4f8] to-[#c4b5fd] hover:from-[#aecbfa] hover:to-[#d4c4fc]' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'"
          >
            开始使用
          </button>
        </div>

        <!-- 页面信息 - 极简 -->
        <div v-if="pageContent" class="mb-2">
          <div class="flex items-center justify-between gap-2 text-xs mb-0.5">
            <div class="flex-1 min-w-0">
              <p :class="isDark ? 'text-[#e8eaed]' : 'text-gray-700'" class="font-medium truncate" :title="pageContent.title">{{ pageContent.title }}</p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                @click="handleRefreshPage"
                :disabled="isLoading"
                :class="isDark ? 'hover:bg-[#2d2d2d] text-[#9aa0a6] hover:text-[#e8eaed]' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'"
                class="p-1 rounded transition-colors disabled:opacity-50"
                title="重新获取当前页面信息"
              >
                <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              </button>
              <button
                @click="handleSummarize"
                :disabled="isLoading && !isSummarizing"
                class="px-2.5 py-1 rounded font-medium text-white text-xs transition-all duration-200"
                :class="isLoading
                  ? 'bg-red-500 hover:bg-red-600'
                  : isDark ? 'bg-[#8ab4f8] hover:bg-[#aecbfa]' : 'bg-indigo-500 hover:bg-indigo-600'"
              >
                {{ isLoading ? '停止' : '总结' }}
              </button>
            </div>
          </div>
          <p :class="isDark ? 'text-[#5f6368]' : 'text-gray-400'" class="text-[10px] truncate" :title="pageContent.url">{{ pageContent.url }}</p>
        </div>

        <!-- Error -->
        <Transition name="shake">
          <div v-if="error" class="mb-2 p-2 rounded-lg" :class="isDark ? 'bg-[#2d2d2d] border border-[#5f6368]' : 'bg-red-50 border border-red-200'">
            <p class="text-xs" :class="isDark ? 'text-[#f28b82]' : 'text-red-600'">{{ error }}</p>
          </div>
        </Transition>

        <!-- 1. 总结内容区域 -->
        <SummaryView v-if="summary" :content="summary" :isDark="isDark" />

        <!-- 2. 加载状态区域 - 渐变流动特效 -->
        <Transition name="fade">
          <div v-if="isLoading" class="mt-2 flex items-center gap-1 py-2">
            <span class="text-xs font-medium gradient-text-flow" :class="isDark ? 'gradient-dark' : 'gradient-light'">生成中</span>
            <div class="flex items-center gap-0.5">
              <span class="w-1 h-1 rounded-full animate-bounce-delay-1" :class="isDark ? 'bg-[#8ab4f8]' : 'bg-indigo-500'"></span>
              <span class="w-1 h-1 rounded-full animate-bounce-delay-2" :class="isDark ? 'bg-[#c4b5fd]' : 'bg-purple-500'"></span>
              <span class="w-1 h-1 rounded-full animate-bounce-delay-3" :class="isDark ? 'bg-[#f28b82]' : 'bg-pink-500'"></span>
            </div>
          </div>
        </Transition>

        <!-- 3. 操作按钮区域 - 图标按钮 -->
        <Transition name="slide-up">
          <div v-if="summary && !isLoading" class="mt-2 flex items-center gap-1">
            <button
              @click="handleCopy"
              class="p-2 rounded-full transition-all duration-200"
              :class="copied
                ? (isDark ? 'bg-[#2d2d2d] text-[#81c995]' : 'bg-green-100 text-green-600')
                : (isDark ? 'hover:bg-[#2d2d2d] text-[#9aa0a6] hover:text-[#e8eaed]' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700')"
              :title="copied ? '已复制' : '复制'"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
            <button
              @click="handleRegenerate"
              class="p-2 rounded-full transition-all duration-200"
              :class="isDark ? 'hover:bg-[#2d2d2d] text-[#9aa0a6] hover:text-[#e8eaed]' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'"
              title="重新总结"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
            <!-- 播放中音频动画 -->
            <div v-if="ttsState === 'speaking'" class="flex items-end gap-[2px] h-4 mx-1">
              <span class="w-[3px] rounded-full animate-bar-1" :class="isDark ? 'bg-[#8ab4f8]' : 'bg-indigo-500'"></span>
              <span class="w-[3px] rounded-full animate-bar-2" :class="isDark ? 'bg-[#8ab4f8]' : 'bg-indigo-500'"></span>
              <span class="w-[3px] rounded-full animate-bar-3" :class="isDark ? 'bg-[#8ab4f8]' : 'bg-indigo-500'"></span>
              <span class="w-[3px] rounded-full animate-bar-2" :class="isDark ? 'bg-[#8ab4f8]' : 'bg-indigo-500'"></span>
            </div>

            <!-- TTS 播放/暂停按钮 -->
            <button
              @click="handleTTS"
              class="p-2 rounded-full transition-all duration-200"
              :class="ttsState !== 'idle'
                ? (isDark ? 'bg-[#2d2d2d] text-[#8ab4f8]' : 'bg-indigo-100 text-indigo-600')
                : (isDark ? 'hover:bg-[#2d2d2d] text-[#9aa0a6] hover:text-[#e8eaed]' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700')"
              :title="ttsState === 'speaking' ? '暂停' : ttsState === 'paused' ? '继续播放' : '语音播报'"
            >
              <!-- idle: 播放三角 -->
              <svg v-if="ttsState === 'idle'" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <!-- speaking: 暂停双竖线 -->
              <svg v-else-if="ttsState === 'speaking'" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              <!-- paused: 播放三角 + 小点表示已暂停 -->
              <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" opacity="0.6"/>
                <circle cx="19" cy="5" r="4" fill="#f59e0b"/>
              </svg>
            </button>
            <!-- TTS 停止按钮 (仅在播放或暂停时显示) -->
            <button
              v-if="ttsState !== 'idle'"
              @click="stopTTS"
              class="p-2 rounded-full transition-all duration-200"
              :class="isDark ? 'hover:bg-[#2d2d2d] text-[#9aa0a6] hover:text-[#e8eaed]' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'"
              title="停止播报"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2"/>
              </svg>
            </button>
          </div>
        </Transition>
      </template>

      <!-- 回到顶部按钮 -->
      <Transition name="fade">
        <button
          v-if="showBackToTop"
          @click="scrollToTop"
          class="fixed bottom-14 right-3 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-10"
          :class="isDark ? 'bg-[#2d2d2d] border border-[#3d3d3d] text-[#9aa0a6] hover:text-[#8ab4f8] hover:border-[#8ab4f8]' : 'bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300'"
          title="回到顶部"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </Transition>

      <!-- 回到底部按钮 -->
      <Transition name="fade">
        <button
          v-if="showBackToBottom"
          @click="scrollToBottom"
          class="fixed z-10 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 right-3"
          :class="[
            isDark ? 'bg-[#2d2d2d] border border-[#3d3d3d] text-[#9aa0a6] hover:text-[#8ab4f8] hover:border-[#8ab4f8]' : 'bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300',
            showBackToTop ? 'bottom-24' : 'bottom-14'
          ]"
          title="回到底部"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </Transition>
    </main>

    <!-- 底部固定栏 -->
    <div :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d]' : 'bg-white border-gray-100'" class="fixed bottom-0 left-0 right-0 border-t px-3 py-2 flex items-center justify-between z-20">
      <div class="flex items-center gap-1">
        <img src="/icons/tiger.svg" alt="Logo" class="w-5 h-5" />
        <span :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'" class="text-xs">AI 总结助手</span>
      </div>
      <div class="flex items-center gap-1">
        <!-- 设置页保存按钮 -->
        <button
          v-if="showSettings"
          @click="handleSaveSettings"
          class="px-3 py-1 text-xs font-medium rounded-lg text-white transition-colors"
          :class="isDark ? 'bg-[#8ab4f8] hover:bg-[#aecbfa]' : 'bg-indigo-600 hover:bg-indigo-700'"
        >
          保存设置
        </button>
        <!-- 主题切换 -->
        <button
          @click="toggleTheme"
          :class="isDark ? 'hover:bg-[#3d3d3d] text-[#9aa0a6] hover:text-[#fdd663]' : 'hover:bg-gray-100 text-gray-400 hover:text-indigo-600'"
          class="p-1.5 rounded-full transition-colors"
          :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
        >
          <svg v-if="isDark" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </button>
        <!-- 设置按钮 -->
        <button
          @click="showSettings = !showSettings"
          :class="isDark ? 'hover:bg-[#3d3d3d] text-[#9aa0a6] hover:text-[#e8eaed]' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'"
          class="p-1.5 rounded-full transition-colors"
          :title="showSettings ? '返回' : '设置'"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="showSettings" d="M15 19l-7-7 7-7" />
            <template v-else>
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </template>
          </svg>
        </button>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div
        v-if="toastMessage"
        class="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg"
        :class="toastType === 'success'
          ? (isDark ? 'bg-[#2d2d2d] text-[#81c995] border border-[#3d3d3d]' : 'bg-green-500 text-white')
          : (isDark ? 'bg-[#2d2d2d] text-[#f28b82] border border-[#3d3d3d]' : 'bg-red-500 text-white')"
      >
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import SummaryView from './components/SummaryView.vue';
import Settings from './components/Settings.vue';
import { useSummary } from '@/composables/useSummary';
import { useTTS } from '@/composables/useTTS';
import { useSettings } from '@/composables/useSettings';

const showSettings = ref(false);
const copied = ref(false);
const showBackToTop = ref(false);
const showBackToBottom = ref(false);
const mainRef = ref<HTMLElement | null>(null);
const settingsRef = ref<{ save: () => Promise<void> } | null>(null);
const isRefreshing = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');
const savedScrollTop = ref(0);

const { settings, setTheme } = useSettings();
const { pageContent, summary, isLoading, error, startSummarize, stopSummarize, fetchPageContent, reset, isSummarizing } = useSummary();
const { speak, stop: stopTTS, pause: pauseTTS, resume: resumeTTS, ttsState } = useTTS();

// 计算是否为深色模式
const isDark = computed(() => settings.value.theme === 'dark');

// 同步 html 元素的 dark 类
watch(
  isDark,
  (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  { immediate: true }
);

// 保存/恢复滚动位置（切换设置页面时）
watch(
  showSettings,
  (show) => {
    if (show) {
      // 进入设置前保存滚动位置
      if (mainRef.value) {
        savedScrollTop.value = mainRef.value.scrollTop;
      }
    } else {
      // 离开设置后恢复滚动位置
      setTimeout(() => {
        if (mainRef.value) {
          mainRef.value.scrollTop = savedScrollTop.value;
        }
      }, 0);
    }
  }
);

// 显示 Toast 提示
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 2000);
}

// 切换主题
function toggleTheme() {
  setTheme(isDark.value ? 'light' : 'dark');
}

// 开始使用 - 获取页面并开始总结
async function handleStart() {
  stopTTS();
  await fetchPageContent();
  if (pageContent.value) {
    await startSummarize();
  }
}

// 处理总结按钮点击
async function handleSummarize() {
  if (isLoading.value) {
    stopSummarize();
  } else {
    stopTTS();
    await startSummarize();
  }
}

// 刷新页面内容
async function handleRefreshPage() {
  isRefreshing.value = true;
  await fetchPageContent();
  setTimeout(() => {
    isRefreshing.value = false;
  }, 500);
}

// 监听内容变化，自动滚动到底部
watch(
  () => summary.value,
  () => {
    if (isLoading.value && mainRef.value) {
      // 使用 setTimeout 确保 DOM 完全更新后再滚动
      setTimeout(() => {
        if (mainRef.value) {
          mainRef.value.scrollTop = mainRef.value.scrollHeight;
        }
      }, 50);
    }
  }
);

// 监听滚动，显示/隐藏回到顶部按钮
function handleScroll() {
  if (mainRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = mainRef.value;
    showBackToTop.value = scrollTop > 100;
    showBackToBottom.value = scrollTop + clientHeight < scrollHeight - 20;
  }
}

function scrollToTop() {
  if (mainRef.value) {
    mainRef.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function scrollToBottom() {
  if (mainRef.value) {
    mainRef.value.scrollTo({ top: mainRef.value.scrollHeight, behavior: 'smooth' });
  }
}

async function handleSaveSettings() {
  await settingsRef.value?.save();
}

// 添加滚动监听
onMounted(() => {
  if (mainRef.value) {
    mainRef.value.addEventListener('scroll', handleScroll);
    handleScroll();
  }
});

onUnmounted(() => {
  if (mainRef.value) {
    mainRef.value.removeEventListener('scroll', handleScroll);
  }
});

async function handleCopy() {
  if (!summary.value) return;
  try {
    await navigator.clipboard.writeText(summary.value);
    copied.value = true;
    showToast('已复制到剪贴板');
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = summary.value;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copied.value = true;
    showToast('已复制到剪贴板');
    setTimeout(() => { copied.value = false; }, 2000);
  }
}

async function handleRegenerate() {
  stopTTS();
  reset();
  await startSummarize();
}

function handleTTS() {
  if (!summary.value) return;
  if (ttsState.value === 'speaking') {
    // 正在播放 → 暂停
    pauseTTS();
  } else if (ttsState.value === 'paused') {
    // 已暂停 → 继续
    resumeTTS();
  } else {
    // 空闲 → 开始播放（传入用户配置的语速/音调/音色）
    speak(summary.value, settings.value.ttsConfig.rate, settings.value.ttsConfig.pitch, settings.value.ttsConfig.voiceURI);
  }
}
</script>

<style scoped>
/* Main 滚动容器样式 */
main {
  height: 100%;
  scroll-behavior: smooth;
}

/* 滚动条样式 - 确保在组件内生效 */
main::-webkit-scrollbar {
  width: 8px;
}

main::-webkit-scrollbar-track {
  background: transparent;
}

main::-webkit-scrollbar-thumb {
  background: #c1c7cd;
  border-radius: 4px;
}

main::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 深色模式滚动条 */
:global(html.dark) main::-webkit-scrollbar-thumb {
  background: #5f6368;
}

:global(html.dark) main::-webkit-scrollbar-thumb:hover {
  background: #78909c;
}

/* 渐变文字流动动画 */
.gradient-text-flow {
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-size: 200% 100%;
  animation: gradient-flow 2s linear infinite;
}

.gradient-light {
  background-image: linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1);
}

.gradient-dark {
  background-image: linear-gradient(90deg, #8ab4f8, #c4b5fd, #f28b82, #fdd663, #81c995, #8ab4f8);
}

@keyframes gradient-flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Shake animation for errors */
.shake-enter-active {
  animation: shake 0.5s ease-in-out;
}

.shake-leave-active {
  transition: opacity 0.3s ease;
}

.shake-leave-to {
  opacity: 0;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

/* Toast transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

/* Bounce animation with delays */
@keyframes bounce-dot {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
}

.animate-bounce-delay-1 {
  animation: bounce-dot 1s ease-in-out infinite;
  animation-delay: 0ms;
}

.animate-bounce-delay-2 {
  animation: bounce-dot 1s ease-in-out infinite;
  animation-delay: 150ms;
}

.animate-bounce-delay-3 {
  animation: bounce-dot 1s ease-in-out infinite;
  animation-delay: 300ms;
}

/* Spin animation for refresh */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
