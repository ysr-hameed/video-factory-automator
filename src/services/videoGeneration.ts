/**
 * Video Generation Service
 * Orchestrates the entire video generation pipeline
 */

import type { Section } from '@/types/video';
import { TextToSpeechService } from './textToSpeech';
import { FrameGeneratorService } from './frameGenerator';
import { VideoRendererService } from './videoRenderer';

export interface VideoGenerationOptions {
  width?: number;
  height?: number;
  fps?: number;
  ttsRate?: number;
  ttsPitch?: number;
}

export interface GenerationProgress {
  step: 'tts' | 'frames' | 'motion' | 'render';
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  message?: string;
}

export class VideoGenerationService {
  private ttsService: TextToSpeechService;
  private options: Required<VideoGenerationOptions>;

  constructor(options: VideoGenerationOptions = {}) {
    this.options = {
      width: options.width ?? 1920,
      height: options.height ?? 1080,
      fps: options.fps ?? 30,
      ttsRate: options.ttsRate ?? 1.0,
      ttsPitch: options.ttsPitch ?? 1.0,
    };

    this.ttsService = new TextToSpeechService();
  }

  /**
   * Generate complete video from sections
   */
  async generateVideo(
    sections: Section[],
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<Blob> {
    try {
      // Step 1: Generate speech for all sections
      onProgress?.({
        step: 'tts',
        progress: 0,
        message: 'Generating text-to-speech...',
      });

      const combinedText = sections.map(s => s.content).join(' ... ');
      const audioBlob = await this.ttsService.textToSpeech(
        combinedText,
        {
          rate: this.options.ttsRate,
          pitch: this.options.ttsPitch,
        },
        (ttsProgress) => {
          onProgress?.({
            step: 'tts',
            progress: ttsProgress,
            message: `Processing text... ${Math.round(ttsProgress)}%`,
          });
        }
      );

      if (!audioBlob) {
        console.info('Continuing video generation without audio');
      }

      // Step 2: Generate frames
      onProgress?.({
        step: 'frames',
        progress: 0,
        message: 'Generating video frames...',
      });

      const frameGenerator = new FrameGeneratorService({
        width: this.options.width,
        height: this.options.height,
        fps: this.options.fps,
      });

      const frames = await frameGenerator.generateFrames(
        sections,
        (frameProgress, currentFrame, totalFrames) => {
          onProgress?.({
            step: 'frames',
            progress: frameProgress,
            currentFrame,
            totalFrames,
            message: `Generating frames... ${currentFrame}/${totalFrames}`,
          });
        }
      );

      // Step 3: Apply motion (simulate for now)
      onProgress?.({
        step: 'motion',
        progress: 0,
        message: 'Applying motion effects...',
      });

      // Simulate motion processing
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        onProgress?.({
          step: 'motion',
          progress: i,
          message: `Applying motion... ${i}%`,
        });
      }

      // Step 4: Render final video
      onProgress?.({
        step: 'render',
        progress: 0,
        message: 'Rendering final video...',
      });

      const videoRenderer = new VideoRendererService({
        fps: this.options.fps,
      });

      const videoBlob = await videoRenderer.renderVideo(
        frames,
        audioBlob ?? undefined,
        (renderProgress) => {
          onProgress?.({
            step: 'render',
            progress: renderProgress,
            message: `Rendering video... ${Math.round(renderProgress)}%`,
          });
        }
      );

      return videoBlob;
    } catch (error) {
      console.error('Video generation error:', error);
      throw error;
    }
  }

  /**
   * Estimate total generation time in seconds
   */
  estimateGenerationTime(sections: Section[]): number {
    const totalDuration = sections.reduce((acc, s) => acc + s.duration, 0);
    const frames = Math.ceil(totalDuration * this.options.fps);
    
    // Rough estimates:
    // TTS: ~5 seconds per minute of speech
    // Frames: ~0.01 seconds per frame
    // Render: ~0.02 seconds per frame
    
    const ttsTime = (totalDuration / 60) * 5;
    const frameTime = frames * 0.01;
    const renderTime = frames * 0.02;
    
    return Math.ceil(ttsTime + frameTime + renderTime);
  }

  /**
   * Cancel ongoing generation
   */
  cancel(): void {
    this.ttsService.cancel();
  }
}
