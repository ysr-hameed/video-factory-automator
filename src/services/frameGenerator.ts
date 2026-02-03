/**
 * Frame Generator Service
 * Generates video frames with text overlays and visual effects
 */

import type { Section } from '@/types/video';

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
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: FrameOptions;

  constructor(options: FrameOptions) {
    this.options = {
      backgroundColor: '#0a0a0a',
      textColor: '#ffffff',
      fontSize: 48,
      ...options,
    };
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas 2D context');
    }
    this.ctx = context;
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

    // Clear and draw background
    ctx.fillStyle = this.options.backgroundColor!;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add gradient overlay based on section type
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    );
    
    const sectionColors: Record<string, string> = {
      hook: '#dc2626',
      overview: '#2563eb',
      core: '#16a34a',
      myth: '#9333ea',
      summary: '#ea580c',
    };
    
    const color = sectionColors[section.type] || '#6366f1';
    gradient.addColorStop(0, `${color}20`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = this.options.textColor!;
    ctx.font = `bold ${this.options.fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const title = section.title;
    ctx.fillText(title, canvas.width / 2, canvas.height / 3);

    // Draw animated content text with fade effect
    const opacity = this.calculateTextOpacity(progress);
    ctx.globalAlpha = opacity;
    ctx.font = `${this.options.fontSize! * 0.6}px Arial, sans-serif`;
    
    // Word-wrap the content
    const maxWidth = canvas.width * 0.8;
    const lines = this.wrapText(ctx, section.content, maxWidth);
    const lineHeight = this.options.fontSize! * 0.8;
    const startY = canvas.height / 2;
    
    // Show progressive text reveal (2x speed for better visual effect)
    const textRevealMultiplier = 2;
    const visibleLines = Math.min(
      lines.length,
      Math.ceil(lines.length * progress * textRevealMultiplier)
    );
    
    lines.slice(0, visibleLines).forEach((line, index) => {
      const y = startY + (index - visibleLines / 2) * lineHeight;
      ctx.fillText(line, canvas.width / 2, y);
    });

    // Reset alpha
    ctx.globalAlpha = 1.0;

    // Draw section type badge
    this.drawSectionBadge(ctx, section.type, 40, 40);

    // Draw timestamp
    ctx.font = '20px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#888888';
    ctx.fillText(this.formatTime(timestamp), canvas.width - 40, canvas.height - 40);

    return {
      canvas,
      timestamp,
      sectionId: section.id,
    };
  }

  private calculateTextOpacity(progress: number): number {
    // Fade in at start, fade out at end
    if (progress < 0.1) {
      return progress * 10;
    } else if (progress > 0.9) {
      return (1 - progress) * 10;
    }
    return 1.0;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private drawSectionBadge(ctx: CanvasRenderingContext2D, type: string, x: number, y: number): void {
    const badges: Record<string, { label: string; color: string }> = {
      hook: { label: 'HOOK', color: '#dc2626' },
      overview: { label: 'OVERVIEW', color: '#2563eb' },
      core: { label: 'CORE', color: '#16a34a' },
      myth: { label: 'MYTH', color: '#9333ea' },
      summary: { label: 'SUMMARY', color: '#ea580c' },
    };

    const badge = badges[type] || { label: 'SECTION', color: '#6366f1' };

    ctx.fillStyle = badge.color;
    ctx.fillRect(x, y, 120, 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge.label, x + 10, y + 15);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}
