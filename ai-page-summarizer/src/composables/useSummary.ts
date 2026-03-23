import { ref, computed, onMounted, onUnmounted } from 'vue';
import { MessageType } from '@/types';
import type { Message, PageContent } from '@/types';
import { sendMessage } from '@/utils/message';

// 全局标志防止重复总结请求
let isSummarizing = false;

export function useSummary() {
  const pageContent = ref<PageContent | null>(null);
  const summary = ref('');
  const isLoading = ref(false);
  const error = ref('');

  // 使用命名函数以便正确移除监听器
  function handleMessage(message: Message) {
    // 只处理我们关心的消息类型
    if (![MessageType.SUMMARY_CHUNK, MessageType.SUMMARY_COMPLETE, MessageType.SUMMARY_ERROR].includes(message.type)) {
      return;
    }

    console.log('[useSummary] Received message:', message.type, message.payload);

    switch (message.type) {
      case MessageType.SUMMARY_CHUNK:
        summary.value += (message.payload as { chunk: string }).chunk;
        console.log('[useSummary] Current summary length:', summary.value.length);
        break;
      case MessageType.SUMMARY_COMPLETE:
        isLoading.value = false;
        isSummarizing = false;
        console.log('[useSummary] Complete. Final summary:', summary.value);
        break;
      case MessageType.SUMMARY_ERROR:
        error.value = (message.payload as { error: string }).error;
        isLoading.value = false;
        isSummarizing = false;
        break;
    }
  }

  // 标记监听器是否已添加
  let listenerAdded = false;

  onMounted(() => {
    // 防止重复添加监听器
    if (!listenerAdded) {
      chrome.runtime.onMessage.addListener(handleMessage);
      listenerAdded = true;
    }
  });

  onUnmounted(() => {
    // 确保移除监听器
    if (listenerAdded) {
      chrome.runtime.onMessage.removeListener(handleMessage);
      listenerAdded = false;
    }
    // 重置状态
    isSummarizing = false;
  });

  async function fetchPageContent(): Promise<void> {
    error.value = '';
    try {
      // 直接让 background 处理获取正确的活动标签页
      // background 使用 lastFocusedWindow 来获取用户正在浏览的窗口
      const result = await sendMessage(MessageType.GET_PAGE_CONTENT, undefined);

      if (result && typeof result === 'object' && 'error' in result) {
        const errorMsg = (result as { error: string }).error;

        // 处理特定的错误代码
        if (errorMsg === 'SPECIAL_PAGE') {
          error.value = '当前页面是浏览器特殊页面，请访问普通网页后使用';
        } else if (errorMsg === 'BLANK_PAGE') {
          error.value = '当前是空白页面，请访问一个网页后使用';
        } else if (errorMsg === 'CONTENT_SCRIPT_NOT_LOADED') {
          error.value = '请刷新当前页面后重试';
        } else {
          error.value = errorMsg;
        }
        return;
      }

      pageContent.value = result as PageContent;
    } catch (err) {
      error.value = `获取页面内容失败: ${err}`;
    }
  }

  async function startSummarize(): Promise<void> {
    // 防止重复点击
    if (isSummarizing || isLoading.value) {
      error.value = '正在总结中，请稍候...';
      return;
    }

    if (!pageContent.value) {
      await fetchPageContent();
      if (!pageContent.value) return;
    }

    summary.value = '';
    error.value = '';
    isLoading.value = true;
    isSummarizing = true;

    try {
      await sendMessage(MessageType.SUMMARIZE, pageContent.value);
    } catch (err) {
      error.value = `总结请求失败: ${err}`;
      isLoading.value = false;
      isSummarizing = false;
    }
  }

  async function stopSummarize(): Promise<void> {
    if (!isSummarizing) return;

    try {
      await sendMessage(MessageType.STOP_SUMMARIZE, undefined);
      isLoading.value = false;
      isSummarizing = false;
    } catch (err) {
      console.error('停止总结失败:', err);
    }
  }

  function reset(): void {
    summary.value = '';
    error.value = '';
    isLoading.value = false;
    isSummarizing = false;
    pageContent.value = null;
  }

  return {
    pageContent,
    summary,
    isLoading,
    isSummarizing: computed(() => isSummarizing),
    error,
    fetchPageContent,
    startSummarize,
    stopSummarize,
    reset,
  };
}
