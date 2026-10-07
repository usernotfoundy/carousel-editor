import type { EditorDocument } from '../types/editor';
import { renderFullCanvas, renderSlide } from './render';

function pixel(canvas: HTMLCanvasElement, x: number, y: number) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const data = context.getImageData(x, y, 1, 1).data;
  return [data[0], data[1], data[2], data[3]];
}

function equal(a: number[] | null, b: number[] | null) {
  if (!a || !b) return false;
  return a.every((channel, index) => channel === b[index]);
}

function crop(full: HTMLCanvasElement, x: number, y: number, width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not crop the comparison canvas.');
  context.imageSmoothingEnabled = false;
  context.drawImage(full, x, y, width, height, 0, 0, width, height);
  return canvas;
}

const seamDocument = (): EditorDocument => ({
  name: 'Seam check',
  canvas: {
    format: 'portrait',
    slideWidth: 1080,
    slideHeight: 1350,
    slideCount: 2,
    background: {
      type: 'solid',
      color: '#101216',
      gradientFrom: '#101216',
      gradientTo: '#101216',
      angle: 90,
      imageId: null,
    },
  },
  elements: [
    {
      id: 'seam-rect',
      type: 'shape',
      shape: 'rect',
      name: 'Seam',
      x: 1000,
      y: 200,
      width: 200,
      height: 120,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fill: '#ff0030',
      cornerRadius: 0,
    },
  ],
});

/** Confirms per-slide export matches a crop of one continuous render. */
export async function verifyExportSeam() {
  const doc = seamDocument();
  const full = await renderFullCanvas(doc, {});
  const left = await renderSlide(doc, 0, {});
  const right = await renderSlide(doc, 1, {});
  const fullLeft = crop(full.canvas, 0, 0, 1080, 1350);
  const fullRight = crop(full.canvas, 1080, 0, 1080, 1350);
  const samples = [
    { x: 1070, y: 250 },
    { x: 20, y: 250 },
  ];
  const leftOk = equal(pixel(left, samples[0].x, samples[0].y), pixel(fullLeft, samples[0].x, samples[0].y));
  const rightOk = equal(pixel(right, samples[1].x, samples[1].y), pixel(fullRight, samples[1].x, samples[1].y));
  const red = pixel(left, 1070, 250);
  const isRed = !!red && red[0] > 240 && red[1] < 20 && red[2] < 60 && red[3] === 255;
  const sizeOk = left.width === 1080 && left.height === 1350 && right.width === 1080 && right.height === 1350;
  const ok = leftOk && rightOk && isRed && sizeOk;
  if (!ok) {
    console.error('[continuum] Export seam check failed', {
      leftOk,
      rightOk,
      isRed,
      sizeOk,
      red,
      left: pixel(left, 1070, 250),
      fullLeft: pixel(fullLeft, 1070, 250),
      right: pixel(right, 20, 250),
      fullRight: pixel(fullRight, 20, 250),
    });
  }
  return ok;
}
