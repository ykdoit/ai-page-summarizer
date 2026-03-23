<template>
  <div :class="isDark ? 'bg-[#1e1e1e]' : 'bg-gray-50'" class="min-h-screen">
    <div class="max-w-xl mx-auto p-6">
      <header class="mb-6">
        <h1 :class="isDark ? 'text-[#e8eaed]' : 'text-gray-800'" class="text-xl font-bold">AI 总结助手 - 设置</h1>
        <p :class="isDark ? 'text-[#9aa0a6]' : 'text-gray-500'" class="text-sm mt-1">配置 AI 服务商和语音播报参数</p>
      </header>

      <div :class="isDark ? 'bg-[#2d2d2d] border-[#3d3d3d]' : 'bg-white border-gray-200'" class="rounded-lg shadow-sm border p-6">
        <Settings :isDark="isDark" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import Settings from '@/sidepanel/components/Settings.vue';
import { useSettings } from '@/composables/useSettings';

const { settings } = useSettings();
const isDark = computed(() => settings.value.theme === 'dark');

watch(isDark, (dark) => {
  if (dark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}, { immediate: true });

onMounted(() => {
  document.documentElement.style.overflow = 'auto';
  document.body.style.overflow = 'auto';
});
</script>
