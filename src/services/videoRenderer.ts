/**
 * Video Renderer Service
 * Renders a canvas stream into a video using MediaRecorder API
 */

import type { Section } from '@/types/video';
import type { FrameGeneratorService } from './frameGenerator';

export interface VideoRenderOptions {
  fps: number;
  videoBitsPerSecond?: number;
  mimeType?: string;
}

export class VideoRendererService {
  private options: VideoRenderOptions;

  constructor(options: VideoRenderOptions) {
    this.options = {
      videoBitsPerSecond: 2500000, // 2.5 Mbps (Megabits per second, ~312.5 KB/s)
      mimeType: 'video/webm;codecs=vp9',
      ...options,
    };

    // Check for VP9 support, fallback to VP8
    if (!MediaRecorder.isTypeSupported(this.options.mimeType!)) {
      this.options.mimeType = 'video/webm;codecs=vp8';
    }
    
    // Final fallback
    if (!MediaRecorder.isTypeSupported(this.options.mimeType!)) {
      this.options.mimeType = 'video/webm';
    }
  }

  /**
   * Render frames to video
   */
  async renderVideo(
    frames: Frame[],
    audioBlob?: Blob,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (frames.length === 0) {
      throw new Error('No frames to render');
    }

    const canvas = frames[0].canvas;
    const stream = canvas.captureStream(this.options.fps);

    // Add audio track if provided
    if (audioBlob) {
      try {
        const audioContext = new AudioContext();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const source = audioContext.createMediaStreamDestination();
        const bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(source);
        
        // Add audio tracks to video stream
        source.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      } catch (error) {
        console.warn('Could not add audio to video:', error);
      }
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: this.options.mimeType,
      videoBitsPerSecond: this.options.videoBitsPerSecond,
    });

    const chunks: Blob[] = [];

    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: this.options.mimeType });
        resolve(videoBlob);
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error(`MediaRecorder error: ${event}`));
      };

      // Start recording
      mediaRecorder.start();

      // Draw frames sequentially
      this.drawFramesSequentially(canvas, frames, onProgress)
        .then(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(reject);
    });
  }

  /**
   * Render a complete video directly from sections without allocating per-frame canvases.
   * This avoids OOM crashes for long scripts.
   */
  async renderVideoFromSections(
    sections: Section[],
    frameGenerator: FrameGeneratorService,
    audioBlob?: Blob,
    onProgress?: (progress: number) => void,
    onFrame?: (currentFrame: number, totalFrames: number) => void,
    signal?: AbortSignal
  ): Promise<Blob> {
    const { width, height, fps } = frameGenerator.getConfig();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const stream = canvas.captureStream(fps);

    // Add audio track if provided
    if (audioBlob) {
      try {
        const audioContext = new AudioContext();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const destination = audioContext.createMediaStreamDestination();
        const bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(destination);
        // Start the buffer immediately; recording/rendering runs in (approx) real time.
        bufferSource.start(0);

        destination.stream.getAudioTracks().forEach((track) => {
          stream.addTrack(track);
        });
      } catch (error) {
        console.warn('Could not add audio to video:', error);
      }
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: this.options.mimeType,
      videoBitsPerSecond: this.options.videoBitsPerSecond,
    });

    const chunks: Blob[] = [];

    return await new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: this.options.mimeType });
        resolve(videoBlob);
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error(`MediaRecorder error: ${event}`));
      };

      // Start recording (timeslice reduces internal buffering / memory spikes)
      try {
        mediaRecorder.start(1000);
      } catch (e) {
        reject(e);
        return;
      }

      frameGenerator
        .renderToCanvas(
          sections,
          canvas,
          (progress, currentFrame, totalFrames) => {
            // Throttle UI updates: only update at most ~10 times per second.
            // (renderToCanvas itself calls this sparsely)
            onProgress?.(progress);
            if (currentFrame && totalFrames) onFrame?.(currentFrame, totalFrames);
          },
          signal
        )
        .then(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch((err) => {
          try {
            mediaRecorder.stop();
          } catch {
            // ignore
          }
          stream.getTracks().forEach((track) => track.stop());
          reject(err);
        });
    });
  }

  /**
   * Draw frames to canvas sequentially at the correct FPS
   */
  private async drawFramesSequentially(
    targetCanvas: HTMLCanvasElement,
    frames: Frame[],
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const frameDuration = 1000 / this.options.fps; // milliseconds per frame
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      
      // Draw frame to canvas
      ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      ctx.drawImage(frame.canvas, 0, 0);
      
      // Update progress
      const progress = ((i + 1) / frames.length) * 100;
      onProgress?.(progress);

      // Wait for next frame time
      await new Promise(resolve => setTimeout(resolve, frameDuration));
    }
  }

  /**
   * Get supported MIME types
   */
  static getSupportedMimeTypes(): string[] {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      'video/webm',
      'video/mp4',
    ];

    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }
}

// Backward-compat type import (kept local so existing code compiles with minimal edits)
type Frame = {
  canvas: HTMLCanvasElement;
  timestamp: number;
  sectionId: string;
};
