import type { TTSOptions, TTSState } from '@/types';

export class TTSService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private _state: TTSState = 'idle';
  private _onStateChange: ((state: TTSState) => void) | null = null;
  private _keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  get state(): TTSState {
    return this._state;
  }

  get isSpeaking(): boolean {
    return this._state === 'speaking';
  }

  get isPaused(): boolean {
    return this._state === 'paused';
  }

  set onStateChange(handler: ((state: TTSState) => void) | null) {
    this._onStateChange = handler;
  }

  private setState(state: TTSState): void {
    this._state = state;
    this._onStateChange?.(state);
  }

  speak(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;

      if (options?.voiceURI) {
        const voices = speechSynthesis.getVoices();
        const voice = voices.find((v) => v.voiceURI === options.voiceURI);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = 'zh-CN';
        }
      } else {
        utterance.lang = 'zh-CN';
      }

      utterance.onstart = () => {
        this.setState('speaking');
        // Chrome bug: speechSynthesis stops silently after ~15s, keepAlive prevents it
        this._keepAliveTimer = setInterval(() => {
          if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            speechSynthesis.resume();
          }
        }, 10000);
      };
      utterance.onend = () => {
        this._clearKeepAlive();
        this.setState('idle');
        resolve();
      };
      utterance.onerror = (e) => {
        this._clearKeepAlive();
        this.setState('idle');
        if (e.error === 'canceled' || e.error === 'interrupted') {
          resolve();
        } else {
          reject(new Error(`TTS error: ${e.error}`));
        }
      };
      utterance.onpause = () => this.setState('paused');
      utterance.onresume = () => this.setState('speaking');

      this.utterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  pause(): void {
    if (this.isSpeaking) {
      speechSynthesis.pause();
    }
  }

  resume(): void {
    if (this.isPaused) {
      speechSynthesis.resume();
    }
  }

  stop(): void {
    this._clearKeepAlive();
    speechSynthesis.cancel();
    this.utterance = null;
    this.setState('idle');
  }

  private _clearKeepAlive(): void {
    if (this._keepAliveTimer !== null) {
      clearInterval(this._keepAliveTimer);
      this._keepAliveTimer = null;
    }
  }

  static getVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }

  static getChineseVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices().filter(
      (v) => v.lang.startsWith('zh') || v.lang.startsWith('cmn'),
    );
  }
}

export const ttsService = new TTSService();
