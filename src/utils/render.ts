import Konva from 'konva';
import type { AssetMap, EditorDocument, EditorElement } from '../types/editor';
import { fontLabel } from './formats';
import {
  MISSING_IMAGE_FILL,
  backgroundImageConfig,
  backgroundRectConfig,
  ellipseConfig,
  imageConfig,
  paintEllipse,
  rectConfig,
  textConfig,
} from './nodeConfig';

const BLEED = 8;

export async function prepareFonts(doc: EditorDocument) {
  const jobs: Promise<unknown>[] = [];
  for (const element of doc.elements) {
    if (element.type !== 'text' || !element.visible) continue;
    const family = fontLabel(element.fontFamily);
    jobs.push(document.fonts.load(`${element.fontWeight} ${element.fontSize}px "${family}"`).catch(() => undefined));
  }
  await Promise.all(jobs);
  await document.fonts.ready;
}

function createNode(element: EditorElement, assets: AssetMap, shiftX: number) {
  if (!element.visible) return null;
  if (element.type === 'image') {
    const asset = assets[element.imageId];
    if (!asset) {
      return new Konva.Rect({
        x: element.x + shiftX,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        opacity: element.opacity,
        fill: MISSING_IMAGE_FILL,
        listening: false,
      });
    }
    return new Konva.Image({
      ...imageConfig(element, asset.image, shiftX),
      listening: false,
    });
  }
  if (element.type === 'text') {
    return new Konva.Text({
      ...textConfig(element, shiftX),
      listening: false,
    });
  }
  if (element.shape === 'ellipse') {
    return new Konva.Shape({
      ...ellipseConfig(element, shiftX),
      sceneFunc: paintEllipse,
      listening: false,
    });
  }
  return new Konva.Rect({
    ...rectConfig(element, shiftX),
    listening: false,
  });
}

function addScene(parent: Konva.Container, doc: EditorDocument, assets: AssetMap, shiftX: number) {
  parent.add(new Konva.Rect({ ...backgroundRectConfig(doc.canvas, shiftX), listening: false }));
  const imageId = doc.canvas.background.imageId;
  const background = imageId ? assets[imageId] : undefined;
  if (background) {
    parent.add(new Konva.Image({ ...backgroundImageConfig(doc.canvas, background, shiftX), listening: false }));
  }
  for (const element of doc.elements) {
    const node = createNode(element, assets, shiftX);
    if (node) parent.add(node);
  }
}

async function renderStage(width: number, height: number, draw: (layer: Konva.Layer) => void) {
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = `position:fixed;left:-16000px;top:0;width:${width}px;height:${height}px;overflow:hidden;pointer-events:none;`;
  document.body.appendChild(container);
  const stage = new Konva.Stage({ container, width, height });
  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);
  try {
    draw(layer);
    layer.draw();
    const canvas = stage.toCanvas({
      x: 0,
      y: 0,
      width,
      height,
      pixelRatio: 1,
      imageSmoothingEnabled: true,
    });
    if (canvas.width !== width || canvas.height !== height) {
      throw new Error(`Rendered ${canvas.width}×${canvas.height} instead of ${width}×${height}.`);
    }
    const copy = document.createElement('canvas');
    copy.width = width;
    copy.height = height;
    const context = copy.getContext('2d');
    if (!context) throw new Error('Could not copy the rendered slide.');
    context.imageSmoothingEnabled = false;
    context.drawImage(canvas, 0, 0);
    return copy;
  } finally {
    stage.destroy();
    container.remove();
  }
}

export async function renderFullCanvas(doc: EditorDocument, assets: AssetMap, frameWidth?: number) {
  await prepareFonts(doc);
  const slideW = doc.canvas.slideWidth;
  const slideH = doc.canvas.slideHeight;
  let frameW = Math.max(1, Math.round(frameWidth ?? slideW));
  const maxStrip = 8192;
  if (frameW * doc.canvas.slideCount > maxStrip) {
    frameW = Math.max(1, Math.floor(maxStrip / doc.canvas.slideCount));
  }
  const scale = frameW / slideW;
  const frameH = Math.max(1, Math.round(slideH * scale));
  const width = frameW * doc.canvas.slideCount;
  const height = frameH;
  const canvas = await renderStage(width, height, (layer) => {
    const group = new Konva.Group({ scaleX: scale, scaleY: scale, listening: false });
    layer.add(group);
    addScene(group, doc, assets, 0);
  });
  return { canvas, frameWidth: frameW, frameHeight: frameH };
}

/**
 * Renders one slide from document coordinates.
 * A few pixels of neighboring canvas are drawn first, then cropped away, so
 * image smoothing at the cut matches a single continuous render.
 */
export async function renderSlide(doc: EditorDocument, slideIndex: number, assets: AssetMap) {
  await prepareFonts(doc);
  const slideW = doc.canvas.slideWidth;
  const slideH = doc.canvas.slideHeight;
  const originX = slideIndex * slideW - BLEED;
  const stageW = slideW + BLEED * 2;
  const stageH = slideH + BLEED * 2;
  const raw = await renderStage(stageW, stageH, (layer) => {
    addScene(layer, doc, assets, -originX);
  });
  const slide = document.createElement('canvas');
  slide.width = slideW;
  slide.height = slideH;
  const context = slide.getContext('2d');
  if (!context) throw new Error('Could not crop the exported slide.');
  context.imageSmoothingEnabled = false;
  context.drawImage(raw, BLEED, BLEED, slideW, slideH, 0, 0, slideW, slideH);
  return slide;
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: 'png' | 'jpeg') {
  const type = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not encode a slide.'));
      },
      type,
      format === 'jpeg' ? 0.92 : undefined,
    );
  });
}
