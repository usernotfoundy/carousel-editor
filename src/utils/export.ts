import type { AssetMap, EditorDocument, ExportFormat } from '../types/editor';
import { canvasToBlob, renderSlide } from './render';

export type ExportedSlide = {
  name: string;
  blob: Blob;
  url: string;
};

export type ExportProgress = {
  current: number;
  total: number;
};

export async function exportCarousel(
  doc: EditorDocument,
  assets: AssetMap,
  format: ExportFormat,
  hooks: {
    onProgress: (progress: ExportProgress) => void;
    isAborted: () => boolean;
  },
) {
  const total = doc.canvas.slideCount;
  const extension = format === 'jpeg' ? 'jpg' : 'png';
  const slides: ExportedSlide[] = [];

  for (let index = 0; index < total; index += 1) {
    if (hooks.isAborted()) return null;
    hooks.onProgress({ current: index, total });
    await new Promise<void>((resolve) => window.setTimeout(resolve, 20));
    const canvas = await renderSlide(doc, index, assets);
    if (canvas.width !== doc.canvas.slideWidth || canvas.height !== doc.canvas.slideHeight) {
      throw new Error(
        `Slide ${index + 1} exported at ${canvas.width}×${canvas.height} instead of ${doc.canvas.slideWidth}×${doc.canvas.slideHeight}.`,
      );
    }
    const blob = await canvasToBlob(canvas, format);
    const name = `carousel-slide-${String(index + 1).padStart(2, '0')}.${extension}`;
    slides.push({ name, blob, url: URL.createObjectURL(blob) });
    hooks.onProgress({ current: index + 1, total });
  }

  if (hooks.isAborted()) {
    slides.forEach((slide) => URL.revokeObjectURL(slide.url));
    return null;
  }

  return {
    slides,
    count: total,
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}
