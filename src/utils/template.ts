import type { EditorDocument, EditorElement } from '../types/editor';
import { idbGet, idbPut } from './storage';

export const TEMPLATE_IMAGE_ID = 'template-hero-v1';

const IMAGE_X = 40;
const IMAGE_Y = 210;
const IMAGE_W = 2120;
const IMAGE_H = 960;

export function drawHero(width = IMAGE_W, height = IMAGE_H) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('Could not create the sample image.'));

  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#f6dcc0');
  sky.addColorStop(0.42, '#e38d78');
  sky.addColorStop(0.74, '#35527d');
  sky.addColorStop(1, '#18243f');
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  const sunX = 1080 - IMAGE_X;
  context.fillStyle = 'rgba(255, 236, 196, 0.45)';
  context.beginPath();
  context.arc(sunX, 300, 210, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#fff3d4';
  context.beginPath();
  context.arc(sunX, 300, 132, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#3d5a86';
  context.beginPath();
  context.moveTo(0, 560);
  context.bezierCurveTo(360, 430, 760, 690, 1160, 520);
  context.bezierCurveTo(1560, 360, 1840, 600, width, 470);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  context.fillStyle = '#1c2c4b';
  context.beginPath();
  context.moveTo(0, 730);
  context.bezierCurveTo(480, 590, 980, 840, 1500, 680);
  context.bezierCurveTo(1760, 600, 1960, 760, width, 690);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  context.fillStyle = '#121c33';
  context.beginPath();
  context.moveTo(0, 860);
  context.bezierCurveTo(700, 760, 1300, 920, width, 800);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create the sample image.'));
    }, 'image/png');
  });
}

export async function ensureTemplateHero() {
  const existing = await idbGet(TEMPLATE_IMAGE_ID);
  if (existing) return;
  const blob = await drawHero();
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
