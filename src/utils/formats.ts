import type { CanvasSettings, FormatId, EditorDocument, EditorElement } from '../types/editor';

export const FORMATS: { id: FormatId; label: string; aspect: string; width: number; height: number }[] = [
  { id: 'portrait', label: 'Portrait', aspect: '4:5', width: 1080, height: 1350 },
  { id: 'square', label: 'Square', aspect: '1:1', width: 1080, height: 1080 },
  { id: 'landscape', label: 'Landscape', aspect: '16:9', width: 1080, height: 566 },
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

/**
 * Adapt an EditorDocument from its current format to a target format
 * (e.g. portrait 1080x1350 -> square 1080x1080 or landscape 1080x566).
 * Rescales vertical positions, heights, shapes, and font sizes proportionally
 * to maintain visual harmony without overflowing or cutting off elements.
 */
export function adaptDocumentToFormat(doc: EditorDocument, targetFormat: FormatId): EditorDocument {
  const currentFormat = doc.canvas.format || 'portrait';
  if (currentFormat === targetFormat) return doc;

  const currentHeight = doc.canvas.slideHeight || formatPreset(currentFormat).height;
  const targetPreset = formatPreset(targetFormat);
  const targetHeight = targetPreset.height;
  const scaleY = targetHeight / currentHeight;

  const elements = doc.elements.map((el): EditorElement => {
    // Check if element is full-canvas height
    const isFullHeight = Math.abs(el.y) <= 4 && Math.abs(el.height - currentHeight) <= 6;

    if (isFullHeight) {
      if (el.type === 'image') {
        return {
          ...el,
          y: 0,
          height: targetHeight,
          aspectRatio: el.width / targetHeight,
        };
      }
      if (el.type === 'shape') {
        return {
          ...el,
          y: 0,
          height: targetHeight,
        };
      }
    }

    if (el.type === 'text') {
      const fontScale =
        targetFormat === 'landscape'
          ? currentFormat === 'portrait'
            ? 0.60
            : 0.68
          : targetFormat === 'square'
          ? currentFormat === 'landscape'
            ? 1.45
            : 0.88
          : currentFormat === 'landscape'
          ? 1.65
          : 1.14;

      const newFontSize = Math.max(10, Math.round(el.fontSize * fontScale));
      const heightScale = targetFormat === 'landscape' ? 0.65 : targetFormat === 'square' ? 0.88 : 1.14;
      const newHeight = Math.max(16, Math.round(el.height * heightScale));
      const rawY = Math.round(el.y * scaleY);
      const maxY = Math.max(8, targetHeight - newHeight - 12);
      const newY = Math.min(Math.max(8, rawY), maxY);

      return {
        ...el,
        y: newY,
        height: newHeight,
        fontSize: newFontSize,
      };
    }

    const newHeight = Math.max(8, Math.round(el.height * scaleY));
    const rawY = Math.round(el.y * scaleY);
    const maxY = Math.max(0, targetHeight - newHeight);
    const newY = Math.min(Math.max(0, rawY), maxY);

    if (el.type === 'image') {
      return {
        ...el,
        y: newY,
        height: newHeight,
        aspectRatio: el.width / newHeight,
      };
    }

    // Shape element
    return {
      ...el,
      y: newY,
      height: newHeight,
      cornerRadius: el.cornerRadius ? Math.max(2, Math.round(el.cornerRadius * Math.min(1, scaleY))) : 0,
    };
  });

  return {
    ...doc,
    canvas: {
      ...doc.canvas,
      format: targetFormat,
      slideWidth: targetPreset.width,
      slideHeight: targetHeight,
    },
    elements,
  };
}
