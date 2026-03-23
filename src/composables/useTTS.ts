import { ref, onUnmounted } from 'vue';
import type { TTSState } from '@/types';
import { ttsService } from '@/services/tts-service';
import { stripMarkdown } from '@/utils/helpers';

export function useTTS() {
  const ttsState = ref<TTSState>('idle');
  const voices = ref<SpeechSynthesisVoice[]>([]);

  ttsService.onStateChange = (state) => {
    ttsState.value = state;
  };

  function loadVoices(): void {
    const available = speechSynthesis.getVoices();
    voices.value = available.filter(
      (v) => v.lang.startsWith('zh') || v.lang.startsWith('cmn'),
    );
    // If no Chinese voices, show all
    if (voices.value.length === 0) {
      voices.value = available;
    }
  }

  // Voices may load asynchronously
  if (typeof speechSynthesis !== 'undefined') {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  async function speak(text: string, rate?: number, pitch?: number, voiceURI?: string): Promise<void> {
    const plainText = stripMarkdown(text);
    await ttsService.speak(plainText, { rate, pitch, voiceURI });
  }

  function pause(): void {
    ttsService.pause();
  }

  function resume(): void {
    ttsService.resume();
  }

  function stop(): void {
    ttsService.stop();
  }

  onUnmounted(() => {
    ttsService.stop();
    ttsService.onStateChange = null;
  });

  return {
    ttsState,
    voices,
    speak,
    pause,
    resume,
    stop,
  };
}
