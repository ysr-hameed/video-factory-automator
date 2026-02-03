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
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices(): void {
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
   * Convert text to speech and return audio blob
   */
  async textToSpeech(
    text: string,
    options: TTSOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
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

        // Create audio context for recording
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(destination.stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          audioContext.close();
          resolve(audioBlob);
        };

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
          mediaRecorder.stop();
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          mediaRecorder.stop();
          reject(new Error(`Speech synthesis failed: ${event.error}`));
        };

        // Start recording and speaking
        mediaRecorder.start();
        this.synthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Estimate duration in seconds for given text
   */
  estimateDuration(text: string, rate: number = 1.0): number {
    const wordsPerMinute = 150; // Average speaking rate
    const words = text.trim().split(/\s+/).length;
    const baseSeconds = (words / wordsPerMinute) * 60;
    return baseSeconds / rate;
  }

  /**
   * Cancel any ongoing speech
   */
  cancel(): void {
    this.synthesis.cancel();
  }
}

export const ttsService = new TextToSpeechService();
