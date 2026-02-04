/**
 * Frame Generator Service
 * Generates video frames with text overlays and visual effects
 */

import type { Section } from '@/types/video';
import { paintFrame, type FramePaintOptions } from './framePainter';

export interface FrameOptions {
  width: number;
  height: number;
  fps: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

export interface Frame {
  canvas: HTMLCanvasElement;
  timestamp: number;
  sectionId: string;
}

export class FrameGeneratorService {
  private options: FrameOptions;

  constructor(options: FrameOptions) {
    this.options = {
      backgroundColor: '#0a0a0a',
      textColor: '#ffffff',
      fontSize: 48,
      ...options,
    };
  }

  /**
   * Lightweight config getter used by the renderer.
   */
  getConfig(): { width: number; height: number; fps: number } {
    return {
      width: this.options.width,
      height: this.options.height,
      fps: this.options.fps,
    };
  }

  /**
   * Render frames directly into a target canvas (re-using the same canvas)
   * to avoid allocating thousands of 1080p canvases (which crashes the app).
   */
  async renderToCanvas(
    sections: Section[],
    targetCanvas: HTMLCanvasElement,
    onProgress?: (progress: number, currentFrame: number, totalFrames: number) => void,
    signal?: AbortSignal
  ): Promise<void> {
    targetCanvas.width = this.options.width;
    targetCanvas.height = this.options.height;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas 2D context');

    const totalDuration = sections.reduce((acc, s) => acc + s.duration, 0);
    const totalFrames = Math.ceil(totalDuration * this.options.fps);

    let currentTime = 0;
    let frameCount = 0;
    const frameDurationMs = 1000 / this.options.fps;

    // Throttle progress callbacks (React state updates are expensive)
    let lastProgressAt = 0;
    const shouldEmitProgress = () => {
      const now = performance.now();
      if (now - lastProgressAt > 120) {
        lastProgressAt = now;
        return true;
      }
      return false;
    };

    const paintOptions: FramePaintOptions = {
      backgroundColor: this.options.backgroundColor!,
      textColor: this.options.textColor!,
      fontSize: this.options.fontSize!,
    };

    for (const section of sections) {
      const sectionFrames = Math.ceil(section.duration * this.options.fps);

      for (let i = 0; i < sectionFrames; i++) {
        if (signal?.aborted) {
          const err = new Error('Generation cancelled');
          (err as any).name = 'AbortError';
          throw err;
        }

        const progress = i / sectionFrames;
        const timestamp = currentTime + i / this.options.fps;

        paintFrame({
          ctx,
          canvas: targetCanvas,
          section,
          progress,
          timestamp,
          options: paintOptions,
        });

        frameCount++;

        if (shouldEmitProgress() || frameCount === totalFrames) {
          onProgress?.((frameCount / totalFrames) * 100, frameCount, totalFrames);
        }

        // Maintain approximate real-time frame pacing for MediaRecorder
        await new Promise((resolve) => setTimeout(resolve, frameDurationMs));
      }

      currentTime += section.duration;
    }
  }

  /**
   * Generate frames for all sections
   */
  async generateFrames(
    sections: Section[],
    onProgress?: (progress: number, currentFrame: number, totalFrames: number) => void
  ): Promise<Frame[]> {
    const frames: Frame[] = [];
    const totalDuration = sections.reduce((acc, s) => acc + s.duration, 0);
    const totalFrames = Math.ceil(totalDuration * this.options.fps);
    
    let currentTime = 0;
    let frameCount = 0;

    for (const section of sections) {
      const sectionFrames = Math.ceil(section.duration * this.options.fps);
      
      for (let i = 0; i < sectionFrames; i++) {
        const progress = i / sectionFrames;
        const frame = this.generateFrame(section, progress, currentTime + (i / this.options.fps));
        frames.push(frame);
        
        frameCount++;
        onProgress?.(
          (frameCount / totalFrames) * 100,
          frameCount,
          totalFrames
        );
        
        // Yield to prevent blocking the UI
        if (frameCount % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      currentTime += section.duration;
    }

    return frames;
  }

  /**
   * Generate a single frame for a section
   */
  private generateFrame(section: Section, progress: number, timestamp: number): Frame {
    const canvas = document.createElement('canvas');
    canvas.width = this.options.width;
    canvas.height = this.options.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas 2D context');
    }

    paintFrame({
      ctx,
      canvas,
      section,
      progress,
      timestamp,
      options: {
        backgroundColor: this.options.backgroundColor!,
        textColor: this.options.textColor!,
        fontSize: this.options.fontSize!,
      },
    });

    return {
      canvas,
      timestamp,
      sectionId: section.id,
    };
  }
}
