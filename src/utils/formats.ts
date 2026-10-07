import type { CanvasSettings, FormatId } from '../types/editor';

export const FORMATS: { id: FormatId; label: string; width: number; height: number }[] = [
  { id: 'portrait', label: 'Portrait', width: 1080, height: 1350 },
  { id: 'square', label: 'Square', width: 1080, height: 1080 },
  { id: 'landscape', label: 'Landscape', width: 1080, height: 566 },
];

export const SLIDE_SHORTCUTS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
export const MIN_SLIDES = 1;
export const MAX_SLIDES = 20;

export function formatPreset(id: FormatId) {
  return FORMATS.find((format) => format.id === id) ?? FORMATS[0];
}

export function totalWidth(canvas: Pick<CanvasSettings, 'slideWidth' | 'slideCount'>) {
  return canvas.slideWidth * canvas.slideCount;
}

export const FONT_FAMILIES = [
  'Outfit, sans-serif',
  'Fraunces, Georgia, serif',
  'Arial, Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, Times, serif',
  'Courier New, Courier, monospace',
  'Verdana, Geneva, sans-serif',
  'Impact, Haettenschweiler, sans-serif',
];

export const FONT_WEIGHTS = [400, 500, 600, 700, 800];

export function fontLabel(family: string) {
  return family.split(',')[0]?.replace(/["']/g, '').trim() || family;
}
