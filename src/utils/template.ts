import type { EditorDocument, EditorElement } from '../types/editor';
import { idbGet, idbPut } from './storage';
import { drawImageHolder } from './imageHolder';
export { drawImageHolder } from './imageHolder';
export { CAROUSEL_TEMPLATES, getTemplates, getTemplateById, loadTemplateAssets } from './templateDefinitions';
export type { CarouselTemplate, TemplateCategory, TemplateMeta } from '../types/template';

export const TEMPLATE_IMAGE_ID = 'template-hero-holder-v2';

const IMAGE_X = 40;
const IMAGE_Y = 210;
const IMAGE_W = 2120;
const IMAGE_H = 960;

export function drawHero(width = IMAGE_W, height = IMAGE_H) {
  return drawImageHolder(width, height, 'Add Photo', 'Click or tap to choose image');
}

export async function ensureTemplateHero() {
  const existing = await idbGet(TEMPLATE_IMAGE_ID);
  if (existing) return;
  const blob = await drawImageHolder(IMAGE_W, IMAGE_H, 'Add Photo', 'Click or tap to choose image');
  await idbPut(TEMPLATE_IMAGE_ID, blob);
}

function baseElement(partial: Pick<EditorElement, 'id' | 'name' | 'x' | 'y' | 'width' | 'height'>) {
  return {
    ...partial,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };
}

export function createTemplateDocument(): EditorDocument {
  return {
    name: 'Seamless study',
    canvas: {
      format: 'portrait',
      slideWidth: 1080,
      slideHeight: 1350,
      slideCount: 3,
      background: {
        type: 'gradient',
        color: '#141820',
        gradientFrom: '#1a2333',
        gradientTo: '#4a332c',
        angle: 90,
        imageId: null,
      },
    },
    elements: [
      {
        ...baseElement({
          id: 'template-hero',
          name: 'Horizon',
          x: IMAGE_X,
          y: IMAGE_Y,
          width: IMAGE_W,
          height: IMAGE_H,
        }),
        type: 'image',
        imageId: TEMPLATE_IMAGE_ID,
        lockAspect: true,
        aspectRatio: IMAGE_W / IMAGE_H,
      },
      {
        ...baseElement({
          id: 'template-title',
          name: 'Title',
          x: 640,
          y: 78,
          width: 1500,
          height: 140,
        }),
        type: 'text',
        text: 'SEAMLESS',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 104,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 14,
        lineHeight: 1,
        fill: '#f7f1e8',
      },
      {
        ...baseElement({
          id: 'template-rule',
          name: 'Rule',
          x: 2288,
          y: 430,
          width: 84,
          height: 8,
        }),
        type: 'shape',
        shape: 'rect',
        fill: '#e7c9a4',
        cornerRadius: 4,
      },
      {
        ...baseElement({
          id: 'template-kicker',
          name: 'Kicker',
          x: 2288,
          y: 460,
          width: 760,
          height: 36,
        }),
        type: 'text',
        text: 'CONTINUOUS',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 22,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 6,
        lineHeight: 1.2,
        fill: '#e7c9a4',
      },
      {
        ...baseElement({
          id: 'template-subtitle',
          name: 'Subtitle',
          x: 2288,
          y: 510,
          width: 820,
          height: 180,
        }),
        type: 'text',
        text: 'One canvas.\nEvery slide.',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 64,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 0,
        lineHeight: 1.05,
        fill: '#f6f1ea',
      },
    ],
  };
}

export function createBlankDocument(): EditorDocument {
  return {
    name: 'Untitled carousel',
    canvas: {
      format: 'portrait',
      slideWidth: 1080,
      slideHeight: 1350,
      slideCount: 3,
      background: {
        type: 'solid',
        color: '#16181d',
        gradientFrom: '#1a2333',
        gradientTo: '#3d2c28',
        angle: 90,
        imageId: null,
      },
    },
    elements: [],
  };
}
