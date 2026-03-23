<template>
  <!-- 内容区域 -->
  <div class="p-1">
    <div
      class="markdown-content leading-relaxed text-sm"
      :class="isDark ? 'markdown-dark' : 'markdown-light'"
      v-html="renderedContent"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';

const props = defineProps<{
  content: string;
  isDark?: boolean;
}>();

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

const renderedContent = computed(() => {
  return md.render(props.content);
});
</script>

<style scoped>
.markdown-content :deep(h1) {
  @apply text-base font-bold mt-3 mb-2;
}

.markdown-content :deep(h2) {
  @apply text-sm font-semibold mt-3 mb-1.5;
}

.markdown-content :deep(h3) {
  @apply text-xs font-semibold mt-2 mb-1;
}

.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  @apply text-xs font-medium mt-2 mb-1;
}

.markdown-content :deep(p) {
  @apply mb-2 leading-relaxed;
}

.markdown-content :deep(strong) {
  @apply font-semibold;
}

.markdown-content :deep(ul) {
  @apply list-disc ml-4 mb-2;
}

.markdown-content :deep(ol) {
  @apply list-decimal ml-4 mb-2;
}

.markdown-content :deep(li) {
  @apply text-xs py-0.5;
}

.markdown-content :deep(code) {
  @apply px-1 py-0.5 rounded text-xs font-mono;
}

.markdown-content :deep(pre) {
  @apply p-2 rounded-lg mb-2 overflow-x-auto;
}

.markdown-content :deep(pre code) {
  @apply bg-transparent p-0;
}

.markdown-content :deep(blockquote) {
  @apply border-l-2 pl-3 my-2 italic;
}

.markdown-content :deep(a) {
  @apply text-indigo-500 hover:text-indigo-400 underline;
}

.markdown-content :deep(hr) {
  @apply my-3;
}

.markdown-content :deep(table) {
  @apply w-full text-xs mb-2 border-collapse;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  @apply border px-2 py-1 text-left;
}

.markdown-content :deep(th) {
  @apply font-semibold;
}

/* Light mode styles */
.markdown-light :deep(h1) {
  @apply text-gray-900;
}

.markdown-light :deep(h2) {
  @apply text-gray-800;
}

.markdown-light :deep(h3) {
  @apply text-gray-700;
}

.markdown-light :deep(h4),
.markdown-light :deep(h5),
.markdown-light :deep(h6) {
  @apply text-gray-600;
}

.markdown-light :deep(p) {
  @apply text-gray-700;
}

.markdown-light :deep(strong) {
  @apply text-gray-800;
}

.markdown-light :deep(li) {
  @apply text-gray-600;
}

.markdown-light :deep(code) {
  @apply bg-gray-100 text-gray-800;
}

.markdown-light :deep(pre) {
  @apply bg-gray-100;
}

.markdown-light :deep(blockquote) {
  @apply border-gray-300 text-gray-600;
}

.markdown-light :deep(hr) {
  @apply border-gray-200;
}

.markdown-light :deep(th),
.markdown-light :deep(td) {
  @apply border-gray-200;
}

.markdown-light :deep(th) {
  @apply bg-gray-50 text-gray-700;
}

/* Dark mode styles - Gemini 风格 */
.markdown-dark :deep(h1) {
  @apply text-[#e8eaed];
}

.markdown-dark :deep(h2) {
  @apply text-[#e8eaed];
}

.markdown-dark :deep(h3) {
  @apply text-[#9aa0a6];
}

.markdown-dark :deep(h4),
.markdown-dark :deep(h5),
.markdown-dark :deep(h6) {
  @apply text-[#9aa0a6];
}

.markdown-dark :deep(p) {
  @apply text-[#e8eaed];
}

.markdown-dark :deep(strong) {
  @apply text-[#e8eaed];
}

.markdown-dark :deep(li) {
  @apply text-[#9aa0a6];
}

.markdown-dark :deep(code) {
  @apply bg-[#2d2d2d] text-[#e8eaed];
}

.markdown-dark :deep(pre) {
  @apply bg-[#2d2d2d];
}

.markdown-dark :deep(blockquote) {
  @apply border-[#5f6368] text-[#9aa0a6];
}

.markdown-dark :deep(hr) {
  @apply border-[#3d3d3d];
}

.markdown-dark :deep(th),
.markdown-dark :deep(td) {
  @apply border-[#3d3d3d];
}

.markdown-dark :deep(th) {
  @apply bg-[#2d2d2d] text-[#e8eaed];
}

.markdown-dark :deep(a) {
  @apply text-[#8ab4f8] hover:text-[#aecbfa];
}
</style>
