/**
 * Frame Painter
 * Stateless drawing helpers for rendering a section into a 2D canvas.
 */

import type { Section } from '@/types/video';

export interface FramePaintOptions {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

export interface SectionPaintCache {
  sectionId: string;
  sectionType: Section['type'];
  title: string;
  contentLines: string[];
  gradient: CanvasGradient;
  badgeLabel: string;
  badgeColor: string;
}

const SECTION_COLORS: Record<string, string> = {
  hook: '#dc2626',
  overview: '#2563eb',
  core: '#16a34a',
  myth: '#9333ea',
  summary: '#ea580c',
};

export function paintFrame(args: {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  section: Section;
  progress: number;
  timestamp: number;
  options: FramePaintOptions;
}): void {
  const { ctx, canvas, section, progress, timestamp, options } = args;

  const cache = createSectionPaintCache({ ctx, canvas, section, options });
  paintFrameWithCache({ ctx, canvas, cache, progress, timestamp, options });
}

export function createSectionPaintCache(args: {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  section: Section;
  options: FramePaintOptions;
}): SectionPaintCache {
  const { ctx, canvas, section, options } = args;

  // Precompute gradient for this section
  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );

  const color = SECTION_COLORS[section.type] || '#6366f1';
  gradient.addColorStop(0, `${color}20`);
  gradient.addColorStop(1, 'transparent');

  // Precompute wrapped content lines (this is VERY expensive if done per-frame)
  ctx.font = `${options.fontSize * 0.6}px Arial, sans-serif`;
  const maxWidth = canvas.width * 0.8;
  const contentLines = wrapText(ctx, section.content, maxWidth);

  const badges: Record<string, { label: string; color: string }> = {
    hook: { label: 'HOOK', color: '#dc2626' },
    overview: { label: 'OVERVIEW', color: '#2563eb' },
    core: { label: 'CORE', color: '#16a34a' },
    myth: { label: 'MYTH', color: '#9333ea' },
    summary: { label: 'SUMMARY', color: '#ea580c' },
  };
  const badge = badges[section.type] || { label: 'SECTION', color: '#6366f1' };

  return {
    sectionId: section.id,
    sectionType: section.type,
    title: section.title,
    contentLines,
    gradient,
    badgeLabel: badge.label,
    badgeColor: badge.color,
  };
}

export function paintFrameWithCache(args: {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  cache: SectionPaintCache;
  progress: number;
  timestamp: number;
  options: FramePaintOptions;
}): void {
  const { ctx, canvas, cache, progress, timestamp, options } = args;

  // Clear and draw background
  ctx.globalAlpha = 1;
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gradient overlay by section type
  ctx.fillStyle = cache.gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = options.textColor;
  ctx.font = `bold ${options.fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cache.title, canvas.width / 2, canvas.height / 3);

  // Content with fade
  const opacity = calculateTextOpacity(progress);
  ctx.globalAlpha = opacity;
  ctx.font = `${options.fontSize * 0.6}px Arial, sans-serif`;

  const lines = cache.contentLines;
  const lineHeight = options.fontSize * 0.8;
  const startY = canvas.height / 2;

  const textRevealMultiplier = 2;
  const visibleLines = Math.min(
    lines.length,
    Math.ceil(lines.length * progress * textRevealMultiplier)
  );

  lines.slice(0, visibleLines).forEach((line, index) => {
    const y = startY + (index - visibleLines / 2) * lineHeight;
    ctx.fillText(line, canvas.width / 2, y);
  });

  ctx.globalAlpha = 1;

  drawSectionBadge(ctx, cache.badgeLabel, cache.badgeColor, 40, 40);

  // Timestamp
  ctx.font = '20px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#888888';
  ctx.fillText(formatTime(timestamp), canvas.width - 40, canvas.height - 40);
}

function calculateTextOpacity(progress: number): number {
  if (progress < 0.1) return progress * 10;
  if (progress > 0.9) return (1 - progress) * 10;
  return 1;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawSectionBadge(
  ctx: CanvasRenderingContext2D,
  label: string,
  color: string,
  x: number,
  y: number
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 120, 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 10, y + 15);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
