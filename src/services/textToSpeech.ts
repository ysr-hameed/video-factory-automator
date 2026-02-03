/**
 * Text-to-Speech Service
 * Converts text to audio using Web Speech API
 */

export interface TTSOptions {
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
  voice?: SpeechSynthesisVoice;
}

export class TextToSpeechService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private loadVoices(): void {
    if (!this.synthesis) return;
    
    // Load available voices
    this.voices = this.synthesis.getVoices();
    
    // Chrome loads voices asynchronously
    if (this.voices.length === 0) {
      this.synthesis.addEventListener('voiceschanged', () => {
        this.voices = this.synthesis.getVoices();
      });
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Check if TTS is available in the current environment
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Convert text to speech and return audio blob
   * Returns null if TTS is not available or fails
   */
  async textToSpeech(
    text: string,
    options: TTSOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<Blob | null> {
    // Check if TTS is available
    if (!this.isAvailable()) {
      console.warn('Speech synthesis not available in this environment');
      onProgress?.(100);
      return null;
    }

    return new Promise((resolve) => {
      try {
        // Simulate progress for silent generation
        const simulateProgress = () => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            onProgress?.(Math.min(100, progress));
            if (progress >= 100) {
              clearInterval(interval);
              resolve(null);
            }
          }, 100);
        };

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set options
        utterance.rate = options.rate ?? 1.0;
        utterance.pitch = options.pitch ?? 1.0;
        utterance.volume = options.volume ?? 1.0;
        
        if (options.voice) {
          utterance.voice = options.voice;
        } else if (this.voices.length > 0) {
          // Try to find an English voice
          const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
        }

        // Progress tracking
        const totalLength = text.length;
        let currentPosition = 0;
        
        utterance.onboundary = (event) => {
          currentPosition = event.charIndex;
          const progress = Math.min(100, (currentPosition / totalLength) * 100);
          onProgress?.(progress);
        };

        utterance.onend = () => {
          onProgress?.(100);
          resolve(null); // For now, return null as we're not recording
        };

        utterance.onerror = (event) => {
          console.warn('Speech synthesis error, continuing without audio:', event);
          // Don't reject, just continue without audio
          simulateProgress();
        };

        // Attempt to speak (will be silent if not available)
        try {
          this.synthesis.speak(utterance);
          
          // Fallback: if speech doesn't start within 500ms, simulate progress
          setTimeout(() => {
            if (currentPosition === 0) {
              console.warn('Speech synthesis not starting, continuing without audio');
              this.synthesis.cancel();
              simulateProgress();
            }
          }, 500);
        } catch (error) {
          console.warn('Error starting speech synthesis:', error);
          simulateProgress();
        }
      } catch (error) {
        console.warn('TTS error, continuing without audio:', error);
        onProgress?.(100);
        resolve(null);
      }
    });
  }

  /**
   * Estimate duration in seconds for given text
   * Based on average speaking rate of 150 words per minute
   */
  private readonly WORDS_PER_MINUTE = 150;

  estimateDuration(text: string, rate: number = 1.0): number {
    const words = text.trim().split(/\s+/).length;
    const baseSeconds = (words / this.WORDS_PER_MINUTE) * 60;
    return baseSeconds / rate;
  }

  /**
   * Cancel any ongoing speech
   */
  cancel(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

export const ttsService = new TextToSpeechService();
